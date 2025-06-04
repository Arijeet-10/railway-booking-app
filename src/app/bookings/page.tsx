
"use client";

import ClientAuthGuard from '@/components/ClientAuthGuard';
import { BookingCard } from '@/components/bookings/booking-card';
import type { Booking } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Ticket, Loader2, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { firestore } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return; // Wait for auth state to resolve
    }
    if (!user) {
      setIsLoadingBookings(false); // Not logged in, so no bookings to load
      return;
    }

    const fetchBookings = async () => {
      setIsLoadingBookings(true);
      setFetchError(null);
      try {
        // Fetch Upcoming Bookings
        const upcomingQuery = query(
          collection(firestore, 'bookings'),
          where('userId', '==', user.uid),
          where('status', '==', 'upcoming'),
          orderBy('travelDate', 'asc')
        );
        const upcomingSnapshot = await getDocs(upcomingQuery);
        const upcoming = upcomingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        setUpcomingBookings(upcoming);

        // Fetch Past Bookings
        const pastQuery = query(
          collection(firestore, 'bookings'),
          where('userId', '==', user.uid),
          where('status', '!=', 'upcoming'), // Could be 'completed' or 'cancelled'
          orderBy('travelDate', 'desc')
        );
        const pastSnapshot = await getDocs(pastQuery);
        const past = pastSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        setPastBookings(past);

      } catch (err) {
        console.error("Error fetching bookings:", err);
        setFetchError("Failed to load your bookings. Please try again later.");
      } finally {
        setIsLoadingBookings(false);
      }
    };

    fetchBookings();
  }, [user, authLoading]);

  return (
    <ClientAuthGuard>
      <div className="space-y-8">
        <section>
          <h1 className="text-3xl font-headline font-bold mb-2">My Bookings</h1>
          <p className="text-muted-foreground mb-6">View your upcoming and past train journeys across India.</p>
          
          {isLoadingBookings && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">Loading your bookings...</p>
            </div>
          )}

          {fetchError && !isLoadingBookings && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{fetchError}</AlertDescription>
            </Alert>
          )}

          {!isLoadingBookings && !fetchError && upcomingBookings.length === 0 && pastBookings.length === 0 && (
             <Alert>
                <Ticket className="h-4 w-4" />
                <AlertTitle>No Bookings Yet!</AlertTitle>
                <AlertDescription>
                  You haven&apos;t made any bookings. Start by searching for a train.
                </AlertDescription>
            </Alert>
          )}
        </section>

        {!isLoadingBookings && !fetchError && upcomingBookings.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Upcoming Trips</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingBookings.map(booking => <BookingCard key={booking.id} booking={booking} />)}
            </div>
          </section>
        )}

        {!isLoadingBookings && !fetchError && pastBookings.length > 0 && (
          <section>
            <Separator className="my-8" />
            <h2 className="text-2xl font-semibold mb-4">Past Trips</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pastBookings.map(booking => <BookingCard key={booking.id} booking={booking} />)}
            </div>
          </section>
        )}

         <section className="mt-12 text-center">
            <Image 
                src="https://images.unsplash.com/photo-1602900103084-1d83fc717471?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxpbmRpYW4lMjByYWlsd2F5c3xlbnwwfHx8fDE3NDkwNTY5OTJ8MA&ixlib=rb-4.1.0&q=80&w=1080" 
                alt="Scenic Indian train journey" 
                width={800} 
                height={300} 
                className="w-full h-auto object-cover rounded-lg shadow-md"
            />
            <p className="mt-4 text-muted-foreground">Ready for your next adventure? <a href="/" className="text-accent hover:underline">Search for trains now!</a></p>
        </section>
      </div>
    </ClientAuthGuard>
  );
}
