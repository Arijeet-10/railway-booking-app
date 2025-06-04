
import type { Booking } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, MapPin, Ticket, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link'; // Import Link

interface BookingCardProps {
  booking: Booking;
}

export const BookingCard = ({ booking }: BookingCardProps) => {
  const getStatusBadgeVariant = (status: Booking['status']) => {
    switch (status) {
      case 'upcoming': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: Booking['status']) => {
     switch (status) {
      case 'upcoming': return <Clock className="h-4 w-4 text-primary" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return <Ticket className="h-4 w-4 text-muted-foreground"/>;
    }
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-headline">{booking.trainName}</CardTitle>
          <Badge variant={getStatusBadgeVariant(booking.status)} className="capitalize">
            {getStatusIcon(booking.status)} <span className="ml-1">{booking.status}</span>
          </Badge>
        </div>
        <CardDescription>Train No: {booking.trainNumber}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm flex-grow">
        <div className="flex items-center">
          <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{booking.origin} to {booking.destination}</span>
        </div>
        <div className="flex items-center">
          <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
          {/* Ensure travelDate is parsed correctly if it's a string */}
          <span>Travel Date: {new Date(booking.travelDate + "T00:00:00").toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>Time: {booking.departureTime} - {booking.arrivalTime}</span>
        </div>
        <div className="flex items-center">
          <Users className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>Passengers: {booking.passengersList ? booking.passengersList.map(p => p.name).join(', ') : booking.seats.join(', ')} ({booking.numPassengers} passenger{booking.numPassengers > 1 ? 's' : ''})</span>
        </div>
        <div className="flex items-center font-semibold">
          <Ticket className="mr-2 h-4 w-4 text-accent" />
          <span>Total Price: ₹{booking.totalPrice.toFixed(2)}</span>
        </div>
      </CardContent>
      <CardFooter className="mt-auto">
        {booking.status === 'upcoming' && (
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href={`/bookings/${booking.id}/manage`}>Manage Booking</Link>
          </Button>
        )}
        {booking.status === 'completed' && (
          <Button variant="ghost" size="sm" className="w-full">Leave a Review</Button>
        )}
         {booking.status === 'cancelled' && (
          <Button variant="link" size="sm" className="w-full text-muted-foreground">View Cancellation Details</Button>
        )}
      </CardFooter>
    </Card>
  );
};

    