
"use client";

import ClientAuthGuard from '@/components/ClientAuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Ticket, Users, CalendarDays, Train, CreditCard, ShieldCheck, Home, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PassengerFormValues } from '@/components/bookings/passenger-form'; // Assuming this type is exported
import { MOCK_TRAINS } from '@/lib/mock-data';
import type { TrainDetailed } from '@/lib/types';

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const trainId = searchParams.get('trainId');
  const date = searchParams.get('date');
  const selectedClass = searchParams.get('class');
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const numPassengers = searchParams.get('numPassengers');

  const [passengers, setPassengers] = useState<PassengerFormValues[]>([]);
  const [trainDetails, setTrainDetails] = useState<TrainDetailed | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    // Retrieve passenger details from localStorage
    const storedPassengers = localStorage.getItem('pendingBookingPassengers');
    if (storedPassengers) {
      setPassengers(JSON.parse(storedPassengers) as PassengerFormValues[]);
    }

    // Find train details
    if (trainId) {
      const foundTrain = MOCK_TRAINS.find(t => t.id === trainId);
      if (foundTrain) {
        setTrainDetails(foundTrain);
        // Calculate total price (example: train price * num passengers)
        // Add class-specific pricing logic if needed
        const pricePerPassenger = foundTrain.price; 
        setTotalPrice(pricePerPassenger * (parseInt(numPassengers || '1', 10)));
      }
    }
  }, [trainId, numPassengers]);


  const handleConfirmPayment = () => {
    // Simulate payment processing
    console.log("Payment confirmed for:", { trainId, date, selectedClass, origin, destination, passengers, totalPrice });
    
    // Clear localStorage
    localStorage.removeItem('pendingBookingPassengers');

    // Redirect to a success page or bookings history (for now, just an alert and redirect to bookings)
    alert("Payment Successful! Your booking is confirmed."); // Replace with a proper toast/modal
    router.push('/bookings'); 
  };


  if (!trainId || !date || !selectedClass || !numPassengers) {
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

  return (
    <ClientAuthGuard>
      <div className="max-w-2xl mx-auto py-8 space-y-6">
         <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
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
                        <p><strong>Date:</strong> {new Date(date + "T00:00:00").toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p><strong>Class:</strong> <span className="font-semibold">{selectedClass.toUpperCase()}</span></p>
                        <p><strong>Passengers:</strong> {numPassengers}</p>
                    </AlertDescription>
                </Alert>
            )}

            {passengers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2 mt-4 flex items-center">
                    <Users className="mr-2 h-5 w-5 text-muted-foreground" /> Passengers ({passengers.length})
                </h3>
                <ul className="list-disc list-inside pl-4 space-y-1 text-sm text-muted-foreground">
                  {passengers.map((p, i) => <li key={i}>{p.name} (Age: {p.age})</li>)}
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
                    This is a simulated payment gateway. No real transaction will occur.
                </AlertDescription>
            </Alert>

          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <Button variant="outline" onClick={() => router.push('/')} className="w-full sm:w-auto">
                <Home className="mr-2 h-4 w-4" /> Cancel & Go Home
            </Button>
            <Button 
                size="lg" 
                onClick={handleConfirmPayment} 
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Confirm & Pay ₹{totalPrice.toFixed(2)}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </ClientAuthGuard>
  );
}
