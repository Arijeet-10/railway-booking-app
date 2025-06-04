
"use client";

import { useParams, useRouter } from 'next/navigation';
import ClientAuthGuard from '@/components/ClientAuthGuard';
import { useAuth } from '@/hooks/useAuth';
import type { Booking } from '@/lib/types';
import { firestore } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Ticket, CalendarDays, Users, MapPin, Trash2, Download, Edit3, ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export default function ManageBookingPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user || !bookingId) {
      if (!authLoading && !user) {
        // Redirect or show message if not logged in, handled by ClientAuthGuard
        setIsLoading(false);
      }
      return;
    }

    const fetchBookingDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const bookingRef = doc(firestore, 'bookings', bookingId);
        const docSnap = await getDoc(bookingRef);

        if (docSnap.exists()) {
          const bookingData = { id: docSnap.id, ...docSnap.data() } as Booking;
          // Basic check to ensure the logged-in user owns this booking
          if (bookingData.userId === user.uid) {
            setBooking(bookingData);
          } else {
            setError("You do not have permission to view this booking.");
            toast({ title: "Access Denied", description: "You are not authorized to manage this booking.", variant: "destructive" });
            router.push('/bookings'); // Redirect if not owner
          }
        } else {
          setError("Booking not found.");
          toast({ title: "Not Found", description: "The requested booking does not exist.", variant: "destructive" });
          router.push('/bookings');
        }
      } catch (err) {
        console.error("Error fetching booking details:", err);
        setError("Failed to load booking details. Please try again.");
        toast({ title: "Error", description: "Could not load booking information.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, user, authLoading, router, toast]);

  const handleCancelBooking = () => {
    // Placeholder for cancellation logic
    toast({
      title: "Cancel Booking (Not Implemented)",
      description: "This feature will be available soon.",
    });
  };

  const handleModifyPassengers = () => {
    // Placeholder
    toast({
        title: "Modify Passengers (Not Implemented)",
        description: "This feature will be available soon.",
    });
  };

  const handleDownloadTicket = () => {
    // Placeholder
     toast({
        title: "Download Ticket (Not Implemented)",
        description: "This feature will be available soon.",
    });
  };


  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading booking details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-lg mx-auto my-10">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
         <Button variant="outline" onClick={() => router.push('/bookings')} className="mt-4">
            Go to My Bookings
        </Button>
      </Alert>
    );
  }

  if (!booking) {
    // Should be covered by error states, but as a fallback
    return <div className="text-center py-10">Booking details could not be loaded.</div>;
  }

  return (
    <ClientAuthGuard>
      <div className="max-w-3xl mx-auto space-y-8">
        <Button variant="outline" size="sm" onClick={() => router.push('/bookings')} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Bookings
        </Button>
        <Card className="shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/30">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <CardTitle className="text-2xl font-headline flex items-center">
                        <Ticket className="mr-3 h-7 w-7 text-primary" />
                        Manage Your Booking
                    </CardTitle>
                    <CardDescription>Booking ID: {booking.id}</CardDescription>
                </div>
                {booking.status === 'upcoming' && <span className="mt-2 sm:mt-0 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">Upcoming</span>}
                {booking.status === 'completed' && <span className="mt-2 sm:mt-0 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">Completed</span>}
                {booking.status === 'cancelled' && <span className="mt-2 sm:mt-0 px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Cancelled</span>}
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-primary">{booking.trainName} ({booking.trainNumber})</h3>
              <p className="text-sm text-muted-foreground flex items-center mt-1">
                <MapPin className="mr-2 h-4 w-4" />
                {booking.origin} to {booking.destination}
              </p>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4" /> Travel Date</p>
                    <p className="font-medium">{new Date(booking.travelDate + "T00:00:00").toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                 <div>
                    <p className="text-sm text-muted-foreground">Departure - Arrival</p>
                    <p className="font-medium">{booking.departureTime} - {booking.arrivalTime}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Class</p>
                    <p className="font-medium">{booking.selectedClass.toUpperCase()}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Total Price</p>
                    <p className="font-medium text-green-600">₹{booking.totalPrice.toFixed(2)}</p>
                </div>
            </div>
            <Separator />
            <div>
                <h4 className="text-md font-semibold mb-2 flex items-center">
                    <Users className="mr-2 h-5 w-5 text-muted-foreground" /> Passengers ({booking.passengersList?.length || booking.seats.length})
                </h4>
                {booking.passengersList && booking.passengersList.length > 0 ? (
                    <ul className="list-disc list-inside pl-4 space-y-1 text-sm">
                        {booking.passengersList.map((p, index) => (
                            <li key={index}>{p.name} (Age: {p.age}, Gender: {p.gender}, Berth: {p.preferredBerth.replace(/_/g, ' ')})</li>
                        ))}
                    </ul>
                ) : (
                     <ul className="list-disc list-inside pl-4 space-y-1 text-sm">
                        {booking.seats.map((seatName, index) => (
                            <li key={index}>{seatName}</li>
                        ))}
                    </ul>
                )}
            </div>
             <Separator />
             <p className="text-xs text-muted-foreground">Booked on: {new Date(booking.bookingDate).toLocaleString()}</p>
          </CardContent>
          {booking.status === 'upcoming' && (
            <CardFooter className="bg-muted/30 p-6 border-t flex flex-col sm:flex-row gap-3 justify-end">
                <Button variant="outline" onClick={handleModifyPassengers}>
                    <Edit3 className="mr-2 h-4 w-4" /> Modify Passengers
                </Button>
                <Button variant="default" onClick={handleDownloadTicket}>
                    <Download className="mr-2 h-4 w-4" /> Download Ticket
                </Button>
                <Button variant="destructive" onClick={handleCancelBooking}>
                    <Trash2 className="mr-2 h-4 w-4" /> Cancel Booking
                </Button>
            </CardFooter>
          )}
           {booking.status === 'completed' && (
            <CardFooter className="bg-muted/30 p-6 border-t flex justify-end">
                <Button variant="outline">Leave a Review</Button>
            </CardFooter>
          )}
           {booking.status === 'cancelled' && (
            <CardFooter className="bg-muted/30 p-6 border-t flex justify-end">
                <p className="text-sm text-destructive">This booking has been cancelled.</p>
            </CardFooter>
          )}
        </Card>
      </div>
    </ClientAuthGuard>
  );
}

    