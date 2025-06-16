"use client";

import ClientAuthGuard from '@/components/ClientAuthGuard';
import { BookingCard } from '@/components/bookings/booking-card';
import type { Booking } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Ticket, 
  Loader2, 
  AlertTriangle, 
  Calendar,
  Clock,
  MapPin,
  Search,
  Train,
  TrendingUp,
  Star,
  ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { firestore } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      setIsLoadingBookings(false);
      return;
    }

    const fetchBookings = async () => {
      setIsLoadingBookings(true);
      setFetchError(null);
      try {
        const upcomingQuery = query(
          collection(firestore, 'bookings'),
          where('userId', '==', user.uid),
          where('status', '==', 'upcoming'),
          orderBy('travelDate', 'asc')
        );
        const upcomingSnapshot = await getDocs(upcomingQuery);
        const upcoming = upcomingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        setUpcomingBookings(upcoming);

        const pastQuery = query(
          collection(firestore, 'bookings'),
          where('userId', '==', user.uid),
          where('status', '!=', 'upcoming'),
          orderBy('travelDate', 'desc')
        );
        const pastSnapshot = await getDocs(pastQuery);
        const past = pastSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        setPastBookings(past);

      } catch (err) {
        console.error("Error fetching bookings:", err);
        setFetchError("Failed to load your bookings. Please try again later.");
      } finally {
        setIsLoadingBookings(false);
      }
    };

    fetchBookings();
  }, [user, authLoading]);

  const totalBookings = upcomingBookings.length + pastBookings.length;
  const completedBookings = pastBookings.filter(b => b.status === 'completed').length;

  return (
    <ClientAuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
                  <Train className="h-12 w-12 text-white" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                My Journey Dashboard
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                Track your adventures across the rails of India. Your travel memories, all in one place.
              </p>
            </div>

            {/* Stats Cards */}
            {!isLoadingBookings && !fetchError && totalBookings > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <CardContent className="p-6 text-center">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-200" />
                    <div className="text-2xl font-bold">{upcomingBookings.length}</div>
                    <div className="text-sm text-blue-100">Upcoming Trips</div>
                  </CardContent>
                </Card>
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <CardContent className="p-6 text-center">
                    <Star className="h-8 w-8 mx-auto mb-2 text-purple-200" />
                    <div className="text-2xl font-bold">{completedBookings}</div>
                    <div className="text-sm text-purple-100">Completed Journeys</div>
                  </CardContent>
                </Card>
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-200" />
                    <div className="text-2xl font-bold">{totalBookings}</div>
                    <div className="text-sm text-green-100">Total Bookings</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Loading State */}
          {isLoadingBookings && (
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                    <Train className="absolute inset-0 m-auto h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Your Journey</h3>
                    <p className="text-gray-600">Fetching your travel history...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {fetchError && !isLoadingBookings && (
            <Alert variant="destructive" className="border-0 shadow-lg bg-red-50">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="text-lg">Oops! Something went wrong</AlertTitle>
              <AlertDescription className="text-base mt-2">
                {fetchError}
                <Button variant="outline" size="sm" className="ml-4 mt-2" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Empty State */}
          {!isLoadingBookings && !fetchError && upcomingBookings.length === 0 && pastBookings.length === 0 && (
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
              <CardContent className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="mb-8">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Ticket className="h-12 w-12 text-blue-600" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                        <span className="text-xs">✨</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Your Adventure Awaits!</h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    Ready to explore the incredible railway network of India? Book your first journey and create unforgettable memories.
                  </p>
                  <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                    <a href="/" className="flex items-center space-x-2">
                      <Search className="h-5 w-5" />
                      <span>Find Your Next Journey</span>
                      <ChevronRight className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Bookings */}
          {!isLoadingBookings && !fetchError && upcomingBookings.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Upcoming Adventures</h2>
                  <p className="text-gray-600">Your next journeys are just around the corner</p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 px-4 py-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 mr-2" />
                  {upcomingBookings.length} Trip{upcomingBookings.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {upcomingBookings.map(booking => (
                  <div key={booking.id} className="transform hover:scale-[1.02] transition-all duration-300">
                    <BookingCard booking={booking} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Past Bookings */}
          {!isLoadingBookings && !fetchError && pastBookings.length > 0 && (
            <section>
              <Separator className="my-12 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Travel Memories</h2>
                  <p className="text-gray-600">Relive your amazing journeys across India</p>
                </div>
                <Badge variant="outline" className="px-4 py-2 text-sm font-medium">
                  <Clock className="h-4 w-4 mr-2" />
                  {pastBookings.length} Past Trip{pastBookings.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {pastBookings.map(booking => (
                  <div key={booking.id} className="transform hover:scale-[1.02] transition-all duration-300 opacity-80 hover:opacity-100">
                    <BookingCard booking={booking} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Call to Action Section */}
          {!isLoadingBookings && !fetchError && (upcomingBookings.length > 0 || pastBookings.length > 0) && (
            <section className="mt-16">
              <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white overflow-hidden">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  opacity: 0.2
                }}></div>
                <CardContent className="relative p-12 text-center">
                  <div className="max-w-2xl mx-auto">
                    <MapPin className="h-12 w-12 mx-auto mb-6 text-blue-200" />
                    <h3 className="text-3xl font-bold mb-4">Ready for Your Next Adventure?</h3>
                    <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                      India's vast railway network connects countless destinations. Discover new places, create new memories, and embark on your next unforgettable journey.
                    </p>
                    <Button 
                      asChild 
                      size="lg" 
                      variant="secondary"
                      className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg font-semibold px-8 py-4 text-lg"
                    >
                      <a href="/" className="flex items-center space-x-2">
                        <Search className="h-5 w-5" />
                        <span>Plan Your Next Trip</span>
                        <ChevronRight className="h-5 w-5" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      </div>
    </ClientAuthGuard>
  );
}