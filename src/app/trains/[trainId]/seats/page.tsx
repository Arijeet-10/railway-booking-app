
"use client";

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TrainDetailed, Seat } from '@/lib/types';
import { ChevronRight, CheckCircle, XCircle, DoorOpen } from 'lucide-react';
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

const berthColors: Record<Seat['type'], string> = {
  lower: 'bg-yellow-300 border-yellow-400',
  middle: 'bg-pink-300 border-pink-400', // Kept for 3A
  upper: 'bg-sky-300 border-sky-400',
  side_lower: 'bg-green-400 border-green-500',
  side_upper: 'bg-purple-400 border-purple-500',
  door: 'bg-gray-200 border-gray-300 text-gray-600',
  aisle: 'bg-transparent',
  empty: 'bg-transparent border-transparent',
  legend_title: 'bg-transparent font-bold',
  legend_item: 'bg-transparent',
  toilet: 'bg-gray-200 border-gray-300 text-gray-600', // Should have been removed from legend, will keep color def
};

const legendData: { type: Seat['type']; label: string; colorClass: string }[] = [
    { type: 'door', label: 'Door/Entry', colorClass: berthColors.door },
    { type: 'lower', label: 'Lower Berth', colorClass: berthColors.lower },
    { type: 'middle', label: 'Middle Berth (3A)', colorClass: berthColors.middle },
    { type: 'upper', label: 'Upper Berth', colorClass: berthColors.upper },
    { type: 'side_lower', label: 'Side Lower', colorClass: berthColors.side_lower },
    { type: 'side_upper', label: 'Side Upper', colorClass: berthColors.side_upper },
];


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
        if (!isNaN(parsed.valueOf()) && !isBefore(parsed, new Date(new Date().setHours(0,0,0,0)))) {
          return parsed;
        }
      }
    } catch (e) { /* Invalid date string */ }
    return new Date(new Date().setHours(0,0,0,0));
  }, [queryDateString]);


  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(initialDate));
  const [selectedDateForCalendar, setSelectedDateForCalendar] = useState<Date | undefined>(initialDate);
  const [selectedClass, setSelectedClass] = useState<string>(queryClass || "3A");

  const [coachLayout, setCoachLayout] = useState<Seat[][]>([]);
  const [userSelectedSeats, setUserSelectedSeats] = useState<string[]>([]); // Stores seat numbers
  const MAX_SEATS_SELECTABLE = 6;

  const breadcrumbOrigin = queryOrigin || trainDetails?.origin || "Unknown Origin";
  const breadcrumbDestination = queryDestination || trainDetails?.destination || "Unknown Destination";
  
  const currentSelectedDateForURL = useMemo(() => {
    return selectedDateForCalendar ? format(selectedDateForCalendar, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  }, [selectedDateForCalendar]);


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
           setSelectedClass(details.availableClasses[0])
        }
      } else {
        toast({ title: "Error", description: "Train details not found.", variant: "destructive" });
      }
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [trainId, toast]);


  const generateAC3TierLayout = useCallback((): Seat[][] => {
    const ac3Layout: Seat[][] = Array(18).fill(null).map(() => Array(5).fill(null).map(() => ({ id: `empty-${Math.random()}`, status: 'empty', type: 'empty' })));
    const entryDisplayText = "ENTRY";
    ac3Layout[0][0] = {id: 'ENTRY_TL_3A', displayText: entryDisplayText, type: 'door', status: 'unavailable'};
    ac3Layout[0][1] = {id: 'EMPTY_T1_3A', type: 'empty', status: 'empty'};
    ac3Layout[0][2] = {id: 'EMPTY_T2_3A', type: 'empty', status: 'empty'};
    ac3Layout[0][3] = {id: 'AISLE_T_3A', type: 'aisle', status: 'aisle'};
    ac3Layout[0][4] = {id: 'EMPTY_T3_3A', type: 'empty', status: 'empty'};

    ac3Layout[17][0] = {id: 'ENTRY_BL_3A', displayText: entryDisplayText, type: 'door', status: 'unavailable'};
    ac3Layout[17][1] = {id: 'EMPTY_B1_3A', type: 'empty', status: 'empty'};
    ac3Layout[17][2] = {id: 'EMPTY_B2_3A', type: 'empty', status: 'empty'};
    ac3Layout[17][3] = {id: 'AISLE_B_3A', type: 'aisle', status: 'aisle'};
    ac3Layout[17][4] = {id: 'EMPTY_B3_3A', type: 'empty', status: 'empty'};

    let currentSeatNum = 1;
    for (let bay = 0; bay < 8; bay++) {
        const r1 = bay * 2 + 1; 
        const r2 = r1 + 1;      

        ac3Layout[r1][0] = { id: `S${currentSeatNum}_3A`, number: `${currentSeatNum}`, type: 'lower', status: Math.random() > 0.3 ? 'available' : 'booked' }; currentSeatNum++;
        ac3Layout[r1][1] = { id: `S${currentSeatNum}_3A`, number: `${currentSeatNum}`, type: 'middle', status: Math.random() > 0.3 ? 'available' : 'booked' }; currentSeatNum++;
        ac3Layout[r1][2] = { id: `S${currentSeatNum}_3A`, number: `${currentSeatNum}`, type: 'upper', status: Math.random() > 0.3 ? 'available' : 'booked' }; currentSeatNum++;
        
        ac3Layout[r2][0] = { id: `S${currentSeatNum}_3A`, number: `${currentSeatNum}`, type: 'lower', status: Math.random() > 0.3 ? 'available' : 'booked' }; currentSeatNum++;
        ac3Layout[r2][1] = { id: `S${currentSeatNum}_3A`, number: `${currentSeatNum}`, type: 'middle', status: Math.random() > 0.3 ? 'available' : 'booked' }; currentSeatNum++;
        ac3Layout[r2][2] = { id: `S${currentSeatNum}_3A`, number: `${currentSeatNum}`, type: 'upper', status: Math.random() > 0.3 ? 'available' : 'booked' }; currentSeatNum++;

        ac3Layout[r1][4] = { id: `S${currentSeatNum}_3A`, number: `${currentSeatNum}`, type: 'side_lower', status: Math.random() > 0.3 ? 'available' : 'booked' }; currentSeatNum++;
        ac3Layout[r2][4] = { id: `S${currentSeatNum}_3A`, number: `${currentSeatNum}`, type: 'side_upper', status: Math.random() > 0.3 ? 'available' : 'booked' }; currentSeatNum++;
        
        ac3Layout[r1][3] = { id: `AISLE${r1}_3A`, type: 'aisle', status: 'aisle' };
        ac3Layout[r2][3] = { id: `AISLE${r2}_3A`, type: 'aisle', status: 'aisle' };
    }
    
    for (let i = 0; i < ac3Layout.length; i++) {
        for (let j = 0; j < ac3Layout[i].length; j++) {
            const seat = ac3Layout[i][j];
            if (seat.type && berthColors[seat.type]) {
                seat.originalColor = berthColors[seat.type];
            }
        }
    }
    return ac3Layout;
  }, []);

  const generateAC2TierLayout = useCallback((): Seat[][] => {
    // AC 2 Tier: Typically 4 main berths (2L, 2U) + 2 side berths (SL, SU) per bay.
    // Structure for data (each inner array is a vertical column in horizontal view):
    // [Lower, Upper, Empty (for visual spacing), Aisle, Side Lower/Upper]
    const ac2Layout: Seat[][] = Array(18).fill(null).map(() => Array(5).fill(null).map(() => ({ id: `empty-${Math.random()}`, status: 'empty', type: 'empty' })));
    const entryDisplayText = "ENTRY";

    // Doors at the ends (similar to 3A but with _2A suffix for IDs)
    ac2Layout[0][0] = {id: 'ENTRY_TL_2A', displayText: entryDisplayText, type: 'door', status: 'unavailable'};
    ac2Layout[0][1] = {id: 'EMPTY_T1_2A', type: 'empty', status: 'empty'}; // No middle
    ac2Layout[0][2] = {id: 'EMPTY_T2_2A', type: 'empty', status: 'empty'};
    ac2Layout[0][3] = {id: 'AISLE_T_2A', type: 'aisle', status: 'aisle'};
    ac2Layout[0][4] = {id: 'EMPTY_T3_2A', type: 'empty', status: 'empty'};

    ac2Layout[17][0] = {id: 'ENTRY_BL_2A', displayText: entryDisplayText, type: 'door', status: 'unavailable'};
    ac2Layout[17][1] = {id: 'EMPTY_B1_2A', type: 'empty', status: 'empty'}; // No middle
    ac2Layout[17][2] = {id: 'EMPTY_B2_2A', type: 'empty', status: 'empty'};
    ac2Layout[17][3] = {id: 'AISLE_B_2A', type: 'aisle', status: 'aisle'};
    ac2Layout[17][4] = {id: 'EMPTY_B3_2A', type: 'empty', status: 'empty'};

    let currentSeatNum = 1;
    // Aiming for around 8 bays of 6 seats = 48 seats.
    // Each bay is represented by 2 segments (columns)
    for (let bay = 0; bay < 8; bay++) {
        const segment1 = bay * 2 + 1; // First column for this bay
        const segment2 = segment1 + 1;  // Second column for this bay

        // Bay: Main Berths (Compartment 1: L, U; Compartment 2: L, U)
        // Segment 1 (e.g., left side of compartment)
        ac2Layout[segment1][0] = { id: `S${currentSeatNum}_2A`, number: `${currentSeatNum}`, type: 'lower', status: Math.random() > 0.3 ? 'available' : 'booked' }; currentSeatNum++;
        ac2Layout[segment1][1] = { id: `S${currentSeatNum}_2A`, number: `${currentSeatNum}`, type: 'upper', status: Math.random() > 0.3 ? 'available' : 'booked' }; currentSeatNum++;
        ac2Layout[segment1][2] = { id: `EMPTY_M1_${bay}_2A`, type: 'empty', status: 'empty' }; // Placeholder for middle berth slot

        // Segment 2 (e.g., right side of compartment)
        ac2Layout[segment2][0] = { id: `S${currentSeatNum}_2A`, number: `${currentSeatNum}`, type: 'lower', status: Math.random() > 0.3 ? 'available' : 'booked' }; currentSeatNum++;
        ac2Layout[segment2][1] = { id: `S${currentSeatNum}_2A`, number: `${currentSeatNum}`, type: 'upper', status: Math.random() > 0.3 ? 'available' : 'booked' }; currentSeatNum++;
        ac2Layout[segment2][2] = { id: `EMPTY_M2_${bay}_2A`, type: 'empty', status: 'empty' }; // Placeholder for middle berth slot

        // Side Berths for this bay (across segment1 and segment2 for SL and SU)
        ac2Layout[segment1][4] = { id: `S${currentSeatNum}_2A`, number: `${currentSeatNum}`, type: 'side_lower', status: Math.random() > 0.3 ? 'available' : 'booked' }; currentSeatNum++;
        ac2Layout[segment2][4] = { id: `S${currentSeatNum}_2A`, number: `${currentSeatNum}`, type: 'side_upper', status: Math.random() > 0.3 ? 'available' : 'booked' }; currentSeatNum++;
        
        // Aisles for these segments
        ac2Layout[segment1][3] = { id: `AISLE${segment1}_2A`, type: 'aisle', status: 'aisle' };
        ac2Layout[segment2][3] = { id: `AISLE${segment2}_2A`, type: 'aisle', status: 'aisle' };
    }
    
    // Assign originalColor based on type for all seats
    for (let i = 0; i < ac2Layout.length; i++) {
        for (let j = 0; j < ac2Layout[i].length; j++) {
            const seat = ac2Layout[i][j];
            if (seat.type && berthColors[seat.type]) {
                seat.originalColor = berthColors[seat.type];
            }
        }
    }
    return ac2Layout;
  }, []);


  useEffect(() => {
    if (selectedDateForCalendar && selectedClass && trainDetails) {
        let layoutToSet: Seat[][] = [];
        if (selectedClass === "3A") { 
            layoutToSet = generateAC3TierLayout();
        } else if (selectedClass === "2A") {
            layoutToSet = generateAC2TierLayout();
        } else { 
            // Fallback for other classes - generic layout
            const rows = 10; 
            const seatsVisualPerRow = 6; // 3 seats, aisle, 2 seats
            const newLayout: Seat[][] = [];
            for (let r = 0; r < rows; r++) {
                const rowSeats: Seat[] = [];
                for (let s = 0; s < seatsVisualPerRow; s++) {
                  const seatId = `${selectedClass}-R${r}S${s}`;
                  const seatNumber = `${String.fromCharCode(65 + r)}${s + 1}`;
                  let type: Seat['type'] = 'middle'; 
                  if (s === 0 || s === seatsVisualPerRow -1 ) type = 'lower'; 
                  else if (s === 1 || s === seatsVisualPerRow -2) type = 'upper'; // upper for non-AC, or can be window/aisle
                  else if (s === 2 || s === 3) type = 'aisle'; // Middle seats could be aisle

                  rowSeats.push({
                      id: seatId, number: seatNumber, status: Math.random() > 0.7 ? 'booked' : 'available', type: type,
                      originalColor: berthColors.middle 
                  });
                }
                newLayout.push(rowSeats);
            }
            layoutToSet = newLayout;
        }
        setCoachLayout(layoutToSet);
        setUserSelectedSeats([]); 
    } else {
        setCoachLayout([]); 
    }
  }, [selectedDateForCalendar, selectedClass, trainDetails, generateAC3TierLayout, generateAC2TierLayout]);


  const handleSeatClick = (seatId: string, seatNumber?: string, currentStatus?: Seat['status']) => {
    if (!seatNumber || currentStatus === 'booked' || currentStatus === 'unavailable' || currentStatus === 'aisle' || currentStatus === 'empty' || currentStatus === 'info') return;

    let newSelectedSeats = [...userSelectedSeats];
    const newLayout = coachLayout.map(row =>
      row.map(seat => {
        if (seat.id === seatId && seat.number) {
          if (seat.status === 'available') {
            if (userSelectedSeats.length < MAX_SEATS_SELECTABLE) {
              newSelectedSeats.push(seat.number); 
              return { ...seat, status: 'selected' as const };
            } else {
              toast({ title: "Selection Limit Reached", description: `You can select a maximum of ${MAX_SEATS_SELECTABLE} seats.`, variant: "default" });
            }
          } else if (seat.status === 'selected') {
            newSelectedSeats = newSelectedSeats.filter(num => num !== seat.number);
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
  if (!displayableClasses.includes(selectedClass) && trainDetails.availableClasses.includes(selectedClass as any)) {
    displayableClasses.push(selectedClass); 
  } else if (displayableClasses.length === 0 && trainDetails.availableClasses.length > 0) {
    displayableClasses.push(...trainDetails.availableClasses as string[]);
  }


  return (
    <div className="container mx-auto px-4 py-8 space-y-8"> 
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
                  numberOfMonths={1} 
                  className="rounded-md border mb-6"
                  disabled={(date) => isBefore(date, new Date(new Date().setDate(new Date().getDate() -1)))}
                />

                <div className="mb-4 p-3 border rounded-md bg-muted/30">
                    <h4 className="text-md font-semibold mb-2">Legends</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        {legendData.map(legend => (
                            <div key={legend.label} className="flex items-center">
                                <span className={cn("inline-block w-3 h-3 mr-2 rounded-sm border", legend.colorClass)}></span>
                                <span>{legend.label}</span>
                            </div>
                        ))}
                         <div className="flex items-center">
                            <span className="inline-block w-3 h-3 bg-blue-600 border-blue-700 mr-1 rounded-sm"></span> Selected
                        </div>
                        <div className="flex items-center">
                            <span className="inline-block w-3 h-3 bg-gray-400 border-gray-500 mr-1 rounded-sm"></span> Booked
                        </div>
                    </div>
                </div>


                {coachLayout.length > 0 && (selectedClass === "3A" || selectedClass === "2A") ? (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3 text-center">{selectedClass} Coach Layout (Horizontal)</h3>
                     <div className="flex flex-row overflow-x-auto p-2 border rounded-md bg-muted/10 space-x-0.5 min-h-[200px]"> 
                        {coachLayout.map((segmentSeats, segmentIndex) => (
                            <div key={`segment-${segmentIndex}-${selectedClass}`} className="flex flex-col space-y-0.5 items-center">
                                {segmentSeats.map((seat) => {
                                    const seatBaseColor = seat.originalColor || berthColors[seat.type] || 'bg-gray-100';
                                    let displayColor = seatBaseColor;
                                    if (seat.status === 'selected') displayColor = 'bg-blue-600 text-white border-blue-700';
                                    else if (seat.status === 'booked') displayColor = 'bg-gray-400 text-gray-700 border-gray-500 cursor-not-allowed';
                                    else if (seat.status === 'unavailable') displayColor = cn(berthColors[seat.type] || 'bg-gray-200', 'cursor-not-allowed opacity-80');
                                    
                                    const isSeatClickable = seat.number && seat.status !== 'booked' && seat.status !== 'unavailable' && seat.status !== 'aisle' && seat.status !== 'empty';
                                    
                                    if (seat.type === 'door') {
                                        return (
                                            <div
                                                key={seat.id}
                                                className={cn(
                                                    "w-16 h-10 border rounded text-[10px] flex items-center justify-center font-medium leading-tight p-1",
                                                    displayColor
                                                )}
                                                title={seat.displayText || seat.type}
                                            >
                                               {seat.displayText}
                                            </div>
                                        );
                                    }
                                    if (seat.type === 'aisle') {
                                        return <div key={seat.id} className="w-16 h-3 my-0.5 bg-gray-100 rounded-sm"></div>; 
                                    }
                                    if (seat.type === 'empty') {
                                         return <div key={seat.id} className="w-16 h-8 border border-transparent"></div>; 
                                    }

                                    return (
                                        <div
                                            key={seat.id}
                                            onClick={() => isSeatClickable ? handleSeatClick(seat.id, seat.number, seat.status) : null}
                                            className={cn(
                                            "w-16 h-8 border rounded text-xs flex items-center justify-center font-medium transition-all",
                                            displayColor,
                                            isSeatClickable && seat.status === 'available' && 'hover:ring-2 hover:ring-offset-1 hover:ring-primary cursor-pointer'
                                            )}
                                            title={seat.number ? `Seat ${seat.number} (${seat.type.replace('_',' ').toUpperCase()})` : seat.displayText || seat.type}
                                        >
                                            {seat.number || ''}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>


                    {userSelectedSeats.length > 0 && (
                      <div className="mt-6 text-center">
                        <p className="text-sm mb-2">Selected Seats: <span className="font-semibold">{userSelectedSeats.join(', ')}</span></p>
                        <Button asChild className="mt-2">
                          <Link href={`/bookings/passenger-details?trainId=${trainId}&date=${currentSelectedDateForURL}&class=${selectedClass}&origin=${encodeURIComponent(breadcrumbOrigin)}&destination=${encodeURIComponent(breadcrumbDestination)}&selectedSeats=${userSelectedSeats.join(',')}`}>
                            Proceed ({userSelectedSeats.length} Seat{userSelectedSeats.length > 1 ? 's' : ''})
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : coachLayout.length > 0 && selectedClass !== "3A" && selectedClass !== "2A" ? ( // Generic layout for other classes
                    <div className="mt-6"> 
                         <h3 className="text-lg font-semibold mb-2">Select Your Seats (Coach: {selectedClass})</h3>
                         <div className="border p-2 rounded-md bg-muted/20 max-w-md mx-auto">
                            {coachLayout.map((row, rowIndex) => (
                            <div key={`row-${rowIndex}-${selectedClass}`} className="grid grid-cols-[repeat(3,minmax(0,1fr))_20px_repeat(3,minmax(0,1fr))] gap-1 mb-1">
                                {row.slice(0,3).map(seat => (
                                    <div
                                        key={seat.id}
                                        onClick={() => handleSeatClick(seat.id, seat.number, seat.status)}
                                        className={cn(
                                        "p-1.5 border rounded cursor-pointer text-xs h-8 flex items-center justify-center",
                                        seat.status === 'available' && (seat.originalColor || 'bg-green-200 hover:bg-green-300'),
                                        seat.status === 'booked' && 'bg-gray-400 text-gray-600 cursor-not-allowed',
                                        seat.status === 'selected' && 'bg-blue-600 text-white',
                                        seat.status === 'unavailable' && 'bg-red-300 text-red-700 cursor-not-allowed'
                                        )}
                                    >
                                        {seat.number?.substring(1)}
                                    </div>
                                ))}
                                <div /> 
                                {row.slice(3).map(seat => (
                                    <div
                                        key={seat.id}
                                        onClick={() => handleSeatClick(seat.id, seat.number, seat.status)}
                                        className={cn(
                                        "p-1.5 border rounded cursor-pointer text-xs h-8 flex items-center justify-center",
                                        seat.status === 'available' && (seat.originalColor || 'bg-green-200 hover:bg-green-300'),
                                        seat.status === 'booked' && 'bg-gray-400 text-gray-600 cursor-not-allowed',
                                        seat.status === 'selected' && 'bg-blue-600 text-white',
                                        seat.status === 'unavailable' && 'bg-red-300 text-red-700 cursor-not-allowed'
                                        )}
                                    >
                                        {seat.number?.substring(1)}
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
                      { (selectedClass === "3A" || selectedClass === "2A") ? `Generating ${selectedClass} layout...` : "No specific seat layout for this class in the demo, or data is still loading. Please select a valid date."}
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
                        The class '{selectedClass}' is not standard or not typically visualized with a detailed seat map in this demo.
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

