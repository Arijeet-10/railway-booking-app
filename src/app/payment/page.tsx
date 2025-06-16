"use client";

import ClientAuthGuard from '@/components/ClientAuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Ticket, Users, Train, CreditCard, ShieldCheck, Home, ArrowLeft, Loader2, Landmark, Wallet, CircleUserRound } from 'lucide-react';
import { useEffect, useState, Suspense, useMemo } from 'react';
import type { PassengerFormValues, Booking, GstDetails, TrainDetailed as TrainDetailsType } from '@/lib/types';
import { MOCK_TRAINS } from '@/lib/mock-data';
import { auth, firestore } from '@/lib/firebase/config';
import { collection, addDoc } from "firebase/firestore";
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// --- NEW UI COMPONENTS ---

const BookingStepper = () => (
    <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-8">
        <div className="flex items-center text-sm text-muted-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground mr-2">1</span>
            Seat Selection
        </div>
        <div className="flex-1 border-t-2 border-dashed border-border"></div>
        <div className="flex items-center text-sm text-muted-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground mr-2">2</span>
            Passenger Details
        </div>
        <div className="flex-1 border-t-2 border-dashed border-border"></div>
        <div className="flex items-center text-sm font-semibold text-primary">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground mr-2">3</span>
            Payment
        </div>
    </div>
);

const PaymentMethodSelector = ({ selected, onSelect }: { selected: string, onSelect: (method: string) => void }) => {
    const methods = [
        { id: 'upi', name: 'UPI', icon: Wallet },
        { id: 'card', name: 'Credit/Debit Card', icon: CreditCard },
        { id: 'netbanking', name: 'Net Banking', icon: Landmark },
    ];
    return (
        <div className="grid grid-cols-3 gap-3">
            {methods.map(method => (
                <button
                    key={method.id}
                    onClick={() => onSelect(method.id)}
                    className={cn(
                        "p-4 border rounded-lg flex flex-col items-center justify-center space-y-2 transition-all duration-200",
                        selected === method.id ? "border-primary bg-primary/5 text-primary shadow-md" : "hover:border-primary/50 hover:bg-muted/50"
                    )}
                >
                    <method.icon className="h-6 w-6" />
                    <span className="text-xs font-medium text-center">{method.name}</span>
                </button>
            ))}
        </div>
    );
};

// --- MAIN COMPONENT ---

function PaymentPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();

    const { trainId, date, selectedClassQuery, origin, destination, selectedSeatsQuery } = useMemo(() => ({
        trainId: searchParams.get('trainId'),
        date: searchParams.get('date'),
        selectedClassQuery: searchParams.get('class'),
        origin: searchParams.get('origin'),
        destination: searchParams.get('destination'),
        selectedSeatsQuery: searchParams.get('selectedSeats'),
    }), [searchParams]);

    const [passengers, setPassengers] = useState<PassengerFormValues[]>([]);
    const [trainDetails, setTrainDetails] = useState<TrainDetailsType | null>(null);
    const [fareDetails, setFareDetails] = useState({ ticketFare: 0, convenienceFee: 0, totalPrice: 0 });
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');

    useEffect(() => {
        const storedPassengers = localStorage.getItem('pendingBookingPassengers');
        const seatsFromQuery = selectedSeatsQuery ? selectedSeatsQuery.split(',') : [];

        if (storedPassengers) {
            const parsedPassengers: PassengerFormValues[] = JSON.parse(storedPassengers);
            const passengersWithSeats = parsedPassengers.slice(0, seatsFromQuery.length).map((p, index) => ({
                ...p,
                seatNumber: seatsFromQuery[index],
                bookingStatus: (p.age ?? 0) > 18 ? 'CNF' : 'WL',
                currentStatus: (p.age ?? 0) > 18 ? `CNF/${seatsFromQuery[index]}` : `WL/${index + 5}`,
            }));
            setPassengers(passengersWithSeats);
        }

        if (trainId && seatsFromQuery.length > 0) {
            const foundTrain = MOCK_TRAINS.find(t => t.id === trainId);
            if (foundTrain) {
                setTrainDetails(foundTrain);
                const pricePerPassenger = foundTrain.price;
                const numPassengers = seatsFromQuery.length;
                const ticketFare = pricePerPassenger * numPassengers;
                const convenienceFee = 20 + (11.80 * numPassengers);
                setFareDetails({ ticketFare, convenienceFee, totalPrice: ticketFare + convenienceFee });
            }
        }
    }, [trainId, selectedSeatsQuery]);

    const handleConfirmPayment = async () => {
        setIsProcessingPayment(true);
        const currentUser = auth.currentUser;

        if (!currentUser || !trainDetails || !date || !selectedClassQuery || passengers.length === 0) {
            toast({ title: "Error", description: "Missing booking information. Cannot proceed.", variant: "destructive" });
            setIsProcessingPayment(false);
            return;
        }

        const bookingData: Booking = {
            id: '', userId: currentUser.uid, trainId: trainDetails.id, trainName: trainDetails.trainName, trainNumber: trainDetails.trainNumber,
            origin: origin!, destination: destination!, travelDate: date, departureTime: trainDetails.departureTime, arrivalTime: trainDetails.arrivalTime,
            passengersList: passengers, seats: passengers.map(p => p.seatNumber!), numPassengers: passengers.length,
            totalPrice: fareDetails.totalPrice, ticketFare: fareDetails.ticketFare, convenienceFee: fareDetails.convenienceFee,
            status: 'upcoming', bookingDate: new Date().toISOString(), selectedClass: selectedClassQuery.toUpperCase(),
            pnr: Math.random().toString().slice(2, 12).toUpperCase(), quota: "GENERAL (GN)",
            distance: `${Math.floor(Math.random() * 500) + 200} KM`, transactionId: `TRN${Date.now()}`,
            gstDetails: { /* Mock GST details */ }
        };

        try {
            const docRef = await addDoc(collection(firestore, "bookings"), bookingData);
            toast({ title: "Payment Successful!", description: `Booking confirmed! PNR: ${bookingData.pnr}` });
            localStorage.removeItem('pendingBookingPassengers');
            router.push(`/bookings/${docRef.id}`);
        } catch (error) {
            toast({ title: "Booking Failed", description: "Could not save your booking. Please contact support.", variant: "destructive" });
        } finally {
            setIsProcessingPayment(false);
        }
    };

    if (!trainDetails || passengers.length === 0) {
        return (
            <div className="max-w-md mx-auto py-12">
                <Alert variant="destructive">
                    <Ticket className="h-4 w-4" />
                    <AlertTitle>Error: Incomplete Information</AlertTitle>
                    <AlertDescription>
                        Booking details are missing or have expired. Please start the booking process again.
                        <Button variant="link" asChild className="mt-2"><Link href="/">Go Home</Link></Button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto px-4 py-8">
            <BookingStepper />
            <h1 className="text-3xl font-bold font-headline mb-2 text-center">Final Step: Secure Payment</h1>
            <p className="text-center text-muted-foreground mb-8">Review your trip and complete the payment to confirm your booking.</p>
            
            <div className="lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start">
                {/* --- Right Column (Sticky Summary) --- */}
                <div className="lg:col-span-1 lg:order-last mb-8 lg:mb-0">
                    <Card className="shadow-lg lg:sticky lg:top-24 border-primary/20 bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Fare Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Ticket Fare</span>
                                <span>₹{fareDetails.ticketFare.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Conv. Fee + GST</span>
                                <span>₹{fareDetails.convenienceFee.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total Amount</span>
                                <span className="text-primary">₹{fareDetails.totalPrice.toFixed(2)}</span>
                            </div>
                        </CardContent>
                        <div className="p-4 pt-0">
                            <Button size="lg" onClick={handleConfirmPayment} className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={isProcessingPayment}>
                                {isProcessingPayment ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
                                {isProcessingPayment ? 'Processing...' : `Pay ₹${fareDetails.totalPrice.toFixed(2)}`}
                            </Button>
                        </div>
                    </Card>
                </div>
                
                {/* --- Left Column (Main Content) --- */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle>Trip Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start justify-between p-4 rounded-lg bg-muted/50">
                                <div className="font-medium">
                                    <p>{trainDetails.trainName} ({trainDetails.trainNumber})</p>
                                    <p className="text-sm text-muted-foreground">{origin} → {destination}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">{format(new Date(date + "T00:00:00"), 'EEE, dd MMM yyyy')}</p>
                                    <p className="text-sm text-muted-foreground">Class: {selectedClassQuery?.toUpperCase()}</p>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-md font-semibold mb-2 flex items-center"><Users className="mr-2 h-5 w-5" />Passengers ({passengers.length})</h3>
                                <div className="space-y-2">
                                    {passengers.map((p, i) => (
                                        <div key={i} className="flex items-center space-x-3 text-sm">
                                            <Avatar className="h-8 w-8 text-xs"><AvatarFallback>{p.name.charAt(0)}</AvatarFallback></Avatar>
                                            <span className="font-medium flex-1">{p.name}</span>
                                            <span className="text-muted-foreground">Seat: {p.seatNumber}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle>Choose Payment Method</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PaymentMethodSelector selected={selectedPaymentMethod} onSelect={setSelectedPaymentMethod} />
                            <Alert className="mt-6 border-green-500/50 bg-green-500/5">
                                <ShieldCheck className="h-5 w-5 text-green-600"/>
                                <AlertTitle className="text-green-700">100% Secure & Simulated</AlertTitle>
                                <AlertDescription>This is a demo. Clicking 'Pay' will confirm your booking without any real transaction.</AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                    <div className="flex justify-start">
                        <Button variant="outline" onClick={() => router.back()} disabled={isProcessingPayment}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PaymentPage() {
    return (
        <div className="bg-gradient-to-b from-slate-50 to-white min-h-screen">
            <ClientAuthGuard>
                <Suspense fallback={
                    <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                        <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    </div>
                }>
                    <PaymentPageContent />
                </Suspense>
            </ClientAuthGuard>
        </div>
    );
}