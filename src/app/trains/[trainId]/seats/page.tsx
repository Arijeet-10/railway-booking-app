
"use client";

import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TrainDetailed } from '@/lib/types';
import { Calendar as CalendarIconLucide, ChevronRight } from 'lucide-react'; // Renamed to avoid conflict
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar"; // ShadCN Calendar
import { addMonths, format, getDate, startOfMonth } from 'date-fns';

// Mock data for a specific train - in a real app, this would be fetched
const MOCK_TRAIN_DETAILS: Record<string, TrainDetailed> = {
  'T001': { id: 'T001', trainName: 'Rajdhani Express', trainNumber: '12951', origin: 'New Delhi (NDLS)', destination: 'Mumbai Central (MMCT)', departureTime: '16:30', arrivalTime: '08:35', duration: '16h 05m', price: 2500, availableClasses: ['1A', '2A', '3A'] },
  'T002': { id: 'T002', trainName: 'Shatabdi Express', trainNumber: '12002', origin: 'Chennai Egmore (MS)', destination: 'Bengaluru Cantt (BNC)', departureTime: '06:00', arrivalTime: '11:00', duration: '5h 00m', price: 1200, availableClasses: ['SL', '2S']},
  // Add more mock trains if needed by trainId
};

const MOCK_AVAILABILITY_DATES = (baseDate: Date, count: number = 10) => {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    return {
      date: format(date, "yyyy-MM-dd"),
      status: "Available", // Or some dynamic status
    };
  });
};


interface TrainDetailItemProps {
  label: string;
  value: string | undefined;
}

const TrainDetailItem: React.FC<TrainDetailItemProps> = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-gray-200">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium">{value || '-'}</span>
  </div>
);

export default function TrainSeatAvailabilityPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const trainId = params.trainId as string;
  // These query params might be from a previous step or direct navigation
  const queryOrigin = searchParams.get('origin');
  const queryDestination = searchParams.get('destination');
  const queryDate = searchParams.get('date');

  const [trainDetails, setTrainDetails] = useState<TrainDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState<Date>(queryDate ? new Date(queryDate) : new Date());
  const [selectedClass, setSelectedClass] = useState<string>("3A"); // Default class

  useEffect(() => {
    setIsLoading(true);
    // Simulate fetching train details
    setTimeout(() => {
      const details = MOCK_TRAIN_DETAILS[trainId];
      if (details) {
        setTrainDetails(details);
        // Set default selected class if available for this train
        if (details.availableClasses.length > 0 && !details.availableClasses.includes(selectedClass as any)) {
           setSelectedClass(details.availableClasses[0] as string);
        } else if (details.availableClasses.length > 0 && details.availableClasses.includes(selectedClass as any)) {
          // keep current selected class
        } else {
           setSelectedClass("3A"); // fallback
        }

      } else {
        toast({ title: "Error", description: "Train details not found.", variant: "destructive" });
      }
      setIsLoading(false);
    }, 500);
  }, [trainId, toast, selectedClass]);

  const availabilityDates = useMemo(() => {
    // Use queryDate or today if not available, then adjust to 20th of that month as per image example for starting list
    let baseDateForList = queryDate ? new Date(queryDate) : new Date();
    if (getDate(baseDateForList) < 20) { // If date is before 20th, start list from 20th
        baseDateForList.setDate(20);
    }
    // Ensure the list doesn't go into the past unnecessarily if current month is later
    if(baseDateForList < new Date() && getDate(new Date()) >= 20) {
      baseDateForList = new Date();
      baseDateForList.setDate(20);
    } else if (baseDateForList < new Date()) {
      baseDateForList = new Date();
    }

    return MOCK_AVAILABILITY_DATES(baseDateForList);
  }, [queryDate]);


  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">Loading...</div>;
  }

  if (!trainDetails) {
    return <div className="text-center py-10">Train details not found.</div>;
  }

  const breadcrumbOrigin = queryOrigin || trainDetails.origin;
  const breadcrumbDestination = queryDestination || trainDetails.destination;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-4xl">
      {/* Breadcrumbs */}
      <nav className="text-sm text-muted-foreground flex items-center space-x-2">
        <Link href="/" className="hover:underline">Train Tickets</Link>
        <ChevronRight size={16} />
        <Link href={`/?origin=${encodeURIComponent(breadcrumbOrigin)}&destination=${encodeURIComponent(breadcrumbDestination)}`} className="hover:underline">Train Between Stations</Link>
        <ChevronRight size={16} />
        <span>{breadcrumbOrigin.split('(')[0].trim()} to {breadcrumbDestination.split('(')[0].trim()}</span>
      </nav>

      <h1 className="text-3xl font-bold">Train Seat Availability</h1>

      {/* Train Details Section */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Train Details</h2>
        <Card className="shadow-none border">
          <CardContent className="p-4 space-y-1">
            <TrainDetailItem label="Train Name" value={trainDetails.trainName} />
            <TrainDetailItem label="Train Number" value={trainDetails.trainNumber} />
            <TrainDetailItem label="Source Station" value={trainDetails.origin} />
            <TrainDetailItem label="Destination Station" value={trainDetails.destination} />
            <TrainDetailItem label="Departure Time" value={trainDetails.departureTime} />
            <TrainDetailItem label="Arrival Time" value={trainDetails.arrivalTime} />
            <TrainDetailItem label="Duration" value={trainDetails.duration} />
          </CardContent>
        </Card>
      </section>

      {/* Availability Section */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Availability</h2>
        <Tabs value={selectedClass} onValueChange={setSelectedClass} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            {['1A', '2A', '3A', 'SL', '2S'].map(cls => (
              <TabsTrigger key={cls} value={cls} disabled={!trainDetails.availableClasses.includes(cls as any)}>
                {cls}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedClass}>
            <Card className="shadow-none border">
              <CardContent className="p-4">
                <Calendar
                  mode="single" // Still single for selection, but displays multiple months
                  selected={queryDate ? new Date(queryDate) : undefined}
                  onSelect={(date) => {
                    // Handle date selection logic, e.g., update queryDate or navigate
                    if (date) {
                        const newURL = `/trains/${trainId}/seats?origin=${encodeURIComponent(breadcrumbOrigin)}&destination=${encodeURIComponent(breadcrumbDestination)}&date=${format(date, 'yyyy-MM-dd')}`;
                        window.history.pushState({}, '', newURL); // Or use Next Router for navigation
                        setCurrentMonth(startOfMonth(date)); // Update currentMonth to reflect selection
                        toast({title: "Date Selected", description: `Showing availability for ${format(date, "PPP")}`});
                    }
                  }}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  numberOfMonths={2}
                  className="rounded-md "
                  disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} // Disable past dates
                />

                <div className="mt-6 space-y-2">
                  <div className="flex justify-between font-semibold text-sm px-2 py-1 border-b">
                    <span>Date</span>
                    <span>Status</span>
                  </div>
                  {availabilityDates.map((item) => (
                    <div key={item.date} className="flex justify-between items-center text-sm px-2 py-3 border-b border-gray-200 last:border-b-0">
                      <span>{format(new Date(item.date + "T00:00:00"), "dd MMM yyyy")}</span>
                      {item.status === "Available" ? (
                        <Button variant="outline" size="sm" className="bg-green-100 text-green-700 border-green-300 hover:bg-green-200">
                          Available
                        </Button>
                      ) : (
                        <span className="text-red-500">{item.status}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
