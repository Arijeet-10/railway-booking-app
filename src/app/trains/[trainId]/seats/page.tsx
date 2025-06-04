
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
  middle: 'bg-pink-300 border-pink-400',
  upper: 'bg-sky-300 border-sky-400',
  side_lower: 'bg-green-400 border-green-500',
  side_upper: 'bg-purple-400 border-purple-500',
  toilet: 'bg-gray-200 border-gray-300 text-gray-600',
  door: 'bg-gray-200 border-gray-300 text-gray-600',
  aisle: 'bg-transparent',
  empty: 'bg-transparent',
  legend_title: 'bg-transparent font-bold',
  legend_item: 'bg-transparent',
};

const legendData: { type: Seat['type']; label: string; colorClass: string }[] = [
    { type: 'door', label: 'Door/Entry', colorClass: berthColors.door },
    { type: 'lower', label: 'Lower Berth', colorClass: berthColors.lower },
    { type: 'middle', label: 'Middle Berth', colorClass: berthColors.middle },
    { type: 'upper', label: 'Upper Berth', colorClass: berthColors.upper },
    { type: 'side_lower', label: 'Side Lower', colorClass: berthColors.side_lower },
    { type: 'side_upper', label: 'Side Upper', colorClass: berthColors.side_upper },
    { type: 'toilet', label: 'Toilet', colorClass: berthColors.toilet },
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
    const layout: Seat[][] = [];
    const totalRows = 13; // 2 (top info) + 8 (bays) + 1 (gap) + 2 (bottom info)
    const totalCols = 5; // 3 main berths + 1 aisle + 1 side berth column

    // Initialize layout with empty seats
    for (let i = 0; i < totalRows; i++) {
      layout[i] = [];
      for (let j = 0; j < totalCols; j++) {
        layout[i][j] = { id: `R${i}C${j}-empty`, status: 'empty', type: 'empty' };
      }
    }
    
    // Top: Coach Entry/Exit and Toilets
    layout[0][0] = {id: 'T_DOOR_1', displayText: 'ENTRY', type: 'door', status: 'unavailable'};
    layout[0][1] = {id: 'T_TOILET_1', displayText: 'TOILET', type: 'toilet', status: 'unavailable'};
    layout[0][2] = {id: 'T_TOILET_2', displayText: 'TOILET', type: 'toilet', status: 'unavailable'};
    layout[0][3] = {id: 'T_AISLE_1', type: 'aisle', status: 'aisle'}; // Aisle
    layout[0][4] = {id: 'T_DOOR_2', displayText: 'ENTRY', type: 'door', status: 'unavailable'};

    // Define berth numbers and types
    const seatsConfig: { num: number; type: Seat['type']; visualRow: number, visualCol: number }[] = [];
    let seatNum = 1;

    for (let bay = 0; bay < 8; bay++) {
        const baseRow = bay + 1; // Start bays from row 1 in the layout
        // Main berths (3 seats wide, 2 deep per bay part)
        seatsConfig.push({ num: seatNum++, type: 'lower', visualRow: baseRow, visualCol: 0 });
        seatsConfig.push({ num: seatNum++, type: 'middle', visualRow: baseRow, visualCol: 1 });
        seatsConfig.push({ num: seatNum++, type: 'upper', visualRow: baseRow, visualCol: 2 });
        seatNum++; // Skip 4 for main group
        seatsConfig.push({ num: seatNum++, type: 'lower', visualRow: baseRow, visualCol: 0 }); // These are actually 4,5,6 in the image, but on 2nd "line"
        seatsConfig.push({ num: seatNum++, type: 'middle', visualRow: baseRow, visualCol: 1 });
        seatsConfig.push({ num: seatNum++, type: 'upper', visualRow: baseRow, visualCol: 2 });
        
        // Side berths ( aligned with the bay)
        seatsConfig.push({ num: seatNum-3, type: 'side_lower', visualRow: baseRow, visualCol: 4 }); // seat 7
        seatsConfig.push({ num: seatNum-2, type: 'side_upper', visualRow: baseRow, visualCol: 4 }); // seat 8
        seatNum++; // To sync with 1-64 count
    }
    
    // Simplified placement for 64 seats based on image structure
    // Main Cabin Berths (3 columns for L/M/U, then 3 for L/M/U below)
    const mainBerthsOrder: Seat['type'][] = ['lower', 'middle', 'upper'];
    let currentSeatNumber = 1;
    for (let i = 0; i < 8; i++) { // 8 bays
        // First row of 3 in bay
        for (let j = 0; j < 3; j++) { // L, M, U
            layout[i + 1][j] = {
                id: `S${currentSeatNumber}`, number: `${currentSeatNumber}`,
                type: mainBerthsOrder[j], status: Math.random() > 0.3 ? 'available' : 'booked',
                originalColor: berthColors[mainBerthsOrder[j]]
            };
            currentSeatNumber++;
        }
        currentSeatNumber++; // Skip a number (e.g. after 3 comes 7 for side, main continues with 4,5,6 effectively)
                            // This logic needs to map to the real 1-64, 1,2,3 (main), 4,5,6(main), 7,8(side)
    }
    
    // More accurate mapping based on image's seat numbers
    // This is a complex mapping, simplified for now to show structure
    const seatAssignments = [
        // Bay 1
        { r: 1, c: 0, n: 1, t: 'lower' }, { r: 1, c: 1, n: 2, t: 'middle' }, { r: 1, c: 2, n: 3, t: 'upper' },
        { r: 1, c: 4, n: 7, t: 'side_lower' },
        { r: 2, c: 0, n: 4, t: 'lower' }, { r: 2, c: 1, n: 5, t: 'middle' }, { r: 2, c: 2, n: 6, t: 'upper' },
        { r: 2, c: 4, n: 8, t: 'side_upper' },
        // Bay 2
        { r: 3, c: 0, n: 9, t: 'lower' }, { r: 3, c: 1, n: 10, t: 'middle' }, { r: 3, c: 2, n: 11, t: 'upper' },
        { r: 3, c: 4, n: 15, t: 'side_lower' },
        { r: 4, c: 0, n: 12, t: 'lower' }, { r: 4, c: 1, n: 13, t: 'middle' }, { r: 4, c: 2, n: 14, t: 'upper' },
        { r: 4, c: 4, n: 16, t: 'side_upper' },
         // Bay 3
        { r: 5, c: 0, n: 17, t: 'lower' }, { r: 5, c: 1, n: 18, t: 'middle' }, { r: 5, c: 2, n: 19, t: 'upper' },
        { r: 5, c: 4, n: 23, t: 'side_lower' },
        { r: 6, c: 0, n: 20, t: 'lower' }, { r: 6, c: 1, n: 21, t: 'middle' }, { r: 6, c: 2, n: 22, t: 'upper' },
        { r: 6, c: 4, n: 24, t: 'side_upper' },
        // Bay 4
        { r: 7, c: 0, n: 25, t: 'lower' }, { r: 7, c: 1, n: 26, t: 'middle' }, { r: 7, c: 2, n: 27, t: 'upper' },
        { r: 7, c: 4, n: 31, t: 'side_lower' },
        { r: 8, c: 0, n: 28, t: 'lower' }, { r: 8, c: 1, n: 29, t: 'middle' }, { r: 8, c: 2, n: 30, t: 'upper' },
        { r: 8, c: 4, n: 32, t: 'side_upper' },
        // Bay 5
        { r: 9, c: 0, n: 33, t: 'lower' }, { r: 9, c: 1, n: 34, t: 'middle' }, { r: 9, c: 2, n: 35, t: 'upper' },
        { r: 9, c: 4, n: 39, t: 'side_lower' },
        { r: 10, c: 0, n: 36, t: 'lower' }, { r: 10, c: 1, n: 37, t: 'middle' }, { r: 10, c: 2, n: 38, t: 'upper' },
        { r: 10, c: 4, n: 40, t: 'side_upper' },
        // Bay 6
        { r: 11, c: 0, n: 41, t: 'lower' }, { r: 11, c: 1, n: 42, t: 'middle' }, { r: 11, c: 2, n: 43, t: 'upper' },
        { r: 11, c: 4, n: 47, t: 'side_lower' },
        { r: 12, c: 0, n: 44, t: 'lower' }, { r: 12, c: 1, n: 45, t: 'middle' }, { r: 12, c: 2, n: 46, t: 'upper' },
        { r: 12, c: 4, n: 48, t: 'side_upper' },
         // Bay 7
        { r: 13, c: 0, n: 49, t: 'lower' }, { r: 13, c: 1, n: 50, t: 'middle' }, { r: 13, c: 2, n: 51, t: 'upper' },
        { r: 13, c: 4, n: 55, t: 'side_lower' },
        { r: 14, c: 0, n: 52, t: 'lower' }, { r: 14, c: 1, n: 53, t: 'middle' }, { r: 14, c: 2, n: 54, t: 'upper' },
        { r: 14, c: 4, n: 56, t: 'side_upper' },
        // Bay 8
        { r: 15, c: 0, n: 57, t: 'lower' }, { r: 15, c: 1, n: 58, t: 'middle' }, { r: 15, c: 2, n: 59, t: 'upper' },
        { r: 15, c: 4, n: 63, t: 'side_lower' },
        { r: 16, c: 0, n: 60, t: 'lower' }, { r: 16, c: 1, n: 61, t: 'middle' }, { r: 16, c: 2, n: 62, t: 'upper' },
        { r: 16, c: 4, n: 64, t: 'side_upper' },
    ];

    // Re-populate layout based on the actual image structure using a simplified 2D grid (17 rows for berths, 2 for toilets)
    const ac3Layout: Seat[][] = Array(18).fill(null).map(() => Array(5).fill(null).map(() => ({ id: `empty-${Math.random()}`, status: 'empty', type: 'empty' })));

    ac3Layout[0][1] = {id: 'T_TOILET_TOP1', displayText: 'TOILET', type: 'toilet', status: 'unavailable'};
    ac3Layout[0][2] = {id: 'T_TOILET_TOP2', displayText: 'TOILET', type: 'toilet', status: 'unavailable'};
    // Add doors later if space
    ac3Layout[0][0] = {id: 'T_ENTRY_TOP_L', displayText: 'ENTRY', type: 'door', status: 'unavailable'};
    ac3Layout[0][4] = {id: 'T_ENTRY_TOP_R', displayText: 'ENTRY', type: 'door', status: 'unavailable'};


    let seatIdx = 0;
    // Main berths (cols 0,1,2) and Side berths (col 4)
    // Loop for 8 bays, each bay takes 2 visual rows in this structure
    for (let bay = 0; bay < 8; bay++) {
        const row1 = bay * 2 + 1; // Berths start from layout row 1
        const row2 = row1 + 1;

        // Main berths - first set of 3
        ac3Layout[row1][0] = { id: `S${seatAssignments[seatIdx].n}`, number: `${seatAssignments[seatIdx].n}`, type: seatAssignments[seatIdx].t, status: Math.random() > 0.3 ? 'available' : 'booked', originalColor: berthColors[seatAssignments[seatIdx].t]}; seatIdx++;
        ac3Layout[row1][1] = { id: `S${seatAssignments[seatIdx].n}`, number: `${seatAssignments[seatIdx].n}`, type: seatAssignments[seatIdx].t, status: Math.random() > 0.3 ? 'available' : 'booked', originalColor: berthColors[seatAssignments[seatIdx].t]}; seatIdx++;
        ac3Layout[row1][2] = { id: `S${seatAssignments[seatIdx].n}`, number: `${seatAssignments[seatIdx].n}`, type: seatAssignments[seatIdx].t, status: Math.random() > 0.3 ? 'available' : 'booked', originalColor: berthColors[seatAssignments[seatIdx].t]}; seatIdx++;
        
        // Side Lower for this bay segment
        ac3Layout[row1][4] = { id: `S${seatAssignments[seatIdx].n}`, number: `${seatAssignments[seatIdx].n}`, type: seatAssignments[seatIdx].t, status: Math.random() > 0.3 ? 'available' : 'booked', originalColor: berthColors[seatAssignments[seatIdx].t]}; seatIdx++;

        // Main berths - second set of 3
        ac3Layout[row2][0] = { id: `S${seatAssignments[seatIdx].n}`, number: `${seatAssignments[seatIdx].n}`, type: seatAssignments[seatIdx].t, status: Math.random() > 0.3 ? 'available' : 'booked', originalColor: berthColors[seatAssignments[seatIdx].t]}; seatIdx++;
        ac3Layout[row2][1] = { id: `S${seatAssignments[seatIdx].n}`, number: `${seatAssignments[seatIdx].n}`, type: seatAssignments[seatIdx].t, status: Math.random() > 0.3 ? 'available' : 'booked', originalColor: berthColors[seatAssignments[seatIdx].t]}; seatIdx++;
        ac3Layout[row2][2] = { id: `S${seatAssignments[seatIdx].n}`, number: `${seatAssignments[seatIdx].n}`, type: seatAssignments[seatIdx].t, status: Math.random() > 0.3 ? 'available' : 'booked', originalColor: berthColors[seatAssignments[seatIdx].t]}; seatIdx++;

        // Side Upper for this bay segment
        ac3Layout[row2][4] = { id: `S${seatAssignments[seatIdx].n}`, number: `${seatAssignments[seatIdx].n}`, type: seatAssignments[seatIdx].t, status: Math.random() > 0.3 ? 'available' : 'booked', originalColor: berthColors[seatAssignments[seatIdx].t]}; seatIdx++;
        
        // Aisle column
        ac3Layout[row1][3] = { id: `AISLE${row1}`, type: 'aisle', status: 'aisle' };
        ac3Layout[row2][3] = { id: `AISLE${row2}`, type: 'aisle', status: 'aisle' };
    }

    ac3Layout[17][1] = {id: 'T_TOILET_BOT1', displayText: 'TOILET', type: 'toilet', status: 'unavailable'};
    ac3Layout[17][2] = {id: 'T_TOILET_BOT2', displayText: 'TOILET', type: 'toilet', status: 'unavailable'};
    ac3Layout[17][0] = {id: 'T_ENTRY_BOT_L', displayText: 'ENTRY', type: 'door', status: 'unavailable'};
    ac3Layout[17][4] = {id: 'T_ENTRY_BOT_R', displayText: 'ENTRY', type: 'door', status: 'unavailable'};


    return ac3Layout;
  }, []);


  useEffect(() => {
    if (selectedDateForCalendar && selectedClass && trainDetails) {
        let layoutToSet: Seat[][] = [];
        if (selectedClass === "3A") { // Only generate specific layout for 3A
            layoutToSet = generateAC3TierLayout();
        } else { // Fallback for other classes (generic or empty)
            // For now, just an empty layout for other classes or a generic one
            const rows = 10; 
            const seatsVisualPerRow = 6;
            const newLayout: Seat[][] = [];
            for (let r = 0; r < rows; r++) {
                const rowSeats: Seat[] = [];
                for (let s = 0; s < seatsVisualPerRow; s++) {
                const seatId = `${selectedClass}-R${r}S${s}`;
                const seatNumber = `${String.fromCharCode(65 + r)}${s + 1}`;
                let type: Seat['type'] = 'middle';
                if (s === 0 || s === seatsVisualPerRow - 1) type = 'window';
                else if (s === 1 || s === seatsVisualPerRow - 2) type = 'middle';
                else if (s === 2 || s === 3) type = 'aisle';
                rowSeats.push({
                    id: seatId, number: seatNumber, status: Math.random() > 0.7 ? 'booked' : 'available', type: type,
                    originalColor: berthColors.middle // Default color
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
  }, [selectedDateForCalendar, selectedClass, trainDetails, generateAC3TierLayout]);


  const handleSeatClick = (seatId: string, seatNumber?: string, currentStatus?: Seat['status']) => {
    if (!seatNumber || currentStatus === 'booked' || currentStatus === 'unavailable' || currentStatus === 'aisle' || currentStatus === 'empty' || currentStatus === 'info') return;

    let newSelectedSeats = [...userSelectedSeats];
    const newLayout = coachLayout.map(row =>
      row.map(seat => {
        if (seat.id === seatId && seat.number) {
          if (seat.status === 'available') {
            if (userSelectedSeats.length < MAX_SEATS_SELECTABLE) {
              newSelectedSeats.push(seat.number); // Store seat number
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
    <div className="container mx-auto px-4 py-8 space-y-8"> {/* Removed max-w-4xl to allow wider layout */}
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
            {/* Other details */}
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
                  numberOfMonths={1} // Changed to 1 to save space
                  className="rounded-md border mb-6"
                  disabled={(date) => isBefore(date, new Date(new Date().setDate(new Date().getDate() -1)))}
                />

                {/* Legend */}
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


                {coachLayout.length > 0 && selectedClass === "3A" ? (
                  <div className="mt-6 overflow-x-auto">
                    <h3 className="text-lg font-semibold mb-3 text-center">AC 3 Tier Coach Layout</h3>
                     <div className="inline-grid grid-cols-5 gap-1 p-2 border rounded-md bg-muted/10 mx-auto max-w-fit"> {/* approx 3 main + aisle + 1 side */}
                        {coachLayout.map((row, rowIndex) => (
                            <React.Fragment key={`layout-row-${rowIndex}`}>
                                {row.map((seat) => {
                                    const seatBaseColor = seat.originalColor || berthColors[seat.type] || 'bg-gray-100';
                                    let displayColor = seatBaseColor;
                                    if (seat.status === 'selected') displayColor = 'bg-blue-600 text-white border-blue-700';
                                    else if (seat.status === 'booked') displayColor = 'bg-gray-400 text-gray-700 border-gray-500 cursor-not-allowed';
                                    else if (seat.status === 'unavailable') displayColor = cn(berthColors[seat.type] || 'bg-gray-200', 'cursor-not-allowed opacity-80');
                                    else if (seat.status === 'aisle' || seat.status === 'empty') displayColor = 'bg-transparent border-transparent';

                                    const isSeatClickable = seat.number && seat.status !== 'booked' && seat.status !== 'unavailable' && seat.status !== 'aisle' && seat.status !== 'empty';
                                    
                                    if (seat.type === 'aisle') {
                                        return <div key={seat.id} className="w-4 h-8"></div>; // Aisle spacer
                                    }
                                    if (seat.type === 'empty') {
                                        return <div key={seat.id} className="w-8 h-8"></div>; // Empty spacer
                                    }

                                    return (
                                        <div
                                            key={seat.id}
                                            onClick={() => isSeatClickable ? handleSeatClick(seat.id, seat.number, seat.status) : null}
                                            className={cn(
                                            "w-10 h-10 border rounded text-xs flex items-center justify-center font-medium transition-all",
                                            displayColor,
                                            isSeatClickable && seat.status === 'available' && 'hover:ring-2 hover:ring-offset-1 hover:ring-primary cursor-pointer',
                                            (seat.type === 'toilet' || seat.type === 'door') && 'text-center leading-tight p-1 text-[10px]'
                                            )}
                                            title={seat.number ? `Seat ${seat.number} (${seat.type})` : seat.displayText || seat.type}
                                        >
                                            {seat.number || seat.displayText || ''}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
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
                ) : coachLayout.length > 0 && selectedClass !== "3A" ? (
                    <div className="mt-6"> {/* Generic Layout for other classes */}
                         <h3 className="text-lg font-semibold mb-2">Select Your Seats (Coach: {selectedClass})</h3>
                         <div className="border p-2 rounded-md bg-muted/20 max-w-md mx-auto">
                            {coachLayout.map((row, rowIndex) => (
                            <div key={`row-${rowIndex}`} className="grid grid-cols-[repeat(3,minmax(0,1fr))_20px_repeat(3,minmax(0,1fr))] gap-1 mb-1">
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
                      {selectedClass === "3A" ? "Generating AC 3 Tier layout..." : "No specific seat layout for this class in the demo, or data is still loading. Please select a valid date."}
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
