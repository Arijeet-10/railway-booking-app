
import TrainSearchForm from '@/components/trains/train-search-form';
import { TrainCard } from '@/components/trains/train-card';
import type { Train } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock data for train search results - Indian context
const MOCK_TRAINS: Train[] = [
  { id: 'T001', trainName: 'Rajdhani Express', trainNumber: '12301', origin: 'New Delhi (NDLS)', destination: 'Mumbai Central (MMCT)', departureTime: '17:00', arrivalTime: '09:00', duration: '16h 00m', price: 2500, availableClasses: ['economy', 'business'] },
  { id: 'T002', trainName: 'Shatabdi Express', trainNumber: '12002', origin: 'Chennai Egmore (MS)', destination: 'Bengaluru Cantt (BNC)', departureTime: '06:00', arrivalTime: '11:00', duration: '5h 00m', price: 1200, availableClasses: ['economy', 'business', 'first'] },
  { id: 'T003', trainName: 'Deccan Queen', trainNumber: '12124', origin: 'Pune Jn (PUNE)', destination: 'Chhatrapati Shivaji Maharaj Terminus (CSMT)', departureTime: '07:15', arrivalTime: '10:25', duration: '3h 10m', price: 450, availableClasses: ['economy'] },
  { id: 'T004', trainName: 'Coromandel Express', trainNumber: '12841', origin: 'Kolkata Howrah Jn (HWH)', destination: 'Chennai Central (MAS)', departureTime: '14:50', arrivalTime: '17:00', duration: '26h 10m', price: 1800, availableClasses: ['economy', 'business'] },
  { id: 'T005', trainName: 'Kacheguda Express', trainNumber: '12786', origin: 'KSR Bengaluru City Junction (SBC)', destination: 'Hyderabad Deccan Nampally (HYB)', departureTime: '18:20', arrivalTime: '05:40', duration: '11h 20m', price: 950, availableClasses: ['economy', 'business'] },
  { id: 'T006', trainName: 'Ashram Express', trainNumber: '12915', origin: 'Ahmedabad Jn (ADI)', destination: 'Jaipur Jn (JP)', departureTime: '19:30', arrivalTime: '05:45', duration: '10h 15m', price: 800, availableClasses: ['economy'] },
  { id: 'T007', trainName: 'Tejas Express', trainNumber: '82501', origin: 'Lucknow Charbagh NR (LKO)', destination: 'New Delhi (NDLS)', departureTime: '06:10', arrivalTime: '12:25', duration: '6h 15m', price: 1500, availableClasses: ['business', 'first'] },
  { id: 'T008', trainName: 'North East Express', trainNumber: '12506', origin: 'Patna Jn (PNBE)', destination: 'Guwahati (GHY)', departureTime: '07:20', arrivalTime: '22:00', duration: '14h 40m', price: 1100, availableClasses: ['economy', 'business'] },
  { id: 'T009', trainName: 'Nagpur Pune Superfast', trainNumber: '12136', origin: 'Nagpur Jn (NGP)', destination: 'Pune Jn (PUNE)', departureTime: '18:00', arrivalTime: '09:45', duration: '15h 45m', price: 1050, availableClasses: ['economy'] },
  { id: 'T010', trainName: 'Marudhar Express', trainNumber: '14854', origin: 'Agra Cantt (AGC)', destination: 'Varanasi Jn (BSB)', departureTime: '21:20', arrivalTime: '10:30', duration: '13h 10m', price: 700, availableClasses: ['economy', 'business'] },
  { id: 'T011', trainName: 'Amritsar Kalka Express', trainNumber: '14505', origin: 'Amritsar Jn (ASR)', destination: 'Kalka (KLK)', departureTime: '14:15', arrivalTime: '19:00', duration: '4h 45m', price: 350, availableClasses: ['economy'] },
  { id: 'T012', trainName: 'Jammu Rajdhani', trainNumber: '12426', origin: 'Jammu Tawi (JAT)', destination: 'New Delhi (NDLS)', departureTime: '21:25', arrivalTime: '05:55', duration: '8h 30m', price: 2200, availableClasses: ['business', 'first'] },
];

export default function HomePage() {
  const searchResults: Train[] = MOCK_TRAINS; 

  return (
    <div className="space-y-8">
      <section className="bg-card p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-4xl font-headline font-bold text-primary mb-4">Find Your Next Journey Across India</h1>
        <p className="text-lg text-card-foreground mb-6">
          Search for trains, check availability, and book your tickets hassle-free with Indian Rail Connect.
        </p>
        <TrainSearchForm />
      </section>
      
      <Separator />

      <section>
        <h2 className="text-3xl font-headline font-semibold mb-6 text-center md:text-left">Popular Destinations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { city: 'New Delhi', hint: 'India Gate', description: "Explore the capital city of India." }, 
            { city: 'Mumbai', hint: 'Gateway of India', description: "Discover the financial capital." }, 
            { city: 'Jaipur', hint: 'Hawa Mahal', description: "Experience the Pink City's charm." }
          ].map(dest => (
            <Card key={dest.city} className="overflow-hidden hover:shadow-xl transition-shadow">
              <Image 
                src={`https://placehold.co/600x400.png`} 
                alt={dest.city} 
                width={600} 
                height={400} 
                className="w-full h-48 object-cover"
                data-ai-hint={dest.hint}
              />
              <CardHeader>
                <CardTitle>{dest.city}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{dest.description}</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Explore Trains to {dest.city}</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {searchResults.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-center md:text-left">Available Trains</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((train) => (
              <TrainCard key={train.id} train={train} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
