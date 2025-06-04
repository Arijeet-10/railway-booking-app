
"use client";

import { useSearchParams } from 'next/navigation';
import ClientAuthGuard from '@/components/ClientAuthGuard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Train, CalendarDays, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import PassengerForm from '@/components/bookings/passenger-form';

export default function PassengerDetailsPage() {
  const searchParams = useSearchParams();
  const trainId = searchParams.get('trainId');
  const date = searchParams.get('date');
  const selectedClass = searchParams.get('class');
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');

  return (
    <ClientAuthGuard>
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold font-headline">Passenger Details</h1>

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
            <AlertTitle>Missing Booking Information</AlertTitle>
            <AlertDescription>
              Critical booking details (train, date, or class) are missing. Please return to the previous page and try again.
            </AlertDescription>
          </Alert>
        )}

        {selectedClass && <PassengerForm selectedClass={selectedClass.toUpperCase()} />}
        
        <div className="mt-6">
            <Button variant="outline" className="w-full sm:w-auto" asChild>
                <Link href={trainId && date ? `/trains/${trainId}/seats?date=${date}&origin=${origin}&destination=${destination}` : '/'}>
                    Back to Seat Availability
                </Link>
            </Button>
        </div>

      </div>
    </ClientAuthGuard>
  );
}
