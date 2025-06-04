
"use client";

import { useSearchParams } from 'next/navigation';
import ClientAuthGuard from '@/components/ClientAuthGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UserPlus, Train, CalendarDays, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PassengerDetailsPage() {
  const searchParams = useSearchParams();
  const trainId = searchParams.get('trainId');
  const date = searchParams.get('date');
  const selectedClass = searchParams.get('class');

  // In a real app, you'd fetch train details using trainId
  // and potentially allow users to select number of passengers, etc.

  return (
    <ClientAuthGuard>
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <UserPlus size={40} className="text-primary" />
            </div>
            <CardTitle className="text-3xl font-headline">Passenger Details</CardTitle>
            <CardDescription>Enter details for your train booking.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {trainId && date && selectedClass ? (
              <>
                <Alert>
                  <Train className="h-4 w-4" />
                  <AlertTitle>Booking For:</AlertTitle>
                  <AlertDescription className="space-y-1 mt-2">
                    <p><strong>Train ID:</strong> {trainId}</p>
                    <p><strong>Date:</strong> {new Date(date + "T00:00:00").toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p><strong>Class:</strong> {selectedClass.toUpperCase()}</p>
                  </AlertDescription>
                </Alert>
                
                {/* Placeholder for passenger form */}
                <div className="text-center p-6 border-dashed border-2 border-muted rounded-md">
                    <Users size={32} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Passenger form will be here.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        (Name, Age, Gender, Berth Preference etc.)
                    </p>
                </div>

                <Button className="w-full" disabled>
                  Proceed to Payment (Not Implemented)
                </Button>
              </>
            ) : (
              <Alert variant="destructive">
                <AlertTitle>Missing Information</AlertTitle>
                <AlertDescription>
                  Train ID, date, or class is missing. Please go back and select a train and date.
                </AlertDescription>
              </Alert>
            )}
             <Button variant="outline" className="w-full" asChild>
                <Link href={`/trains/${trainId}/seats?date=${date}`}>Back to Seat Availability</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </ClientAuthGuard>
  );
}
