
"use client";

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TrainDetailed, Seat } from '@/lib/types';
import { ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, startOfMonth, isEqual, isBefore } from 'date-fns';
import { MOCK_TRAINS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';


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
  const router = useRouter();
  const { toast } = useToast();

  const trainId = params.trainId as string;
  const queryOrigin = searchParams.get('origin');
  const queryDestination = searchParams.get('destination');
  const queryDateString = searchParams.get('date');
  const queryClass = searchParams.get('class');

  const [trainDetails, setTrainDetails] = useState<TrainDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initialDate = useMemo(() => {
    try {
      if (queryDateString) {
        const parsed = parseISO(queryDateString);
        // Check if parsed date is valid and not in the past
        if (!isNaN(parsed.valueOf()) && !isBefore(parsed, new Date(new Date().setHours(0,0,0,0)))) {
          return parsed;
        }
      }
    } catch (e) {
      // Invalid date string
    }
    return new Date(new Date().setHours(0,0,0,0)); // Default to today if queryDateString is invalid or past
  }, [queryDateString]);


  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(initialDate));
  const [selectedDateForCalendar, setSelectedDateForCalendar] = useState<Date | undefined>(initialDate);
  const [selectedClass, setSelectedClass] = useState<string>(queryClass || "3A");

  const [coachLayout, setCoachLayout] = useState<Seat[][]>([]);
  const [userSelectedSeats, setUserSelectedSeats] = useState<string[]>([]);
  const MAX_SEATS_SELECTABLE = 6; // Example limit

  const breadcrumbOrigin = queryOrigin || trainDetails?.origin || "Unknown Origin";
  const breadcrumbDestination = queryDestination || trainDetails?.destination || "Unknown Destination";
  
  const currentSelectedDateForURL = useMemo(() => {
    return selectedDateForCalendar ? format(selectedDateForCalendar, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  }, [selectedDateForCalendar]);


  // Effect to fetch train details
  useEffect(() => {
    setIsLoading(true);
    setTrainDetails(null);
    setCoachLayout([]); 
    setUserSelectedSeats([]);

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
        } else if (details.availableClasses.length > 0) {
           // If no standard classes but others (like economy), select the first one from all available
           setSelectedClass(details.availableClasses[0])
        }
      } else {
        toast({ title: "Error", description: "Train details not found.", variant: "destructive" });
      }
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [trainId, toast]); // Removed selectedClass to prevent re-fetch loops if selectedClass changes based on trainDetails


  // Function to generate mock layout
   const generateMockCoachLayout = useCallback((currentTrainClass: string): Seat[][] => {
    const rows = 10; // Example: 10 rows
    const seatsVisualPerRow = 6; // For a 3-aisle-3 visual representation

    const newLayout: Seat[][] = [];
    for (let r = 0; r < rows; r++) {
      const rowSeats: Seat[] = [];
      for (let s = 0; s < seatsVisualPerRow; s++) {
        const seatId = `R${r}S${s}`;
        // Example seat numbering: A1, A2, ... A6, B1 ...
        const seatNumber = `${String.fromCharCode(65 + r)}${s + 1}`;
        
        let type: Seat['type'] = 'middle';
        if (s === 0 || s === seatsVisualPerRow - 1) type = 'window';
        else if (s === 1 || s === seatsVisualPerRow - 2) type = 'middle';
        // For a 3-aisle-3 layout, seats at index 2 and 3 are typically aisle-side.
        else if (s === 2 || s === 3) type = 'aisle';


        rowSeats.push({
          id: seatId,
          number: seatNumber,
          status: Math.random() > 0.7 ? 'booked' : 'available', // Randomly book some seats
          type: type
        });
      }
      newLayout.push(rowSeats);
    }
    return newLayout;
  }, []);


  // Effect to generate/update coach layout
  useEffect(() => {
    if (selectedDateForCalendar && selectedClass && trainDetails) {
      const layout = generateMockCoachLayout(selectedClass);
      setCoachLayout(layout);
      setUserSelectedSeats([]); // Reset selected seats when date, class, or train changes
    } else {
      setCoachLayout([]); // Clear layout if conditions aren't met
    }
  }, [selectedDateForCalendar, selectedClass, trainDetails, generateMockCoachLayout]);


  const handleSeatClick = (seatId: string) => {
    let newSelectedSeats = [...userSelectedSeats];
    const newLayout = coachLayout.map(row =>
      row.map(seat => {
        if (seat.id === seatId) {
          if (seat.status === 'available') {
            if (userSelectedSeats.length < MAX_SEATS_SELECTABLE) {
              newSelectedSeats.push(seatId);
              return { ...seat, status: 'selected' as const };
            } else {
              toast({ title: "Selection Limit Reached", description: `You can select a maximum of ${MAX_SEATS_SELECTABLE} seats.`, variant: "default" });
            }
          } else if (seat.status === 'selected') {
            newSelectedSeats = newSelectedSeats.filter(id => id !== seatId);
            return { ...seat, status: 'available' as const };
          }
        }
        return seat;
      })
    );
    setCoachLayout(newLayout);
    setUserSelectedSeats(newSelectedSeats);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Prevent selecting past dates via calendar UI interaction
      if (isBefore(date, new Date(new Date().setHours(0,0,0,0)))) {
        toast({ title: "Invalid Date", description: "Cannot select a past date.", variant: "destructive"});
        return;
      }
      setSelectedDateForCalendar(date);
      const newURL = `/trains/${trainId}/seats?origin=${encodeURIComponent(breadcrumbOrigin)}&destination=${encodeURIComponent(breadcrumbDestination)}&date=${format(date, 'yyyy-MM-dd')}&class=${selectedClass}`;
      window.history.pushState({}, '', newURL);
      setCurrentMonth(startOfMonth(date));
      toast({ title: "Date Selected", description: `Showing availability for ${format(date, "PPP")}` });
    }
  };
  
  const handleClassChange = (newClass: string) => {
    setSelectedClass(newClass);
    const newURL = `/trains/${trainId}/seats?origin=${encodeURIComponent(breadcrumbOrigin)}&destination=${encodeURIComponent(breadcrumbDestination)}&date=${currentSelectedDateForURL}&class=${newClass}`;
    window.history.pushState({}, '', newURL);
  };


  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">Loading train details...</div>;
  }

  if (!trainDetails) {
    return <div className="text-center py-10">Train details not found. Please check the train ID or try again later.</div>;
  }

  const standardClasses = ['1A', '2A', '3A', 'SL', '2S'];
  const displayableClasses = standardClasses.filter(cls => trainDetails.availableClasses.includes(cls as any));
  // Add non-standard classes if they exist and selectedClass is one of them
  if (!displayableClasses.includes(selectedClass) && trainDetails.availableClasses.includes(selectedClass as any)) {
    displayableClasses.push(selectedClass); 
  } else if (displayableClasses.length === 0 && trainDetails.availableClasses.length > 0) {
    // If no standard classes, use all available ones for tabs
    displayableClasses.push(...trainDetails.availableClasses as string[]);
  }


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
        <Card className="shadow-none border">
          <CardHeader>
            <CardTitle className="text-xl">Train Details</CardTitle>
          </CardHeader>
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
        <Tabs value={selectedClass} onValueChange={handleClassChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-4">
            {standardClasses.map(cls => (
              <TabsTrigger
                key={cls}
                value={cls}
                disabled={!trainDetails.availableClasses.includes(cls as any)}
              >
                {cls}
              </TabsTrigger>
            ))}
          </TabsList>

        {displayableClasses.includes(selectedClass) && (
          <TabsContent value={selectedClass} forceMount>
            <Card className="shadow-none border">
                <CardHeader>
                    <CardTitle className="text-xl">Availability for Class: <span className="text-primary">{selectedClass}</span> on <span className="text-primary">{selectedDateForCalendar ? format(selectedDateForCalendar, "PPP") : "N/A"}</span></CardTitle>
                </CardHeader>
              <CardContent className="p-4">
                <Calendar
                  mode="single"
                  selected={selectedDateForCalendar}
                  onSelect={handleDateSelect}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  numberOfMonths={2}
                  className="rounded-md border"
                  disabled={(date) => isBefore(date, new Date(new Date().setDate(new Date().getDate() -1)))}
                />

                {coachLayout.length > 0 ? (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Select Your Seats (Coach: {selectedClass})</h3>
                    <div className="mb-2 flex items-center space-x-4 text-xs">
                      <span className="flex items-center"><span className="inline-block w-3 h-3 bg-green-300 mr-1 rounded-sm"></span> Available</span>
                      <span className="flex items-center"><span className="inline-block w-3 h-3 bg-blue-400 mr-1 rounded-sm"></span> Selected</span>
                      <span className="flex items-center"><span className="inline-block w-3 h-3 bg-gray-400 mr-1 rounded-sm"></span> Booked</span>
                    </div>

                    {/* Simplified Coach Layout Visualization (3-aisle-3 example) */}
                    <div className="border p-2 rounded-md bg-muted/20 max-w-md mx-auto">
                        <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_20px_repeat(3,minmax(0,1fr))] gap-1 text-center text-xs mb-1">
                            <div>W</div><div>M</div><div>A</div> <div/> <div>A</div><div>M</div><div>W</div>
                        </div>
                        {coachLayout.map((row, rowIndex) => (
                        <div key={`row-${rowIndex}`} className="grid grid-cols-[repeat(3,minmax(0,1fr))_20px_repeat(3,minmax(0,1fr))] gap-1 mb-1">
                            {row.slice(0,3).map(seat => (
                                 <div
                                    key={seat.id}
                                    onClick={() => handleSeatClick(seat.id)}
                                    className={cn(
                                    "p-1.5 border rounded cursor-pointer text-xs h-8 flex items-center justify-center",
                                    seat.status === 'available' && 'bg-green-200 hover:bg-green-300',
                                    seat.status === 'booked' && 'bg-gray-400 text-gray-600 cursor-not-allowed',
                                    seat.status === 'selected' && 'bg-blue-400 text-white',
                                    seat.status === 'unavailable' && 'bg-red-300 text-red-700 cursor-not-allowed'
                                    )}
                                >
                                    {seat.number.substring(1)}
                                </div>
                            ))}
                            <div /> {/* Aisle Spacer */}
                            {row.slice(3).map(seat => (
                                 <div
                                    key={seat.id}
                                    onClick={() => handleSeatClick(seat.id)}
                                    className={cn(
                                    "p-1.5 border rounded cursor-pointer text-xs h-8 flex items-center justify-center",
                                    seat.status === 'available' && 'bg-green-200 hover:bg-green-300',
                                    seat.status === 'booked' && 'bg-gray-400 text-gray-600 cursor-not-allowed',
                                    seat.status === 'selected' && 'bg-blue-400 text-white',
                                    seat.status === 'unavailable' && 'bg-red-300 text-red-700 cursor-not-allowed'
                                    )}
                                >
                                    {seat.number.substring(1)}
                                </div>
                            ))}
                        </div>
                        ))}
                    </div>

                    {userSelectedSeats.length > 0 && (
                      <div className="mt-4 text-center">
                        <p className="text-sm">Selected Seats: {userSelectedSeats.join(', ')}</p>
                        <Button asChild className="mt-2">
                          <Link href={`/bookings/passenger-details?trainId=${trainId}&date=${currentSelectedDateForURL}&class=${selectedClass}&origin=${encodeURIComponent(breadcrumbOrigin)}&destination=${encodeURIComponent(breadcrumbDestination)}&selectedSeats=${userSelectedSeats.join(',')}`}>
                            Proceed to Enter Passenger Details ({userSelectedSeats.length})
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert className="mt-6">
                    <XCircle className="h-4 w-4"/>
                    <AlertDescription>
                      No seat layout to display for the selected date/class, or data is still loading. Please select a valid date and class.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
        {!displayableClasses.includes(selectedClass) && trainDetails.availableClasses.length > 0 && (
             <TabsContent value={selectedClass} forceMount className="mt-4">
                <Alert>
                    <AlertDescription>
                        The class '{selectedClass}' is not standard or not typically visualized with a seat map in this demo.
                        Please select one of the standard classes above if available: {standardClasses.join(', ')}.
                    </AlertDescription>
                </Alert>
            </TabsContent>
        )}
        </Tabs>
      </section>
    </div>
  );
}

