import ClientAuthGuard from '@/components/ClientAuthGuard';
import { BookingCard } from '@/components/bookings/booking-card';
import type { Booking } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Ticket } from 'lucide-react';

// Mock data for bookings
const MOCK_BOOKINGS: Booking[] = [
  { id: 'B001', userId: 'user1', trainId: 'T001', trainName: 'Capital Express', trainNumber: '12001', origin: 'New York', destination: 'Washington D.C.', bookingDate: '2023-10-15T10:00:00Z', travelDate: '2024-07-20', departureTime: '08:00', arrivalTime: '11:30', seats: ['A1', 'A2'], totalPrice: 150, status: 'upcoming' },
  { id: 'B002', userId: 'user1', trainId: 'T002', trainName: 'Coastal Liner', trainNumber: '12002', origin: 'Los Angeles', destination: 'San Francisco', bookingDate: '2023-09-01T14:30:00Z', travelDate: '2024-05-10', departureTime: '10:00', arrivalTime: '18:00', seats: ['C5'], totalPrice: 120, status: 'completed' },
  { id: 'B003', userId: 'user1', trainId: 'T003', trainName: 'Metro Shuttle', trainNumber: '12003', origin: 'Chicago', destination: 'Milwaukee', bookingDate: '2024-01-05T09:15:00Z', travelDate: '2024-02-15', departureTime: '14:30', arrivalTime: '16:00', seats: ['B10'], totalPrice: 30, status: 'cancelled' },
];

export default function BookingsPage() {
  // In a real app, fetch bookings for the logged-in user
  const upcomingBookings = MOCK_BOOKINGS.filter(b => b.status === 'upcoming');
  const pastBookings = MOCK_BOOKINGS.filter(b => b.status !== 'upcoming'); // completed or cancelled

  return (
    <ClientAuthGuard>
      <div className="space-y-8">
        <section>
          <h1 className="text-3xl font-headline font-bold mb-2">My Bookings</h1>
          <p className="text-muted-foreground mb-6">View your upcoming and past train journeys.</p>
          
          {MOCK_BOOKINGS.length === 0 && (
             <Alert>
                <Ticket className="h-4 w-4" />
                <AlertTitle>No Bookings Yet!</AlertTitle>
                <AlertDescription>
                  You haven&apos;t made any bookings. Start by searching for a train.
                </AlertDescription>
            </Alert>
          )}
        </section>

        {upcomingBookings.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Upcoming Trips</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingBookings.map(booking => <BookingCard key={booking.id} booking={booking} />)}
            </div>
          </section>
        )}

        {pastBookings.length > 0 && (
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
                src="https://placehold.co/800x300.png" 
                alt="Scenic train journey" 
                width={800} 
                height={300} 
                className="w-full h-auto object-cover rounded-lg shadow-md"
                data-ai-hint="train landscape"
            />
            <p className="mt-4 text-muted-foreground">Ready for your next adventure? <a href="/" className="text-accent hover:underline">Search for trains now!</a></p>
        </section>
      </div>
    </ClientAuthGuard>
  );
}
