"use client";

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { TrainDetailed, Seat } from '@/lib/types';
import { ChevronRight, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, startOfMonth, isBefore } from 'date-fns';
import { MOCK_TRAINS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

// --- NEW UI COMPONENT ---
const BookingStepper = () => (
    <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-8">
        <div className="flex items-center text-sm font-semibold text-primary">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground mr-2">1</span>
            Seat Selection
        </div>
        <div className="flex-1 border-t-2 border-dashed border-border"></div>
        <div className="flex items-center text-sm text-muted-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground mr-2">2</span>
            Passenger Details
        </div>
        <div className="flex-1 border-t-2 border-dashed border-border"></div>
        <div className="flex items-center text-sm text-muted-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground mr-2">3</span>
            Payment
        </div>
    </div>
);

const TrainDetailItem: React.FC<{ label: string; value: string | undefined; }> = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-primary/10 last:border-b-0 group">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{value || '-'}</span>
    </div>
);

const berthColors: Record<Seat['type'], string> = {
    lower: 'bg-yellow-200 border-yellow-300 hover:bg-yellow-300',
    middle: 'bg-pink-200 border-pink-300 hover:bg-pink-300',
    upper: 'bg-sky-200 border-sky-300 hover:bg-sky-300',
    side_lower: 'bg-green-200 border-green-300 hover:bg-green-300',
    side_upper: 'bg-purple-200 border-purple-300 hover:bg-purple-300',
    door: 'bg-gray-200 border-gray-300 text-gray-600',
    aisle: 'bg-transparent',
    empty: 'bg-transparent border-transparent',
    legend_title: '', legend_item: '', toilet: '',
};

