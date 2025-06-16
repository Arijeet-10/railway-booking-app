
"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import ClientAuthGuard from '@/components/ClientAuthGuard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Train, Users, Trash2, CreditCard, XCircle, Contact, Loader2 } from 'lucide-react'; // Added Loader2
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import PassengerForm, { type PassengerFormValues } from '@/components/bookings/passenger-form';
import { useState, useEffect, Suspense } from 'react'; // Added Suspense
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { SavedPassenger } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

// Mock data for Saved Passengers - This would ideally come from Firestore
const MOCK_SAVED_PASSENGERS: SavedPassenger[] = [
  { id: 'saved1', name: 'Aditya Sharma', age: 30, gender: 'male', preferredBerth: 'lower', isSenior: false },
  { id: 'saved2', name: 'Priya Singh', age: 28, gender: 'female', preferredBerth: 'side_lower', isSenior: false },
  { id: 'saved3', name: 'Rohan Verma', age: 8, gender: 'male', preferredBerth: 'no_preference', isSenior: false },
  { id: 'saved4', name: 'Geeta Devi', age: 62, gender: 'female', preferredBerth: 'lower', isSenior: true },
];

function PassengerDetailsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const trainId = searchParams.get('trainId');
  const date = searchParams.get('date');
  const selectedClass = searchParams.get('class');
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const selectedSeatsQuery = searchParams.get('selectedSeats');

  const [passengers, setPassengers] = useState<PassengerFormValues[]>([]);
  const [passengerToPreFill, setPassengerToPreFill] = useState<Partial<PassengerFormValues> | null>(null);
  const [actualSelectedSeats, setActualSelectedSeats] = useState<string[]>([]);

  useEffect(() => {
    const seatsFromQuery = selectedSeatsQuery ? selectedSeatsQuery.split(',') : [];
    setActualSelectedSeats(seatsFromQuery);

    // Clear passengers if selected seats change, to avoid mismatches
    setPassengers([]);
    if (seatsFromQuery.length === 0 && trainId && date && selectedClass) {
        toast({
            title: "No Seats Selected",
            description: "Please go back and select your seats first.",
            variant: "destructive"
        });
        // Consider redirecting or disabling form if no seats selected
    }
  }, [selectedSeatsQuery, trainId, date, selectedClass, toast]);

  const handleAddPassenger = (passenger: PassengerFormValues) => {
    if (passengers.length >= actualSelectedSeats.length) {
        toast({
            title: "Seat Limit Reached",
            description: `You have selected ${actualSelectedSeats.length} seat(s). Cannot add more passengers.`,
            variant: "destructive"
        });
        return;
    }
    setPassengers(prevPassengers => [...prevPassengers, passenger]);
    setPassengerToPreFill(null); // Clear pre-fill after adding
  };

  const handleRemovePassenger = (indexToRemove: number) => {
    setPassengers(prevPassengers => prevPassengers.filter((_, index) => index !== indexToRemove));
    toast({
        title: "Passenger Removed",
        description: "The passenger has been removed from the list.",
        variant: "default"
    })
  };

  const handleSelectSavedPassenger = (savedPassenger: SavedPassenger) => {
     if (passengers.length >= actualSelectedSeats.length) {
        toast({
            title: "Seat Limit Reached",
            description: `You have selected ${actualSelectedSeats.length} seat(s). Cannot pre-fill more passengers.`,
            variant: "destructive"
        });
        setPassengerToPreFill(null); // Clear any stale prefill
        return;
    }
    setPassengerToPreFill({
        name: savedPassenger.name,
        age: savedPassenger.age,
        gender: savedPassenger.gender,
        preferredBerth: savedPassenger.preferredBerth,
        isSenior: savedPassenger.isSenior,
    });
    toast({
        title: "Passenger Details Loaded",
        description: `${savedPassenger.name}'s details are ready to be added. Fill the form and click "Add Passenger".`,
    });
  };

  const handleProceedToPayment = () => {
    if (actualSelectedSeats.length === 0) {
        toast({
            title: "No Seats Selected",
            description: "Please select seats before proceeding.",
            variant: "destructive",
        });
        return;
    }
    if (passengers.length === 0) {
        toast({
            title: "No Passengers Added",
            description: "Please add passenger details for your selected seats.",
            variant: "destructive",
        });
        return;
    }
    if (passengers.length !== actualSelectedSeats.length) {
        toast({
            title: "Passenger-Seat Mismatch",
            description: `Please add details for all ${actualSelectedSeats.length} selected seat(s). You have added ${passengers.length}.`,
            variant: "destructive"
        });
        return;
    }
    
    const queryParams = new URLSearchParams({
        trainId: trainId || '',
        date: date || '',
        class: selectedClass || '',
        origin: origin || '',
        destination: destination || '',
        selectedSeats: actualSelectedSeats.join(','), // Pass actual selected seats
    });
    // Assign seats to passengers sequentially before saving to localStorage
    const passengersWithSeats = passengers.map((p, index) => ({
      ...p,
      seatNumber: actualSelectedSeats[index] // Assign seat from the selected list
    }));

    localStorage.setItem('pendingBookingPassengers', JSON.stringify(passengersWithSeats));
    router.push(`/payment?${queryParams.toString()}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h1 className="text-3xl font-bold font-headline">
              Passenger Details 
          </h1>
          <Button variant="outline" size="sm" asChild>
              <Link href={trainId && date && selectedClass && origin && destination ? `/trains/${trainId}/seats?date=${date}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&class=${selectedClass}` : '/'}>
                  Back to Seat Selection
              </Link>
          </Button>
      </div>

      {trainId && date && selectedClass && origin && destination ? (
        <Alert className="shadow-sm border-primary/50 bg-primary/5">
          <Train className="h-5 w-5 text-primary" />
          <AlertTitle className="font-semibold text-primary">Booking Summary</AlertTitle>
          <AlertDescription className="space-y-1 mt-2 text-sm">
            <p><strong>Train:</strong> {trainId} (from {decodeURIComponent(origin)} to {decodeURIComponent(destination)})</p>
            <p><strong>Date:</strong> {new Date(date + "T00:00:00").toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Class:</strong> <span className="font-semibold">{selectedClass.toUpperCase()}</span></p>
            <p><strong>Selected Seats:</strong> <span className="font-semibold">{actualSelectedSeats.length > 0 ? actualSelectedSeats.join(', ') : 'None'}</span></p>
            <p><strong>Passengers to Add:</strong> <span className="font-semibold">{actualSelectedSeats.length}</span></p>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <XCircle className="h-5 w-5" />
          <AlertTitle>Missing Booking Information</AlertTitle>
          <AlertDescription>
            Critical booking details are missing. Please return to the previous page and try again.
          </AlertDescription>
        </Alert>
      )}

      <section className="mt-8 space-y-4">
          <h2 className="text-2xl font-semibold flex items-center">
               <Contact className="mr-3 h-6 w-6 text-primary" /> Quick Add from Saved Passengers
          </h2>
          {MOCK_SAVED_PASSENGERS.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {MOCK_SAVED_PASSENGERS.map(p => (
                      <Card 
                          key={p.id} 
                          className="cursor-pointer hover:shadow-lg hover:border-primary transition-all"
                          onClick={() => handleSelectSavedPassenger(p)}
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && handleSelectSavedPassenger(p)}
                      >
                          <CardHeader className="pb-2">
                              <CardTitle className="text-lg">{p.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                              <div className="text-xs text-muted-foreground">
                                  {p.age} yrs, {p.gender.charAt(0).toUpperCase() + p.gender.slice(1)}
                                  {p.isSenior && <Badge variant="outline" className="ml-2 border-green-500 text-green-600 text-[10px] px-1.5 py-0.5">Senior</Badge>}
                              </div>
                              <div className="text-xs text-muted-foreground">Berth: {p.preferredBerth.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</div>
                          </CardContent>
                      </Card>
                  ))}
              </div>
          ) : (
              <Alert>
                  <AlertTitle>No Saved Passengers</AlertTitle>
                  <AlertDescription>You don't have any saved passengers yet. You can add them from your profile page.</AlertDescription>
              </Alert>
          )}
           <Separator className="my-6" />
      </section>

      {selectedClass && actualSelectedSeats.length > 0 && (
        <PassengerForm 
            selectedClass={selectedClass.toUpperCase()} 
            onAddPassenger={handleAddPassenger}
            initialData={passengerToPreFill}
            key={passengerToPreFill ? 'prefill-form' : 'empty-form'} // Re-mount form on prefill
        />
      )}
      
      {passengers.length > 0 && (
        <section className="mt-8 space-y-6">
          <Separator />
          <h2 className="text-2xl font-semibold flex items-center">
              <Users className="mr-3 h-6 w-6 text-primary" /> Added Passengers ({passengers.length} of {actualSelectedSeats.length})
          </h2>
          <div className="space-y-4">
            {passengers.map((passenger, index) => (
              <Card key={index} className="bg-card shadow-md">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-semibold">{passenger.name}</h3>
                        <div className="text-sm text-muted-foreground">
                            {passenger.age} yrs, Gender: {passenger.gender.charAt(0).toUpperCase() + passenger.gender.slice(1)}
                            {passenger.isSenior && <Badge variant="outline" className="ml-2 border-green-500 text-green-600 text-[10px] px-1.5 py-0.5">Senior</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Berth Preference: {passenger.preferredBerth.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </div>
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
                  disabled={passengers.length !== actualSelectedSeats.length || actualSelectedSeats.length === 0}
                  className="bg-green-600 hover:bg-green-700 text-white"
              >
                  <CreditCard className="mr-2 h-5 w-5" />
                  Proceed to Payment ({passengers.length} Passenger{passengers.length === 1 ? '' : 's'})
              </Button>
          </div>
        </section>
      )}

      {actualSelectedSeats.length > 0 && passengers.length < actualSelectedSeats.length && (
          <Alert variant="default" className="mt-6 border-blue-500/50 bg-blue-500/5">
              <Users className="h-5 w-5 text-blue-600" />
              <AlertTitle className="text-blue-700">
                {passengers.length === 0 ? 'Add Passenger Details' : `Add ${actualSelectedSeats.length - passengers.length} More Passenger(s)`}
              </AlertTitle>
              <AlertDescription>
              Please fill out the form above to add passenger details for your selected {actualSelectedSeats.length} seat(s). 
              You have currently added {passengers.length}.
              </AlertDescription>
          </Alert>
      )}
      {actualSelectedSeats.length === 0 && trainId && date && selectedClass && (
         <Alert variant="destructive" className="mt-6">
            <XCircle className="h-5 w-5" />
            <AlertTitle>No Seats Selected</AlertTitle>
            <AlertDescription>
                Please go back to the seat selection page and choose your seats before adding passenger details.
            </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default function PassengerDetailsPage() {
  return (
    <ClientAuthGuard>
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">Loading passenger details form...</p>
        </div>
      }>
        <PassengerDetailsPageContent />
      </Suspense>
    </ClientAuthGuard>
  );
}

    