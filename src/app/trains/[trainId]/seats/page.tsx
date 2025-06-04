
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
import { format, getDate, startOfMonth, parseISO } from 'date-fns';
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
  <div className="flex justify-between py-2 border-b border-border last:border-b-0">
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
  const queryDateString = searchParams.get('date');

  const [trainDetails, setTrainDetails] = useState<TrainDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const initialDate = useMemo(() => {
    return queryDateString ? parseISO(queryDateString) : new Date();
  }, [queryDateString]);

  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(initialDate));
  const [selectedDateForCalendar, setSelectedDateForCalendar] = useState<Date | undefined>(initialDate);
  const [selectedClass, setSelectedClass] = useState<string>("3A"); // Default class

  useEffect(() => {
    setIsLoading(true);
    setTrainDetails(null); 
    
    const timer = setTimeout(() => {
      const details = MOCK_TRAINS.find(train => train.id === trainId);
      if (details) {
        setTrainDetails(details);
        
        const availableStandardClasses = ['1A', '2A', '3A', 'SL', '2S'].filter(cls =>
            details.availableClasses.includes(cls as any)
        );
        if (availableStandardClasses.length > 0) {
            if (!availableStandardClasses.includes(selectedClass)) {
                setSelectedClass(availableStandardClasses[0]);
            }
        }
      } else {
        toast({ title: "Error", description: "Train details not found.", variant: "destructive" });
      }
      setIsLoading(false);
    }, 100); 

    return () => clearTimeout(timer);
  }, [trainId, toast]); // Removed selectedClass from deps to avoid re-fetch on tab change


  // Effect to update selectedClass if the current one isn't valid for the loaded trainDetails
  // This runs after trainDetails are loaded or changed.
  useEffect(() => {
    if (trainDetails) {
        const availableStandardClasses = ['1A', '2A', '3A', 'SL', '2S'].filter(cls =>
            trainDetails.availableClasses.includes(cls as any)
        );
        if (availableStandardClasses.length > 0) {
            // If selectedClass is not in the available classes for this train, pick the first one that is.
            if (!availableStandardClasses.includes(selectedClass)) {
                setSelectedClass(availableStandardClasses[0]);
            }
        } else {
           // If no standard classes are available (e.g., only 'economy'), handle appropriately
           // For now, we let tabs be disabled by their own logic.
           // You might want to set selectedClass to a default or empty string if no tabs are active.
        }
    }
  }, [trainDetails, selectedClass]); // Removed setSelectedClass as it's already part of selectedClass state.


  const availabilityDates = useMemo(() => {
    let baseDateForList = selectedDateForCalendar || new Date();
     // Ensure baseDateForList is not in the past for generating future availability
    if (baseDateForList < new Date(new Date().setHours(0,0,0,0))) {
        baseDateForList = new Date(new Date().setHours(0,0,0,0));
    }
    // Example logic: if selected date is in the latter part of the month, show dates from there
    // This is just a placeholder logic, real API would drive this.
    if (getDate(baseDateForList) < 20) { 
        const tempDate = new Date(baseDateForList);
        tempDate.setDate(20);
        if(tempDate >= new Date(new Date().setHours(0,0,0,0))) { // Check if 20th is not in past
            baseDateForList = tempDate;
        }
    }
    return MOCK_AVAILABILITY_DATES(baseDateForList);
  }, [selectedDateForCalendar]);


  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">Loading...</div>;
  }

  if (!trainDetails) {
    return <div className="text-center py-10">Train details not found. Please check the train ID or try again later.</div>;
  }

  const breadcrumbOrigin = queryOrigin || trainDetails.origin;
  const breadcrumbDestination = queryDestination || trainDetails.destination;
  const currentSelectedDateForURL = selectedDateForCalendar ? format(selectedDateForCalendar, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');


  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-4xl">
      <nav className="text-sm text-muted-foreground flex items-center space-x-2 flex-wrap">
        <Link href="/" className="hover:underline">Train Search</Link>
        <ChevronRight size={16} />
        <Link href={`/?origin=${encodeURIComponent(breadcrumbOrigin)}&destination=${encodeURIComponent(breadcrumbDestination)}&date=${currentSelectedDateForURL}`} className="hover:underline">
          {breadcrumbOrigin.split('(')[0].trim()} to {breadcrumbDestination.split('(')[0].trim()}
        </Link>
        <ChevronRight size={16} />
        <span className="font-medium text-foreground">{trainDetails.trainName} ({trainDetails.trainNumber})</span>
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
        <h2 className="text-xl font-semibold mb-3">Availability for Class: <span className="text-primary">{selectedClass}</span></h2>
        <Tabs value={selectedClass} onValueChange={setSelectedClass} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-4">
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
                  selected={selectedDateForCalendar}
                  onSelect={(date) => {
                    if (date) {
                        setSelectedDateForCalendar(date);
                        const newURL = `/trains/${trainId}/seats?origin=${encodeURIComponent(breadcrumbOrigin)}&destination=${encodeURIComponent(breadcrumbDestination)}&date=${format(date, 'yyyy-MM-dd')}`;
                        window.history.pushState({}, '', newURL); 
                        setCurrentMonth(startOfMonth(date)); 
                        toast({title: "Date Selected", description: `Showing availability for ${format(date, "PPP")}`});
                    }
                  }}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  numberOfMonths={2}
                  className="rounded-md"
                  disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} 
                />

                <div className="mt-6 space-y-2">
                  <div className="flex justify-between font-semibold text-sm px-2 py-1 border-b">
                    <span>Date</span>
                    <span>Status</span>
                  </div>
                  {availabilityDates.map((item) => (
                    <div key={item.date} className="flex justify-between items-center text-sm px-2 py-3 border-b last:border-b-0">
                      <span>{format(parseISO(item.date), "dd MMM yyyy")}</span>
                      {item.status === "Available" ? (
                        <Button variant="outline" size="sm" className="bg-green-100 text-green-700 border-green-300 hover:bg-green-200" asChild>
                          <Link href={`/bookings/passenger-details?trainId=${trainId}&date=${item.date}&class=${selectedClass}&origin=${encodeURIComponent(breadcrumbOrigin)}&destination=${encodeURIComponent(breadcrumbDestination)}`}>
                            Available
                          </Link>
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
