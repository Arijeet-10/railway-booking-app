import type { Train } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, DollarSign, MapPin, TrainFront as TrainIcon, ArrowRight, Ticket } from 'lucide-react';
import Link from 'next/link';

interface TrainCardProps {
  train: Train;
}

export const TrainCard = ({ train }: TrainCardProps) => {
  return (
    <Card className="flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-headline flex items-center">
              <TrainIcon className="mr-2 h-6 w-6 text-primary" />
              {train.trainName}
            </CardTitle>
            <CardDescription>Train No: {train.trainNumber}</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-accent">${train.price.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">per person</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center text-sm">
          <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{train.origin}</span>
          <ArrowRight className="mx-2 h-4 w-4 text-muted-foreground" />
          <span>{train.destination}</span>
        </div>
        <div className="flex items-center text-sm">
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{train.departureTime} - {train.arrivalTime} ({train.duration})</span>
        </div>
        <div className="flex items-center text-sm">
           <Ticket className="mr-2 h-4 w-4 text-muted-foreground" />
           <span>Classes: {train.availableClasses.join(', ').toUpperCase()}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" variant="default">
          <Link href={`/trains/${train.id}/seats?origin=${train.origin}&destination=${train.destination}&date=${new Date().toISOString().split('T')[0]}`}>
            View Seats & Book
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
