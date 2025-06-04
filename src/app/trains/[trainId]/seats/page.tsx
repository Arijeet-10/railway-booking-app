
"use client"; 

import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Seat } from '@/lib/types';
import { Armchair, Loader2, Ticket } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

// Mock data for seats - in a real app, this would be fetched
const generateMockSeats = (coachId: string, rows: number, seatsPerRow: number): Seat[] => {
  const seats: Seat[] = [];
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, seatsPerRow);
  for (let i = 1; i <= rows; i++) {
    for (let j = 0; j < letters.length; j++) {
      const seatId = `${coachId}-${i}${letters[j]}`;
      const randomNumber = Math.random();
      let status: Seat['status'] = 'available';
      if (randomNumber < 0.3) status = 'booked';
      // else if (randomNumber < 0.35) status = 'unavailable'; // Example of another status

      seats.push({
        id: seatId,
        coach: coachId,
        number: `${i}${letters[j]}`,
        status: status,
        type: j === 0 || j === letters.length - 1 ? 'window' : (j === 1 || j === letters.length - 2 ? 'aisle' : 'middle'),
      });
    }
  }
  return seats;
};

const SeatAvailabilityGrid = ({ seats, selectedSeats, onSeatSelect }: { seats: Seat[], selectedSeats: string[], onSeatSelect: (seatId: string) => void }) => {
  const seatsByCoach = useMemo(() => {
    return seats.reduce((acc, seat) => {
      if (!acc[seat.coach]) {
        acc[seat.coach] = [];
      }
      acc[seat.coach].push(seat);
      return acc;
    }, {} as Record<string, Seat[]>);
  }, [seats]);

  return (
    <div className="space-y-6">
      {Object.entries(seatsByCoach).map(([coachId, coachSeats]) => (
        <div key={coachId}>
          <h3 className="text-lg font-semibold mb-2">Coach {coachId}</h3>
          <div className="grid grid-cols-6 md:grid-cols-10 gap-2 p-4 border rounded-lg bg-muted/20">
            {coachSeats.map((seat) => {
              const isSelected = selectedSeats.includes(seat.id);
              const isDisabled = seat.status === 'booked' || seat.status === 'unavailable';
              return (
                <Button
                  key={seat.id}
                  variant={isSelected ? 'default' : (isDisabled ? 'secondary': 'outline')}
                  size="icon"
                  className={cn(
                    "h-10 w-10 md:h-12 md:w-12 transition-all duration-150 transform hover:scale-110",
                    seat.status === 'booked' && "bg-destructive/50 text-destructive-foreground cursor-not-allowed",
                    seat.status === 'unavailable' && "bg-muted text-muted-foreground cursor-not-allowed line-through",
                    isSelected && "ring-2 ring-primary ring-offset-2"
                  )}
                  onClick={() => !isDisabled && onSeatSelect(seat.id)}
                  disabled={isDisabled}
                  aria-label={`Seat ${seat.number}, Status: ${isSelected ? 'selected' : seat.status}`}
                >
                  <Armchair size={20} />
                </Button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};


export default function SeatAvailabilityPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const trainId = params.trainId as string;
  const origin = searchParams.get('origin') || 'Unknown Origin';
  const destination = searchParams.get('destination') || 'Unknown Destination';
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];


  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const mockCoachS1 = generateMockSeats('S1', 12, 6); // Typical sleeper coach
      const mockCoachC1 = generateMockSeats('C1', 8, 5); // AC Chair car
      setSeats([...mockCoachS1, ...mockCoachC1]);
      setIsLoading(false);
    }, 1000);
  }, [trainId]);

  const handleSeatSelect = (seatId: string) => {
    setSelectedSeats((prevSelected) =>
      prevSelected.includes(seatId)
        ? prevSelected.filter((id) => id !== seatId)
        : [...prevSelected, seatId]
    );
  };

  const handleBooking = () => {
    if (!user) {
      toast({ title: "Authentication Required", description: "Please log in to book tickets.", variant: "destructive" });
      return;
    }
    if(selectedSeats.length === 0) {
      toast({ title: "No Seats Selected", description: "Please select at least one seat.", variant: "destructive" });
      return;
    }

    setIsBooking(true);
    setTimeout(() => {
      toast({
        title: "Booking Successful!",
        description: `Booked ${selectedSeats.length} seat(s) for train ${trainId}. Seat IDs: ${selectedSeats.join(', ')}`,
        action: <Button variant="outline" size="sm" asChild><Link href="/bookings">View Bookings</Link></Button>
      });
      setSelectedSeats([]);
      setIsBooking(false);
    }, 2000);
  };

  if (isLoading || authLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  const totalPrice = selectedSeats.length * 500; // Assuming a flat price of ₹500 per seat for mock

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Select Your Seats</CardTitle>
          <CardDescription>
            Train ID: {trainId} <br />
            Route: {origin} to {destination} on {new Date(date).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SeatAvailabilityGrid seats={seats} selectedSeats={selectedSeats} onSeatSelect={handleSeatSelect} />
           <div className="mt-6 p-4 border rounded-lg bg-background">
            <h4 className="font-semibold mb-2">Legend:</h4>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <div className="flex items-center"><Armchair className="mr-1 h-5 w-5 text-primary" /> Available</div>
              <div className="flex items-center"><Armchair className="mr-1 h-5 w-5 text-accent" /> Selected</div>
              <div className="flex items-center"><Armchair className="mr-1 h-5 w-5 text-destructive/70" /> Booked</div>
              <div className="flex items-center"><Armchair className="mr-1 h-5 w-5 text-muted-foreground" /> Unavailable</div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-lg font-semibold">Selected Seats: {selectedSeats.length}</p>
            <p className="text-xl font-bold text-accent">Total Price: ₹{totalPrice.toFixed(2)}</p>
          </div>
          <Button 
            size="lg" 
            onClick={handleBooking} 
            disabled={selectedSeats.length === 0 || isBooking || !user}
            className="w-full md:w-auto"
          >
            {isBooking ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Ticket className="mr-2 h-5 w-5" />}
            {user ? (isBooking ? 'Processing...' : 'Book Selected Seats') : 'Login to Book'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
