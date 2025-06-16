"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import ClientAuthGuard from '@/components/ClientAuthGuard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Train, Users, Trash2, CreditCard, XCircle, Contact, Loader2, Calendar, User, Tag, PlusCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import PassengerForm, { type PassengerFormValues } from '@/components/bookings/passenger-form';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { SavedPassenger } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Mock data for Saved Passengers
const MOCK_SAVED_PASSENGERS: SavedPassenger[] = [
  { id: 'saved1', name: 'Aditya Sharma', age: 30, gender: 'male', preferredBerth: 'lower', isSenior: false },
  { id: 'saved2', name: 'Priya Singh', age: 28, gender: 'female', preferredBerth: 'side_lower', isSenior: false },
  { id: 'saved3', name: 'Rohan Verma', age: 8, gender: 'male', preferredBerth: 'no_preference', isSenior: false },
  { id: 'saved4', name: 'Geeta Devi', age: 62, gender: 'female', preferredBerth: 'lower', isSenior: true },
];

// --- NEW UI COMPONENTS ---

const BookingStepper = () => (
    <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-8">
        <div className="flex items-center text-sm text-muted-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground mr-2">1</span>
            Seat Selection
        </div>
        <div className="flex-1 border-t-2 border-dashed border-border"></div>
        <div className="flex items-center text-sm font-semibold text-primary">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground mr-2">2</span>
            Passenger Details
        </div>
        <div className="flex-1 border-t-2 border-dashed border-border"></div>
        <div className="flex items-center text-sm text-muted-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground mr-2">3</span>
            Payment
        </div>
    </div>
);

