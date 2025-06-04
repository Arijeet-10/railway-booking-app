
"use client";

import { useSearchParams, useRouter } from 'next/navigation'; // Added useRouter
import ClientAuthGuard from '@/components/ClientAuthGuard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Train, CalendarDays, UserCircle, Users, Trash2, CreditCard, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import PassengerForm, { type PassengerFormValues } from '@/components/bookings/passenger-form';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export default function PassengerDetailsPage() {
  const searchParams = useSearchParams();
  const router = useRouter(); // Initialized useRouter
  const { toast } = useToast();

  const trainId = searchParams.get('trainId');
  const date = searchParams.get('date');
  const selectedClass = searchParams.get('class');
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');

  const [passengers, setPassengers] = useState<PassengerFormValues[]>([]);

  const handleAddPassenger = (passenger: PassengerFormValues) => {
    setPassengers(prevPassengers => [...prevPassengers, passenger]);
  };

  const handleRemovePassenger = (indexToRemove: number) => {
    setPassengers(prevPassengers => prevPassengers.filter((_, index) => index !== indexToRemove));
    toast({
        title: "Passenger Removed",
        description: "The passenger has been removed from the list.",
        variant: "default"
    })
  };

  const handleProceedToPayment = () => {
    if (passengers.length === 0) {
        toast({
            title: "No Passengers",
            description: "Please add at least one passenger before proceeding.",
            variant: "destructive",
        });
        return;
    }
    // In a real app, this would navigate to a payment gateway or summary page
    // and pass necessary data (e.g., via state management or secure API call)
    console.log("Proceeding to payment with passengers:", passengers);
    console.log("Booking details:", { trainId, date, selectedClass, origin, destination });
    
    // Navigate to payment page with passenger count and booking details
    const queryParams = new URLSearchParams({
        trainId: trainId || '',
        date: date || '',
        class: selectedClass || '',
        origin: origin || '',
        destination: destination || '',
        numPassengers: String(passengers.length),
    });
    // For simplicity, we're logging passengers here. In a real app, this state would be managed
    // more robustly, e.g., in context or a temporary store before hitting a backend.
    localStorage.setItem('pendingBookingPassengers', JSON.stringify(passengers));

    router.push(`/payment?${queryParams.toString()}`);
  };

  return (
    <ClientAuthGuard>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h1 className="text-3xl font-bold font-headline">
                Passenger Details 
            </h1>
            <Button variant="outline" size="sm" asChild>
                <Link href={trainId && date ? `/trains/${trainId}/seats?date=${date}&origin=${encodeURIComponent(origin || '')}&destination=${encodeURIComponent(destination || '')}` : '/'}>
                    Back to Seat Availability
                </Link>
            </Button>
        </div>


        {trainId && date && selectedClass ? (
          <Alert className="shadow-sm border-primary/50 bg-primary/5">
            <Train className="h-5 w-5 text-primary" />
            <AlertTitle className="font-semibold text-primary">Booking Summary</AlertTitle>
            <AlertDescription className="space-y-1 mt-2 text-sm">
              <p><strong>Train:</strong> {trainId} (from {origin || 'N/A'} to {destination || 'N/A'})</p>
              <p><strong>Date:</strong> {new Date(date + "T00:00:00").toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Class:</strong> <span className="font-semibold">{selectedClass.toUpperCase()}</span></p>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <XCircle className="h-5 w-5" />
            <AlertTitle>Missing Booking Information</AlertTitle>
            <AlertDescription>
              Critical booking details (train, date, or class) are missing. Please return to the previous page and try again.
            </AlertDescription>
          </Alert>
        )}

        {selectedClass && <PassengerForm selectedClass={selectedClass.toUpperCase()} onAddPassenger={handleAddPassenger} />}
        
        {passengers.length > 0 && (
          <section className="mt-8 space-y-6">
            <Separator />
            <h2 className="text-2xl font-semibold flex items-center">
                <Users className="mr-3 h-6 w-6 text-primary" /> Added Passengers ({passengers.length})
            </h2>
            <div className="space-y-4">
              {passengers.map((passenger, index) => (
                <Card key={index} className="bg-card shadow-md">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-lg">{passenger.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Age: {passenger.age}, Gender: {passenger.gender.charAt(0).toUpperCase() + passenger.gender.slice(1)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Berth Preference: {passenger.preferredBerth.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemovePassenger(index)} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-5 w-5" />
                        <span className="sr-only">Remove {passenger.name}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Separator />
             <div className="flex justify-end mt-6">
                <Button 
                    size="lg" 
                    onClick={handleProceedToPayment} 
                    disabled={passengers.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    <CreditCard className="mr-2 h-5 w-5" />
                    Proceed to Payment ({passengers.length} Passenger{passengers.length === 1 ? '' : 's'})
                </Button>
            </div>
          </section>
        )}

        {passengers.length === 0 && trainId && date && selectedClass && (
            <Alert variant="default" className="mt-6 border-blue-500/50 bg-blue-500/5">
                <UserCircle className="h-5 w-5 text-blue-600" />
                <AlertTitle className="text-blue-700">No Passengers Added Yet</AlertTitle>
                <AlertDescription>
                Please fill out the form above to add passengers to your booking.
                </AlertDescription>
            </Alert>
        )}
      </div>
    </ClientAuthGuard>
  );
}
