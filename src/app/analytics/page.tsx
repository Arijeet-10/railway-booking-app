
"use client";

import ClientAuthGuard from '@/components/ClientAuthGuard';
import { useAuth } from '@/hooks/useAuth';
import { firestore } from '@/lib/firebase/config';
import type { Booking } from '@/lib/types';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Hash, DollarSign, MapPin, Info, Loader2 } from 'lucide-react';
import { format, getMonth, getYear, parseISO } from 'date-fns';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface MonthlyBookingData {
  month: string;
  bookings: number;
}

interface MonthlySpendingData {
  month: string;
  amount: number;
}

// interface StationFrequency { // Not used in current implementation
//   station: string;
//   count: number;
// }

const tripsChartConfig = {
  bookings: {
    label: "Trips",
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
          orderBy('travelDate', 'desc')
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
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)] bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading your analytics...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-8 rounded-xl border-destructive/20 bg-destructive/5">
        <Info className="h-5 w-5 text-destructive" />
        <AlertTitle className="text-lg font-semibold">Error</AlertTitle>
        <AlertDescription className="text-sm">{fetchError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <ClientAuthGuard>
      <div className="container mx-auto px-4 py-8 space-y-8 bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <section>
          <h1 className="text-3xl font-headline font-bold text-foreground group-hover:text-primary transition-colors duration-200">
            Your Travel Analytics
          </h1>
          <p className="text-muted-foreground mt-2 mb-6 text-sm">
            Insights into your journeys for the current year ({getYear(new Date())}).
          </p>
        </section>

        {currentYearBookings.length === 0 && !isLoadingBookings && (
          <Alert className="max-w-2xl mx-auto rounded-xl border-primary/20 bg-white/90 backdrop-blur-md shadow-md">
            <Info className="h-5 w-5 text-primary" />
            <AlertTitle className="text-lg font-semibold">No Travel Data Yet for {getYear(new Date())}</AlertTitle>
            <AlertDescription className="text-sm">
              It looks like you haven't completed any trips this year. Once you do, your analytics will appear here.
            </AlertDescription>
          </Alert>
        )}

        {currentYearBookings.length > 0 && (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="group bg-white/90 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 border border-primary/10 hover:border-primary/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Total Trips This Year</CardTitle>
                  <Hash className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{totalBookings}</div>
                  <p className="text-xs text-muted-foreground">completed or upcoming trips</p>
                </CardContent>
              </Card>
              <Card className="group bg-white/90 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 border border-primary/10 hover:border-primary/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Total Spent This Year</CardTitle>
                  <DollarSign className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">₹{totalSpent.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">on train tickets</p>
                </CardContent>
              </Card>
              <Card className="group bg-white/90 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 border border-primary/10 hover:border-primary/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Top Visited Stations</CardTitle>
                  <MapPin className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                </CardHeader>
                <CardContent>
                  {topDestinations.length > 0 ? (
                    <ul className="space-y-2">
                      {topDestinations.map(dest => (
                        <li key={dest.station} className="text-sm flex justify-between items-center">
                          <span className="truncate max-w-[150px]">{dest.station.split('(')[0].trim()}</span>
                          <span className="font-semibold text-primary">{dest.count} {dest.count === 1 ? 'visit' : 'visits'}</span>
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
              <Card className="group bg-white/90 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 border border-primary/10 hover:border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg font-semibold text-foreground">
                    <Hash className="mr-2 h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-200" />
                    Monthly Trips ({getYear(new Date())})
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">Number of trips taken each month.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <ChartContainer config={tripsChartConfig} className="h-[250px] w-full">
                    <BarChart accessibilityLayer data={monthlyBookingsData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <YAxis allowDecimals={false} tickMargin={10} axisLine={false} tickLine={false} />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dashed" />}
                      />
                      <Bar dataKey="bookings" fill="var(--color-bookings)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="group bg-white/90 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 border border-primary/10 hover:border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg font-semibold text-foreground">
                    <DollarSign className="mr-2 h-5 w-5 text-accent group-hover:scale-110 transition-transform duration-200" />
                    Monthly Spending ({getYear(new Date())})
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">Total amount spent on trips each month.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                   <ChartContainer config={spendingChartConfig} className="h-[250px] w-full">
                    <BarChart accessibilityLayer data={monthlySpendingData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <YAxis
                        tickFormatter={(value) => `₹${value}`}
                        allowDecimals={false}
                        tickMargin={10}
                        axisLine={false}
                        tickLine={false}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dashed" />}
                      />
                      <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
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


    