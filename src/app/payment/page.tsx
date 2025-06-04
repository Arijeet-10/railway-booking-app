
"use client";

import ClientAuthGuard from '@/components/ClientAuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Ticket, Users, CalendarDays, Train, CreditCard, ShieldCheck, Home, ArrowLeft, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PassengerFormValues, Booking, GstDetails } from '@/lib/types'; // Added Booking, GstDetails
import { MOCK_TRAINS } from '@/lib/mock-data';
import type { TrainDetailed } from '@/lib/types';
import { auth, firestore } from '@/lib/firebase/config';
import { collection, addDoc } from "firebase/firestore";
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';


export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const trainId = searchParams.get('trainId');
  const date = searchParams.get('date'); // This is YYYY-MM-DD string
  const selectedClassQuery = searchParams.get('class');
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const numPassengersQuery = searchParams.get('numPassengers'); // String from query

  const [passengers, setPassengers] = useState<PassengerFormValues[]>([]);
  const [trainDetails, setTrainDetails] = useState<TrainDetailed | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    const storedPassengers = localStorage.getItem('pendingBookingPassengers');
    if (storedPassengers) {
      const parsedPassengers: PassengerFormValues[] = JSON.parse(storedPassengers);
      // Add mock bookingStatus and currentStatus for PDF generation
      setPassengers(parsedPassengers.map(p => ({
        ...p,
        bookingStatus: p.age && p.age > 18 ? 'CNF/S10/34' : 'WL/15', // Mock status
        currentStatus: p.age && p.age > 18 ? 'CNF/S10/34' : 'WL/5', // Mock status
      })));
    }

    if (trainId) {
      const foundTrain = MOCK_TRAINS.find(t => t.id === trainId);
      if (foundTrain) {
        setTrainDetails(foundTrain);
        const pricePerPassenger = foundTrain.price; // This is assumed to be ticketFare
        const numActualPassengers = parseInt(numPassengersQuery || '0', 10);
        const calculatedTicketFare = pricePerPassenger * numActualPassengers;
        const calculatedConvenienceFee = 11.80 * numActualPassengers; // Mock convenience fee
        setTotalPrice(calculatedTicketFare + calculatedConvenienceFee);

      }
    }
  }, [trainId, numPassengersQuery]);


  const handleConfirmPayment = async () => {
    setIsProcessingPayment(true);
    const currentUser = auth.currentUser;

    if (!currentUser || !trainDetails || !trainId || !date || !selectedClassQuery || !origin || !destination || passengers.length === 0) {
      toast({
        title: "Error",
        description: "Missing booking information or user not logged in. Cannot proceed.",
        variant: "destructive",
      });
      setIsProcessingPayment(false);
      return;
    }

    const numActualPassengers = parseInt(numPassengersQuery || '0', 10);
    const calculatedTicketFare = trainDetails.price * numActualPassengers;
    const calculatedConvenienceFee = 11.80 * numActualPassengers; // Mock convenience fee based on PDF

    const mockGstDetails: GstDetails = {
      invoiceNumber: `PS${Date.now().toString().slice(-10)}`,
      supplierSacCode: "996421",
      supplierGstin: "07AAAGM0289C1ZL", // Mock
      supplierAddress: "Indian Railways, New Delhi", // Mock
      recipientGstin: "NA",
      recipientName: currentUser.displayName || "NA",
      recipientAddress: "NA", // Mock
      taxableValue: calculatedTicketFare, // Assuming ticket fare is taxable value
      cgstRate: "2.5%",
      cgstAmount: calculatedTicketFare * 0.025,
      sgstUtgstRate: "2.5%", // Or NA based on region
      sgstUtgstAmount: calculatedTicketFare * 0.025,
      igstRate: "0.0%", // Or 5% if applicable
      igstAmount: 0,
    };


    const bookingData: Booking = {
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
      seats: passengers.map(p => p.name), 
      numPassengers: passengers.length,
      totalPrice: totalPrice, // This is already calculated and includes convenience fee
      status: 'upcoming',
      bookingDate: new Date().toISOString(),
      selectedClass: selectedClassQuery.toUpperCase(), // Store query param directly

      // New fields with mock data
      pnr: Math.random().toString().slice(2, 12), // Random 10-digit PNR
      quota: "GENERAL (GN)", // Mock
      distance: `${Math.floor(Math.random() * 500) + 200} KM`, // Mock distance
      transactionId: `TRN${Date.now()}`, // Mock transaction ID
      ticketFare: calculatedTicketFare,
      convenienceFee: calculatedConvenienceFee,
      gstDetails: mockGstDetails,
    };

    try {
      const docRef = await addDoc(collection(firestore, "bookings"), bookingData);
      toast({
        title: "Payment Successful!",
        description: `Your booking (ID: ${docRef.id}) is confirmed and details saved.`,
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


  if (!trainId || !date || !selectedClassQuery || !numPassengersQuery) {
    return (
        <ClientAuthGuard>
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
        </ClientAuthGuard>
    )
  }
  const numPassengers = parseInt(numPassengersQuery, 10);


  return (
    <ClientAuthGuard>
      <div className="max-w-2xl mx-auto py-8 space-y-6">
         <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4" disabled={isProcessingPayment}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Passenger Details
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
                        <p><strong>Passengers:</strong> {numPassengers}</p>
                    </AlertDescription>
                </Alert>
            )}

            {passengers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2 mt-4 flex items-center">
                    <Users className="mr-2 h-5 w-5 text-muted-foreground" /> Passengers ({passengers.length})
                </h3>
                <ul className="list-disc list-inside pl-4 space-y-1 text-sm text-muted-foreground max-h-32 overflow-y-auto">
                  {passengers.map((p, i) => <li key={i}>{p.name} (Age: {p.age}, Gender: {p.gender.charAt(0).toUpperCase() + p.gender.slice(1)}, Berth: {p.preferredBerth.replace(/_/g, ' ').split(' ').map(w=>w.charAt(0).toUpperCase() + w.slice(1)).join(' ')})</li>)}
                </ul>
              </div>
            )}
            
            <div className="border-t pt-4 mt-4">
                <p className="text-xl font-bold text-right">
                    Total Amount: <span className="text-green-600">₹{totalPrice.toFixed(2)}</span>
                </p>
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
                disabled={isProcessingPayment || passengers.length === 0 || !trainDetails}
            >
              {isProcessingPayment ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
              {isProcessingPayment ? 'Processing...' : `Confirm & Pay ₹${totalPrice.toFixed(2)}`}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </ClientAuthGuard>
  );
}
