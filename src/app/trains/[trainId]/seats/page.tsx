
"use client";

import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { TrainDetailed } from '@/lib/types';
import { ChevronRight } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar"; 
import { format, getDate, startOfMonth } from 'date-fns';
import { MOCK_TRAINS } from '@/lib/mock-data'; // Import MOCK_TRAINS

const MOCK_AVAILABILITY_DATES = (baseDate: Date, count: number = 10) => {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    return {
      date: format(date, "yyyy-MM-dd"),
      status: "Available", 
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
  const queryOrigin = searchParams.get('origin');
  const queryDestination = searchParams.get('destination');
  const queryDate = searchParams.get('date');

  const [trainDetails, setTrainDetails] = useState<TrainDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState<Date>(queryDate ? new Date(queryDate) : new Date());
  const [selectedClass, setSelectedClass] = useState<string>("3A"); // Default class

  useEffect(() => {
    setIsLoading(true);
    setTrainDetails(null); // Clear previous train details
    
    const timer = setTimeout(() => {
      const details = MOCK_TRAINS.find(train => train.id === trainId);
      if (details) {
        setTrainDetails(details);
      } else {
        toast({ title: "Error", description: "Train details not found.", variant: "destructive" });
      }
      setIsLoading(false);
    }, 100); // Shorter delay for mock data

    return () => clearTimeout(timer);
  }, [trainId, toast]);

  useEffect(() => {
    // This effect updates selectedClass if the current one isn't valid for the loaded trainDetails
    if (trainDetails) {
        const availableStandardClasses = ['1A', '2A', '3A', 'SL', '2S'].filter(cls =>
            trainDetails.availableClasses.includes(cls as any)
        );
        if (availableStandardClasses.length > 0) {
            if (!availableStandardClasses.includes(selectedClass)) {
                setSelectedClass(availableStandardClasses[0]);
            }
        }
        // If no standard classes, selectedClass remains as is, and tabs will be disabled by their own logic.
    }
  }, [trainDetails, selectedClass, setSelectedClass]);


  const availabilityDates = useMemo(() => {
    let baseDateForList = queryDate ? new Date(queryDate) : new Date();
    if (getDate(baseDateForList) < 20) { 
        baseDateForList.setDate(20);
    }
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
    return <div className="text-center py-10">Train details not found. Please check the train ID or try again later.</div>;
  }

  const breadcrumbOrigin = queryOrigin || trainDetails.origin;
  const breadcrumbDestination = queryDestination || trainDetails.destination;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-4xl">
      <nav className="text-sm text-muted-foreground flex items-center space-x-2">
        <Link href="/" className="hover:underline">Train Tickets</Link>
        <ChevronRight size={16} />
        <Link href={`/?origin=${encodeURIComponent(breadcrumbOrigin)}&destination=${encodeURIComponent(breadcrumbDestination)}`} className="hover:underline">Train Between Stations</Link>
        <ChevronRight size={16} />
        <span>{breadcrumbOrigin.split('(')[0].trim()} to {breadcrumbDestination.split('(')[0].trim()}</span>
      </nav>

      <h1 className="text-3xl font-bold">Train Seat Availability</h1>

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

      <section>
        <h2 className="text-xl font-semibold mb-3">Availability</h2>
        <Tabs value={selectedClass} onValueChange={setSelectedClass} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            {['1A', '2A', '3A', 'SL', '2S'].map(cls => (
              <TabsTrigger 
                key={cls} 
                value={cls} 
                disabled={!trainDetails.availableClasses.includes(cls as any)}
              >
                {cls}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedClass}>
            <Card className="shadow-none border">
              <CardContent className="p-4">
                <Calendar
                  mode="single" 
                  selected={queryDate ? new Date(queryDate) : undefined}
                  onSelect={(date) => {
                    if (date) {
                        const newURL = `/trains/${trainId}/seats?origin=${encodeURIComponent(breadcrumbOrigin)}&destination=${encodeURIComponent(breadcrumbDestination)}&date=${format(date, 'yyyy-MM-dd')}`;
                        window.history.pushState({}, '', newURL); 
                        setCurrentMonth(startOfMonth(date)); 
                        toast({title: "Date Selected", description: `Showing availability for ${format(date, "PPP")}`});
                    }
                  }}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  numberOfMonths={2}
                  className="rounded-md "
                  disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} 
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
