
"use client";

import ClientAuthGuard from '@/components/ClientAuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Ticket, Users, Train, CreditCard, ShieldCheck, Home, ArrowLeft, Loader2 } from 'lucide-react';
import { useEffect, useState, Suspense } from 'react'; // Added Suspense
import type { PassengerFormValues, Booking, GstDetails, TrainDetailed as TrainDetailsType } from '@/lib/types'; 
import { MOCK_TRAINS } from '@/lib/mock-data';
import { auth, firestore } from '@/lib/firebase/config';
import { collection, addDoc } from "firebase/firestore";
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const trainId = searchParams.get('trainId');
  const date = searchParams.get('date'); 
  const selectedClassQuery = searchParams.get('class');
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const numPassengersQuery = searchParams.get('numPassengers');
  const selectedSeatsQuery = searchParams.get('selectedSeats');


  const [passengers, setPassengers] = useState<PassengerFormValues[]>([]);
  const [trainDetails, setTrainDetails] = useState<TrainDetailsType | null>(null);
  const [ticketFare, setTicketFare] = useState(0);
  const [convenienceFee, setConvenienceFee] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [actualSelectedSeats, setActualSelectedSeats] = useState<string[]>([]);

  useEffect(() => {
    const storedPassengers = localStorage.getItem('pendingBookingPassengers');
    const seatsFromQuery = selectedSeatsQuery ? selectedSeatsQuery.split(',') : [];
    setActualSelectedSeats(seatsFromQuery);

    if (storedPassengers) {
      let parsedPassengers: PassengerFormValues[] = JSON.parse(storedPassengers);
      // Ensure passengers list length matches selected seats count
      if (parsedPassengers.length !== seatsFromQuery.length) {
          // If mismatch, take the minimum of the two or decide on a strategy
          // For now, let's assume we only process passengers up to the number of selected seats
          parsedPassengers = parsedPassengers.slice(0, seatsFromQuery.length);
      }
      
      setPassengers(parsedPassengers.map((p, index) => ({
        ...p,
        seatNumber: seatsFromQuery[index] || `S${index + 1}`, // Assign seat number
        bookingStatus: p.age && p.age > 18 ? 'CNF' : 'WL', 
        currentStatus: p.age && p.age > 18 ? `CNF/${seatsFromQuery[index] || `S${index+1}`}/BERTH` : `WL/${index+5}`,
      })));
    } else if (seatsFromQuery.length > 0) {
        // If no passengers in local storage but seats are in query, create placeholder passengers
        // This case should ideally be handled by ensuring passenger details are always captured first
        const placeholderPassengers = seatsFromQuery.map((seat, index) => ({
            name: `Passenger ${index + 1}`,
            age: 30, // Default age
            gender: 'male' as 'male' | 'female' | 'other', // Default gender
            preferredBerth: 'no_preference' as 'lower' | 'middle' | 'upper' | 'side_lower' | 'side_upper' | 'no_preference',
            seatNumber: seat,
            bookingStatus: 'CNF',
            currentStatus: `CNF/${seat}/BERTH`,
        }));
        setPassengers(placeholderPassengers);
    }


    if (trainId && (numPassengersQuery || seatsFromQuery.length > 0)) {
      const foundTrain = MOCK_TRAINS.find(t => t.id === trainId);
      if (foundTrain) {
        setTrainDetails(foundTrain);
        const pricePerPassenger = foundTrain.price; 
        const numActualPassengers = seatsFromQuery.length > 0 ? seatsFromQuery.length : parseInt(numPassengersQuery || "0", 10);
        
        const calculatedTicketFare = pricePerPassenger * numActualPassengers;
        // More realistic convenience fee: fixed + per passenger
        const baseConvenienceFee = 20; // Rs. 20 base
        const perPassengerConvenienceFee = 11.80; // Rs. 11.80 per passenger (incl GST)
        const calculatedConvenienceFee = baseConvenienceFee + (perPassengerConvenienceFee * numActualPassengers);

        setTicketFare(calculatedTicketFare);
        setConvenienceFee(calculatedConvenienceFee);
        setTotalPrice(calculatedTicketFare + calculatedConvenienceFee);

      }
    }
  }, [trainId, numPassengersQuery, selectedSeatsQuery, date]); // Added date to dependencies if it can influence pricing or train details


  const handleConfirmPayment = async () => {
    setIsProcessingPayment(true);
    const currentUser = auth.currentUser;

    if (!currentUser || !trainDetails || !trainId || !date || !selectedClassQuery || !origin || !destination || passengers.length === 0 || actualSelectedSeats.length === 0) {
      toast({
        title: "Error",
        description: "Missing booking information, user not logged in, or no seats selected. Cannot proceed.",
        variant: "destructive",
      });
      setIsProcessingPayment(false);
      return;
    }
    
    const mockGstDetails: GstDetails = {
      invoiceNumber: `PS${Date.now().toString().slice(-10)}`,
      supplierSacCode: "996421", // Railway transport services
      supplierGstin: "07AAAGM0289C1ZL", // Example GSTIN for Indian Railways (illustrative)
      supplierAddress: "Indian Railways, Rail Bhavan, New Delhi - 110001", 
      recipientGstin: "NA", // Assuming B2C transaction
      recipientName: currentUser.displayName || passengers[0]?.name || "Valued Customer",
      recipientAddress: "NA", 
      taxableValue: ticketFare, 
      cgstRate: "2.5%",
      cgstAmount: parseFloat((ticketFare * 0.025).toFixed(2)),
      sgstUtgstRate: "2.5%", 
      sgstUtgstAmount: parseFloat((ticketFare * 0.025).toFixed(2)),
      igstRate: "0.0%", 
      igstAmount: 0,
    };


    const bookingData: Booking = {
      id: '', // Will be set by Firestore
      userId: currentUser.uid,
      trainId: trainId,
      trainName: trainDetails.trainName,
      trainNumber: trainDetails.trainNumber,
      origin: origin,
      destination: destination,
      travelDate: date, 
      departureTime: trainDetails.departureTime,
      arrivalTime: trainDetails.arrivalTime,
      passengersList: passengers, 
      seats: actualSelectedSeats, 
      numPassengers: actualSelectedSeats.length,
      totalPrice: totalPrice,
      ticketFare: ticketFare, 
      convenienceFee: convenienceFee, 
      status: 'upcoming',
      bookingDate: new Date().toISOString(),
      selectedClass: selectedClassQuery.toUpperCase(), 

      pnr: Math.random().toString().slice(2, 12).toUpperCase(), 
      quota: "GENERAL (GN)", 
      distance: `${Math.floor(Math.random() * 500) + 200} KM`, 
      transactionId: `TRN${Date.now()}`, 
      gstDetails: mockGstDetails,
    };

    try {
      const docRef = await addDoc(collection(firestore, "bookings"), bookingData);
      toast({
        title: "Payment Successful!",
        description: `Your booking (ID: ${docRef.id}) is confirmed. PNR: ${bookingData.pnr}`,
      });
      localStorage.removeItem('pendingBookingPassengers');
      router.push('/bookings');
    } catch (error) {
      console.error("Error saving booking: ", error);
      toast({
        title: "Booking Save Failed",
        description: "Could not save your booking details. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (!trainId || !date || !selectedClassQuery || (!numPassengersQuery && actualSelectedSeats.length === 0)) {
    return (
      <div className="max-w-md mx-auto py-12">
          <Alert variant="destructive">
              <Ticket className="h-4 w-4" />
              <AlertTitle>Error: Incomplete Information</AlertTitle>
              <AlertDescription>
                  Booking details are missing. Please start the booking process again.
                  <Button variant="link" asChild className="mt-2">
                      <Link href="/">Go to Home</Link>
                  </Button>
              </AlertDescription>
          </Alert>
      </div>
    )
  }
  const numPassengersDisplay = actualSelectedSeats.length > 0 ? actualSelectedSeats.length : parseInt(numPassengersQuery || "0", 10);


  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4" disabled={isProcessingPayment}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
              <CreditCard className="mr-3 h-8 w-8 text-primary" />
              Confirm Your Payment
          </CardTitle>
          <CardDescription>Review your booking details and complete the payment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {trainDetails && (
              <Alert className="border-primary/30 bg-primary/5">
                  <Train className="h-5 w-5 text-primary" />
                  <AlertTitle className="text-primary font-semibold">Booking Summary</AlertTitle>
                  <AlertDescription className="mt-2 space-y-1 text-sm">
                      <p><strong>Train:</strong> {trainDetails.trainName} ({trainDetails.trainNumber})</p>
                      <p><strong>Route:</strong> {origin} to {destination}</p>
                      <p><strong>Date:</strong> {format(new Date(date + "T00:00:00"), 'PPP')}</p>
                      <p><strong>Class:</strong> <span className="font-semibold">{selectedClassQuery.toUpperCase()}</span></p>
                      <p><strong>Passengers:</strong> {numPassengersDisplay}</p>
                      {actualSelectedSeats.length > 0 && <p><strong>Seats:</strong> {actualSelectedSeats.join(', ')}</p>}
                  </AlertDescription>
              </Alert>
          )}

          {passengers.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2 mt-4 flex items-center">
                  <Users className="mr-2 h-5 w-5 text-muted-foreground" /> Passengers ({passengers.length})
              </h3>
              <ul className="list-disc list-inside pl-4 space-y-1 text-sm text-muted-foreground max-h-32 overflow-y-auto">
                {passengers.map((p, i) => (
                  <li key={i}>
                    {p.name} (Age: {p.age}, Gender: {p.gender.charAt(0).toUpperCase() + p.gender.slice(1)})
                    {p.seatNumber && <span className="ml-2 text-xs">(Seat: {p.seatNumber})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="border-t pt-4 mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ticket Fare ({numPassengersDisplay}x):</span>
                  <span>₹{ticketFare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IRCTC Convenience Fee (Incl. GST):</span>
                  <span>₹{convenienceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-2">
                  <span>Total Amount:</span>
                  <span className="text-green-600">₹{totalPrice.toFixed(2)}</span>
              </div>
          </div>

          <Alert className="mt-6 border-green-500/50 bg-green-500/5">
              <ShieldCheck className="h-5 w-5 text-green-600"/>
              <AlertTitle className="text-green-700">Secure Payment</AlertTitle>
              <AlertDescription>
                  This is a simulated payment gateway. Clicking "Confirm & Pay" will save your booking to the database. No real transaction will occur.
              </AlertDescription>
          </Alert>

        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <Button variant="outline" onClick={() => router.push('/')} className="w-full sm:w-auto" disabled={isProcessingPayment}>
              <Home className="mr-2 h-4 w-4" /> Cancel & Go Home
          </Button>
          <Button 
              size="lg" 
              onClick={handleConfirmPayment} 
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
              disabled={isProcessingPayment || passengers.length === 0 || !trainDetails || actualSelectedSeats.length === 0}
          >
            {isProcessingPayment ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
            {isProcessingPayment ? 'Processing...' : `Confirm & Pay ₹${totalPrice.toFixed(2)}`}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}


export default function PaymentPage() {
  return (
    <ClientAuthGuard>
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">Loading payment details...</p>
        </div>
      }>
        <PaymentPageContent />
      </Suspense>
    </ClientAuthGuard>
  );
}
