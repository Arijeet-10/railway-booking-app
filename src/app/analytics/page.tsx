
"use client";

import ClientAuthGuard from '@/components/ClientAuthGuard';
import { useAuth } from '@/hooks/useAuth';
import { firestore } from '@/lib/firebase/config';
import type { Booking } from '@/lib/types';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart as BarChartIcon, DollarSign, Hash, TrendingUp, MapPin, Info, Loader2 } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { format, getMonth, getYear, parseISO } from 'date-fns';

interface MonthlyBookingData {
  month: string;
  bookings: number;
}

interface MonthlySpendingData {
  month: string;
  amount: number;
}

interface StationFrequency {
  station: string;
  count: number;
}

const bookingsChartConfig = {
  bookings: {
    label: "Bookings",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const spendingChartConfig = {
  amount: {
    label: "Spending (₹)",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;


export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading && !user) setIsLoadingBookings(false);
      return;
    }

    const fetchUserBookings = async () => {
      setIsLoadingBookings(true);
      setFetchError(null);
      try {
        const bookingsQuery = query(
          collection(firestore, 'bookings'),
          where('userId', '==', user.uid),
          orderBy('travelDate', 'desc') // Fetch all, will filter by year client-side
        );
        const querySnapshot = await getDocs(bookingsQuery);
        const userBookings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        setBookings(userBookings);
      } catch (err) {
        console.error("Error fetching bookings for analytics:", err);
        setFetchError("Failed to load your travel data. Please try again later.");
      } finally {
        setIsLoadingBookings(false);
      }
    };

    fetchUserBookings();
  }, [user, authLoading]);

  const currentYearBookings = useMemo(() => {
    const currentYear = getYear(new Date());
    return bookings.filter(b => getYear(parseISO(b.travelDate + "T00:00:00")) === currentYear && b.status !== 'cancelled');
  }, [bookings]);
  
  const totalBookings = useMemo(() => currentYearBookings.length, [currentYearBookings]);
  const totalSpent = useMemo(() => {
    return currentYearBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
  }, [currentYearBookings]);

  const topDestinations = useMemo(() => {
    const destinationCounts: { [key: string]: number } = {};
    currentYearBookings.forEach(booking => {
      destinationCounts[booking.destination] = (destinationCounts[booking.destination] || 0) + 1;
    });
    return Object.entries(destinationCounts)
      .map(([station, count]) => ({ station, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [currentYearBookings]);

  const monthlyBookingsData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const data: MonthlyBookingData[] = monthNames.map(name => ({ month: name, bookings: 0 }));
    
    currentYearBookings.forEach(booking => {
      const monthIndex = getMonth(parseISO(booking.travelDate + "T00:00:00"));
      data[monthIndex].bookings += 1;
    });
    return data;
  }, [currentYearBookings]);

  const monthlySpendingData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const data: MonthlySpendingData[] = monthNames.map(name => ({ month: name, amount: 0 }));

    currentYearBookings.forEach(booking => {
      const monthIndex = getMonth(parseISO(booking.travelDate + "T00:00:00"));
      data[monthIndex].amount += booking.totalPrice;
    });
    return data;
  }, [currentYearBookings]);


  if (authLoading || isLoadingBookings) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading your analytics...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{fetchError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <ClientAuthGuard>
      <div className="space-y-8">
        <section>
          <h1 className="text-3xl font-headline font-bold mb-2">Your Travel Analytics</h1>
          <p className="text-muted-foreground mb-6">Insights into your journeys for the current year ({getYear(new Date())}).</p>
        </section>

        {currentYearBookings.length === 0 && !isLoadingBookings && (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No Travel Data Yet for {getYear(new Date())}</AlertTitle>
                <AlertDescription>
                It looks like you haven't completed any trips this year. Once you do, your analytics will appear here.
                </AlertDescription>
            </Alert>
        )}

        {currentYearBookings.length > 0 && (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Trips This Year</CardTitle>
                  <Hash className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalBookings}</div>
                  <p className="text-xs text-muted-foreground">completed or upcoming trips</p>
                </CardContent>
              </Card>
              <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent This Year</CardTitle>
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{totalSpent.toFixed(2)}</div>
                   <p className="text-xs text-muted-foreground">on train tickets</p>
                </CardContent>
              </Card>
              <Card className="shadow-md">
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Top Visited Stations</CardTitle>
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {topDestinations.length > 0 ? (
                        <ul className="space-y-1">
                        {topDestinations.map(dest => (
                            <li key={dest.station} className="text-sm flex justify-between">
                                <span>{dest.station.split('(')[0].trim()}</span>
                                <span className="font-semibold">{dest.count} {dest.count === 1 ? 'visit' : 'visits'}</span>
                            </li>
                        ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">No specific top stations yet.</p>
                    )}
                </CardContent>
              </Card>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChartIcon className="mr-2 h-5 w-5 text-primary" />
                    Monthly Trips ({getYear(new Date())})
                  </CardTitle>
                  <CardDescription>Number of trips taken each month.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={bookingsChartConfig} className="min-h-[250px] w-full aspect-video">
                    <BarChart data={monthlyBookingsData} accessibilityLayer margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
                       <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" hideLabel />}
                        />
                      <Legend content={<ChartLegendContent />} />
                      <Bar dataKey="bookings" fill="var(--color-bookings)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-accent" />
                    Monthly Spending ({getYear(new Date())})
                  </CardTitle>
                  <CardDescription>Total amount spent on trips each month.</CardDescription>
                </CardHeader>
                <CardContent>
                   <ChartContainer config={spendingChartConfig} className="min-h-[250px] w-full aspect-video">
                    <BarChart data={monthlySpendingData} accessibilityLayer margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis 
                        tickFormatter={(value) => `₹${value/1000}k`} 
                        tickLine={false} axisLine={false} width={40}
                       />
                       <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" hideLabel formatter={(value) => `₹${Number(value).toFixed(2)}`} />}
                        />
                      <Legend content={<ChartLegendContent />} />
                      <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>
    </ClientAuthGuard>
  );
}