const BookingSummaryCard = ({ trainId, date, selectedClass, origin, destination, seats, passengersCount }: any) => {
    const seatCount = seats.length;
    const baseFare = 450;
    const totalFare = baseFare * seatCount;

    return (
        <Card className="shadow-lg lg:sticky lg:top-24 border-primary/20 bg-white/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center text-primary">
                    <Tag className="mr-2 h-5 w-5" /> Booking Summary
                </CardTitle>
                <CardDescription>Review your trip details before payment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center"><Train className="mr-2 h-4 w-4"/>Route</span>
                    <span className="font-medium text-right">{decodeURIComponent(origin)} <ArrowRight className="inline h-4 w-4 mx-1" /> {decodeURIComponent(destination)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center"><Calendar className="mr-2 h-4 w-4"/>Date & Class</span>
                    <span className="font-medium">{new Date(date + "T00:00:00").toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ({selectedClass.toUpperCase()})</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center"><User className="mr-2 h-4 w-4"/>Seats Selected</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                       {seats.length > 0 ? seats.map((seat: string) => <Badge key={seat} variant="secondary">{seat}</Badge>) : <span className="font-medium">None</span>}
                    </div>
                </div>
                <Separator />
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Base Fare ({seatCount} x ₹{baseFare})</span>
                        <span className="font-medium">₹{totalFare.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Taxes & Fees</span>
                        <span className="font-medium">₹{(totalFare * 0.05).toFixed(2)}</span>
                    </div>
                    <Separator />
                     <div className="flex justify-between font-bold text-lg text-primary">
                        <span>Total Payable</span>
                        <span>₹{(totalFare * 1.05).toFixed(2)}</span>
                    </div>
                </div>
                <Button 
                  size="lg" 
                  className="w-full bg-green-600 hover:bg-green-700 text-white mt-4"
                  disabled={passengersCount !== seatCount || seatCount === 0}
                  form="payment-trigger-form" // Link to a dummy form for triggering payment
                >
                    <CreditCard className="mr-2 h-5 w-5" />
                    Proceed to Payment
                </Button>
            </CardContent>
        </Card>
    );
};

// --- MAIN COMPONENT ---

function PassengerDetailsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const { trainId, date, selectedClass, origin, destination, selectedSeatsQuery } = useMemo(() => ({
      trainId: searchParams.get('trainId'),
      date: searchParams.get('date'),
      selectedClass: searchParams.get('class'),
      origin: searchParams.get('origin'),
      destination: searchParams.get('destination'),
      selectedSeatsQuery: searchParams.get('selectedSeats')
  }), [searchParams]);

  const [passengers, setPassengers] = useState<PassengerFormValues[]>([]);
  const [passengerToPreFill, setPassengerToPreFill] = useState<Partial<PassengerFormValues> | null>(null);
  const [actualSelectedSeats, setActualSelectedSeats] = useState<string[]>([]);
  
  useEffect(() => {
    const seatsFromQuery = selectedSeatsQuery ? selectedSeatsQuery.split(',') : [];
    setActualSelectedSeats(seatsFromQuery);
    setPassengers([]);
    
    if (seatsFromQuery.length === 0 && trainId && date && selectedClass) {
        toast({
            title: "No Seats Selected",
            description: "Please go back and select your seats first.",
            variant: "destructive"
        });
    }
  }, [selectedSeatsQuery, trainId, date, selectedClass, toast]);

  const handleAddPassenger = (passenger: PassengerFormValues) => {
    if (passengers.length >= actualSelectedSeats.length) {
        toast({ title: "Seat Limit Reached", description: `You have selected ${actualSelectedSeats.length} seat(s). Cannot add more passengers.`, variant: "destructive" });
        return;
    }
    setPassengers(prev => [...prev, passenger]);
    setPassengerToPreFill(null); // Clear pre-fill after adding
  };

  const handleRemovePassenger = (indexToRemove: number) => {
    setPassengers(prev => prev.filter((_, index) => index !== indexToRemove));
    toast({ title: "Passenger Removed", variant: "default" });
  };

  const handleSelectSavedPassenger = (savedPassenger: SavedPassenger) => {
     if (passengers.length >= actualSelectedSeats.length) {
        toast({ title: "Seat Limit Reached", description: `Cannot pre-fill more passengers than selected seats.`, variant: "destructive" });
        return;
    }
    setPassengerToPreFill({ ...savedPassenger });
    toast({ title: `${savedPassenger.name}'s details loaded`, description: `Fill/confirm details and click "Add Passenger".` });
  };

  const handleProceedToPayment = (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default form submission
    if (passengers.length !== actualSelectedSeats.length || actualSelectedSeats.length === 0) {
        toast({ title: "Passenger-Seat Mismatch", description: `Please add details for all ${actualSelectedSeats.length} selected seat(s). You have added ${passengers.length}.`, variant: "destructive" });
        return;
    }
    
    const passengersWithSeats = passengers.map((p, index) => ({ ...p, seatNumber: actualSelectedSeats[index] }));
    localStorage.setItem('pendingBookingPassengers', JSON.stringify(passengersWithSeats));
    
    const queryParams = new URLSearchParams({
        trainId: trainId!, date: date!, class: selectedClass!, origin: origin!, destination: destination!, selectedSeats: actualSelectedSeats.join(',')
    });
    router.push(`/payment?${queryParams.toString()}`);
  };

  if (!trainId || !date || !selectedClass || !origin || !destination) {
    return (
        <div className="max-w-4xl mx-auto py-10">
            <Alert variant="destructive">
                <XCircle className="h-5 w-5" />
                <AlertTitle>Missing Booking Information</AlertTitle>
                <AlertDescription>Critical booking details are missing. Please start your search again.</AlertDescription>
                <Button asChild variant="destructive" className="mt-4"><Link href="/">Go to Home</Link></Button>
            </Alert>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <BookingStepper />
      <h1 className="text-3xl font-bold font-headline mb-8 text-center">Passenger & Contact Details</h1>
      
      <div className="lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start">
        {/* --- Right Column (Sticky Summary) --- */}
        <div className="lg:col-span-1 lg:order-last mb-8 lg:mb-0">
            <form id="payment-trigger-form" onSubmit={handleProceedToPayment}>
                <BookingSummaryCard 
                    trainId={trainId} 
                    date={date} 
                    selectedClass={selectedClass} 
                    origin={origin} 
                    destination={destination}
                    seats={actualSelectedSeats}
                    passengersCount={passengers.length}
                />
            </form>
        </div>

        {/* --- Left Column (Main Content) --- */}
        <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center"><Contact className="mr-3 h-6 w-6 text-primary" />Quick Add</CardTitle>
                    <CardDescription>Select a saved passenger to quickly fill the form.</CardDescription>
                </CardHeader>
                <CardContent>
                    {MOCK_SAVED_PASSENGERS.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {MOCK_SAVED_PASSENGERS.map(p => (
                                <button key={p.id} onClick={() => handleSelectSavedPassenger(p)} className="text-left">
                                    <div className="p-3 border rounded-lg hover:shadow-md hover:border-primary transition-all flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-sm">{p.name}</p>
                                            <p className="text-xs text-muted-foreground">{p.age} yrs, {p.gender.charAt(0).toUpperCase() + p.gender.slice(1)}</p>
                                        </div>
                                        <PlusCircle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors"/>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : ( <p className="text-sm text-muted-foreground">No saved passengers found.</p> )}
                </CardContent>
            </Card>

            {actualSelectedSeats.length > 0 && (
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle>Add Passenger Details</CardTitle>
                        <CardDescription>
                            Fill the form for each passenger. You need to add {actualSelectedSeats.length - passengers.length} more.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PassengerForm 
                            selectedClass={selectedClass.toUpperCase()} 
                            onAddPassenger={handleAddPassenger}
                            initialData={passengerToPreFill}
                            key={passengerToPreFill?.name || 'empty-form'}
                        />
                    </CardContent>
                </Card>
            )}

            {passengers.length > 0 && (
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center"><Users className="mr-3 h-6 w-6 text-primary" />Added Passengers ({passengers.length} of {actualSelectedSeats.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {passengers.map((passenger, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                                <div className="flex items-center space-x-3">
                                    <Avatar>
                                        <AvatarFallback>{passenger.name.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{passenger.name} {passenger.isSenior && <Badge variant="outline" className="ml-1 border-green-500 text-green-600">Senior</Badge>}</p>
                                        <p className="text-sm text-muted-foreground">
                                          Seat: <Badge variant="secondary">{actualSelectedSeats[index]}</Badge>
                                        </p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleRemovePassenger(index)} className="text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
            
            {actualSelectedSeats.length === 0 && (
               <Alert variant="destructive">
                  <XCircle className="h-5 w-5" />
                  <AlertTitle>No Seats Selected!</AlertTitle>
                  <AlertDescription>Return to the previous page to select your seats before adding passengers.</AlertDescription>
                  <Button asChild variant="outline" className="mt-4"><Link href={trainId && date && selectedClass && origin && destination ? `/trains/${trainId}/seats?date=${date}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&class=${selectedClass}` : '/'}>Back to Seat Selection</Link></Button>
              </Alert>
            )}
        </div>
      </div>
    </div>
  );
}

export default function PassengerDetailsPage() {
  return (
    <div className="bg-gradient-to-b from-slate-50 to-white min-h-screen">
      <ClientAuthGuard>
        <Suspense fallback={
          <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
        }>
          <PassengerDetailsPageContent />
        </Suspense>
      </ClientAuthGuard>
    </div>
  );
}