const legendData = [
    { label: 'Lower Berth', colorClass: berthColors.lower },
    { label: 'Middle Berth', colorClass: berthColors.middle },
    { label: 'Upper Berth', colorClass: berthColors.upper },
    { label: 'Side Lower', colorClass: berthColors.side_lower },
    { label: 'Side Upper', colorClass: berthColors.side_upper },
    { label: 'Selected', colorClass: 'bg-blue-600 text-white border-blue-700' },
    { label: 'Booked', colorClass: 'bg-gray-400 border-gray-500' },
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
    const [coachLayout, setCoachLayout] = useState<Seat[][]>([]);
    const [userSelectedSeats, setUserSelectedSeats] = useState<string[]>([]);
    const MAX_SEATS_SELECTABLE = 6;

    const today = useMemo(() => new Date(new Date().setHours(0, 0, 0, 0)), []);
    const initialDate = useMemo(() => {
        try {
            if (queryDateString) {
                const parsed = parseISO(queryDateString);
                if (!isNaN(parsed.valueOf()) && !isBefore(parsed, today)) return parsed;
            }
        } catch (e) { /* Invalid date string */ }
        return today;
    }, [queryDateString, today]);

    const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(initialDate));
    const [selectedDateForCalendar, setSelectedDateForCalendar] = useState<Date | undefined>(initialDate);
    const [selectedClass, setSelectedClass] = useState<string>(queryClass || "SL");

    const breadcrumbOrigin = queryOrigin || trainDetails?.origin || "Unknown Origin";
    const breadcrumbDestination = queryDestination || trainDetails?.destination || "Unknown Destination";
    const currentSelectedDateForURL = useMemo(() => format(selectedDateForCalendar || new Date(), 'yyyy-MM-dd'), [selectedDateForCalendar]);

    useEffect(() => {
        setIsLoading(true);
        setTimeout(() => {
            const details = MOCK_TRAINS.find(train => train.id === trainId);
            if (details) {
                setTrainDetails(details);
                const standardClasses = ['1A', '2A', '3A', 'SL', '2S'];
                const availableStandardClasses = standardClasses.filter(cls => details.availableClasses.includes(cls as any));
                if (!availableStandardClasses.includes(selectedClass)) {
                    setSelectedClass(availableStandardClasses[0] || details.availableClasses[0] || 'SL');
                }
            } else {
                toast({ title: "Error", description: "Train details not found.", variant: "destructive" });
            }
            setIsLoading(false);
        }, 100);
    }, [trainId, toast]);

    const createLayoutGrid = (rows: number, cols: number): Seat[][] =>
        Array(rows).fill(null).map(() => Array(cols).fill({ id: `empty-${Math.random()}`, status: 'empty', type: 'empty' }));

    const generateBerthLayout = useCallback((rows: number, bays: number, hasMiddle: boolean, hasSide: boolean, classSuffix: string): Seat[][] => {
        const layout = createLayoutGrid(rows, 5);
        let seatNum = 1;
        const makeSeat = (type: Seat['type']): Seat => ({ id: `S${seatNum}_${classSuffix}`, number: `${seatNum++}`, type, status: Math.random() > 0.3 ? 'available' : 'booked' });

        for (let bay = 0; bay < bays; bay++) {
            const r1 = bay * 2 + 1, r2 = r1 + 1;
            if (r2 >= rows - 1) break;

            layout[r1][3] = { id: `AISLE${r1}_${classSuffix}`, type: 'aisle', status: 'aisle' };
            layout[r2][3] = { id: `AISLE${r2}_${classSuffix}`, type: 'aisle', status: 'aisle' };
            
            layout[r1][0] = makeSeat('lower');
            if (hasMiddle) layout[r1][1] = makeSeat('middle');
            layout[r1][2] = makeSeat('upper');
            
            layout[r2][0] = makeSeat('lower');
            if (hasMiddle) layout[r2][1] = makeSeat('middle');
            layout[r2][2] = makeSeat('upper');
            
            if (hasSide) {
                layout[r1][4] = makeSeat('side_lower');
                layout[r2][4] = makeSeat('side_upper');
            }
        }
        return layout;
    }, []);

    const generateAC3TierLayout = useCallback(() => generateBerthLayout(18, 8, true, true, '3A'), [generateBerthLayout]);
    const generateSleeperLayout = useCallback(() => generateBerthLayout(18, 9, true, true, 'SL'), [generateBerthLayout]);
    const generateAC2TierLayout = useCallback(() => generateBerthLayout(18, 8, false, true, '2A'), [generateBerthLayout]);

    const generateAC1TierLayout = useCallback((): Seat[][] => {
        const layout = createLayoutGrid(18, 3);
        let seatNum = 1;
        const makeSeat = (type: Seat['type']): Seat => ({ id: `S${seatNum}_1A`, number: `${seatNum++}`, type, status: Math.random() > 0.3 ? 'available' : 'booked' });
        
        for (let i = 0; i < 18; i++) layout[i][1] = { id: `AISLE${i}_1A`, type: 'aisle', status: 'aisle' };
        
        // Coupes (2 berths) & Cabins (4 berths)
        const placements = [1, 3, 4, 6, 7, 9, 11, 12, 14, 15]; // Example row placements
        placements.forEach(row => {
            layout[row][0] = makeSeat('lower');
            layout[row][2] = makeSeat('upper');
        });
        return layout;
    }, []);

    useEffect(() => {
        if (selectedDateForCalendar && selectedClass && trainDetails) {
            const layoutGenerators: Record<string, () => Seat[][]> = {
                "1A": generateAC1TierLayout, "2A": generateAC2TierLayout,
                "3A": generateAC3TierLayout, "SL": generateSleeperLayout,
            };
            setCoachLayout(layoutGenerators[selectedClass]?.() || []);
            setUserSelectedSeats([]);
        }
    }, [selectedDateForCalendar, selectedClass, trainDetails, generateAC1TierLayout, generateAC2TierLayout, generateAC3TierLayout, generateSleeperLayout]);

    const handleSeatClick = (seat: Seat) => {
        if (!seat.number || !['available', 'selected'].includes(seat.status)) return;
        
        const isSelected = userSelectedSeats.includes(seat.number);
        if (!isSelected && userSelectedSeats.length >= MAX_SEATS_SELECTABLE) {
            toast({ title: "Selection Limit Reached", description: `You can select a maximum of ${MAX_SEATS_SELECTABLE} seats.` });
            return;
        }

        setUserSelectedSeats(current => isSelected ? current.filter(s => s !== seat.number) : [...current, seat.number]);
        setCoachLayout(layout => layout.map(row => row.map(s => s.id === seat.id ? { ...s, status: isSelected ? 'available' : 'selected' } : s)));
    };

    const handleDateOrClassChange = (value: Date | string) => {
        const newDate = value instanceof Date ? value : selectedDateForCalendar;
        const newClass = typeof value === 'string' ? value : selectedClass;
        
        if (newDate && isBefore(newDate, today)) {
            toast({ title: "Invalid Date", description: "Cannot select a past date.", variant: "destructive" });
            return;
        }

        if (newDate) setSelectedDateForCalendar(newDate);
        if (typeof value === 'string') setSelectedClass(newClass);

        const newUrl = `/trains/${trainId}/seats?origin=${encodeURIComponent(breadcrumbOrigin)}&destination=${encodeURIComponent(breadcrumbDestination)}&date=${format(newDate || new Date(), 'yyyy-MM-dd')}&class=${newClass}`;
        router.push(newUrl, { scroll: false });
    };

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }
    if (!trainDetails) {
        return <div className="text-center py-10">Train details not found.</div>;
    }

    const standardClasses = ['1A', '2A', '3A', 'SL', '2S'];

    return (
        <div className="bg-gradient-to-b from-slate-50 to-white min-h-screen">
            <div className="container mx-auto px-4 py-8 space-y-8">
                <BookingStepper />

                <Card className="bg-white/90 backdrop-blur-sm shadow-lg border border-primary/10">
                    <CardHeader>
                        <CardTitle className="text-2xl">Train & Route</CardTitle>
                        <CardDescription>{breadcrumbOrigin} to {breadcrumbDestination}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TrainDetailItem label="Train Name" value={trainDetails.trainName} />
                        <TrainDetailItem label="Train Number" value={trainDetails.trainNumber} />
                    </CardContent>
                </Card>

                <Tabs value={selectedClass} onValueChange={handleDateOrClassChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-4 bg-primary/10 rounded-lg p-1">
                        {standardClasses.map(cls => (
                            <TabsTrigger key={cls} value={cls} disabled={!trainDetails.availableClasses.includes(cls as any)}
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                {cls}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value={selectedClass} forceMount>
                        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border border-primary/10">
                            <CardHeader>
                                <CardTitle>Select Date & Seats</CardTitle>
                                <CardDescription>
                                    Availability for <span className="font-semibold text-primary">{selectedClass}</span> on <span className="font-semibold text-primary">{format(selectedDateForCalendar || new Date(), "PPP")}</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-3 gap-8">
                                <div className="md:col-span-1 space-y-6">
                                    <Calendar mode="single" selected={selectedDateForCalendar} onSelect={(d) => d && handleDateOrClassChange(d)} month={currentMonth} onMonthChange={setCurrentMonth} className="rounded-md border shadow-inner bg-muted/20" disabled={(date) => isBefore(date, today)} />
                                    <div className="p-3 border rounded-md">
                                        <h4 className="text-sm font-semibold mb-2">Legend</h4>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            {legendData.map(item => (
                                                <div key={item.label} className="flex items-center"><span className={cn("inline-block w-3 h-3 mr-2 rounded-sm border", item.colorClass)}></span>{item.label}</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    {coachLayout.length > 0 ? (
                                        <div className="overflow-x-auto p-4 border rounded-lg bg-muted/20">
                                            <h3 className="text-md font-semibold mb-3 text-center">{selectedClass} Coach Layout</h3>
                                            <div className="flex flex-col items-center space-y-1">
                                                {coachLayout.map((row, rowIndex) => (
                                                    <div key={`row-${rowIndex}`} className="flex flex-row space-x-1">
                                                        {row.map((seat) => (
                                                            <button key={seat.id} onClick={() => handleSeatClick(seat)} disabled={!['available', 'selected'].includes(seat.status)}
                                                                className={cn("w-10 h-8 border rounded text-xs flex items-center justify-center font-medium transition-all",
                                                                    seat.status === 'selected' ? 'bg-blue-600 text-white border-blue-700' :
                                                                    seat.status === 'booked' ? 'bg-gray-400 text-gray-600 border-gray-500 cursor-not-allowed' :
                                                                    seat.status === 'available' ? `${berthColors[seat.type]} hover:ring-2 hover:ring-primary` : 'bg-transparent border-transparent',
                                                                    seat.type === 'aisle' && 'w-6'
                                                                )}
                                                                title={seat.number ? `Seat ${seat.number}` : ''}>
                                                                {seat.type !== 'aisle' ? seat.number : ''}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : <Alert><AlertDescription>No visual layout for this class or date. Please select another option.</AlertDescription></Alert>}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
                
                {userSelectedSeats.length > 0 && (
                    <Card className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-lg shadow-2xl z-50 bg-background/95 backdrop-blur-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold">{userSelectedSeats.length} Seat{userSelectedSeats.length > 1 ? 's' : ''} Selected</p>
                                <p className="text-xs text-muted-foreground truncate">{userSelectedSeats.join(', ')}</p>
                            </div>
                            <Button asChild>
                                <Link href={`/bookings/passenger-details?trainId=${trainId}&date=${currentSelectedDateForURL}&class=${selectedClass}&origin=${encodeURIComponent(breadcrumbOrigin)}&destination=${encodeURIComponent(breadcrumbDestination)}&selectedSeats=${userSelectedSeats.join(',')}`}>
                                    Proceed <ChevronRight className="ml-1 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}