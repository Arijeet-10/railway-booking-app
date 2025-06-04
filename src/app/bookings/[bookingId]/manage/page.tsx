
"use client";

import { useParams, useRouter } from 'next/navigation';
import ClientAuthGuard from '@/components/ClientAuthGuard';
import { useAuth } from '@/hooks/useAuth';
import type { Booking } from '@/lib/types';
import { firestore } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Ticket, CalendarDays, Users, MapPin, Trash2, Download, Edit3, ArrowLeft, DollarSign, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

export default function ManageBookingPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user || !bookingId) {
      if (!authLoading && !user) {
        setIsLoading(false);
      }
      return;
    }

    const fetchBookingDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const bookingRef = doc(firestore, 'bookings', bookingId);
        const docSnap = await getDoc(bookingRef);

        if (docSnap.exists()) {
          const bookingData = { id: docSnap.id, ...docSnap.data() } as Booking;
          if (bookingData.userId === user.uid) {
            setBooking(bookingData);
          } else {
            setError("You do not have permission to view this booking.");
            toast({ title: "Access Denied", description: "You are not authorized to manage this booking.", variant: "destructive" });
            router.push('/bookings');
          }
        } else {
          setError("Booking not found.");
          toast({ title: "Not Found", description: "The requested booking does not exist.", variant: "destructive" });
          router.push('/bookings');
        }
      } catch (err) {
        console.error("Error fetching booking details:", err);
        setError("Failed to load booking details. Please try again.");
        toast({ title: "Error", description: "Could not load booking information.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, user, authLoading, router, toast]);

  const handleCancelBooking = () => {
    toast({
      title: "Cancel Booking (Not Implemented)",
      description: "This feature will be available soon.",
    });
  };

  const handleModifyPassengers = () => {
    toast({
        title: "Modify Passengers (Not Implemented)",
        description: "This feature will be available soon.",
    });
  };

  const handleDownloadTicket = () => {
    if (!booking) {
      toast({ title: "Error", description: "Booking details not loaded.", variant: "destructive" });
      return;
    }

    const doc = new jsPDF();
    let yPos = 20;
    const lineSpacing = 7;
    const sectionSpacing = 12;
    const leftMargin = 20;
    const contentStartMargin = 50;
    const pageWidth = doc.internal.pageSize.getWidth();
    const rightMargin = pageWidth - 20;

    // Main Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text("Indian Rail Connect - eTicket", pageWidth / 2, yPos, { align: "center" });
    doc.setFont(undefined, 'normal');
    yPos += sectionSpacing;

    // Booking Info
    doc.setFontSize(10);
    doc.text(`Booking ID: ${booking.id}`, leftMargin, yPos);
    doc.text(`Booked On: ${new Date(booking.bookingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${new Date(booking.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, rightMargin, yPos, {align: 'right'});
    yPos += sectionSpacing;
    
    doc.setLineWidth(0.2);
    doc.line(leftMargin, yPos - (sectionSpacing / 2), rightMargin, yPos - (sectionSpacing / 2));


    // Journey Details Section
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("Journey Details", leftMargin, yPos);
    doc.setFont(undefined, 'normal');
    yPos += lineSpacing + 2;

    const journeyDetails = [
        { label: "Train:", value: `${booking.trainName} (${booking.trainNumber})` },
        { label: "From:", value: booking.origin },
        { label: "To:", value: booking.destination },
        { label: "Date:", value: new Date(booking.travelDate + "T00:00:00").toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
        { label: "Departure:", value: booking.departureTime },
        { label: "Arrival:", value: booking.arrivalTime },
        { label: "Class:", value: booking.selectedClass.toUpperCase() },
    ];

    doc.setFontSize(11);
    journeyDetails.forEach(detail => {
        doc.setFont(undefined, 'bold');
        doc.text(detail.label, leftMargin, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(detail.value, contentStartMargin, yPos);
        yPos += lineSpacing;
    });
    yPos += sectionSpacing - lineSpacing;
    doc.line(leftMargin, yPos - (sectionSpacing / 2), rightMargin, yPos - (sectionSpacing / 2));

    // Passenger Details Section
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("Passenger Details", leftMargin, yPos);
    doc.setFont(undefined, 'normal');
    yPos += lineSpacing + 2;

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text("S.No.", leftMargin, yPos);
    doc.text("Name", leftMargin + 15, yPos);
    doc.text("Age", leftMargin + 80, yPos);
    doc.text("Gender", leftMargin + 95, yPos);
    doc.text("Berth Pref.", leftMargin + 120, yPos);
    doc.setFont(undefined, 'normal');
    yPos += lineSpacing;

    if (booking.passengersList && booking.passengersList.length > 0) {
      booking.passengersList.forEach((p, index) => {
        if (yPos > 270) { doc.addPage(); yPos = 20; } // Page break
        doc.text(`${index + 1}.`, leftMargin, yPos);
        doc.text(p.name, leftMargin + 15, yPos);
        doc.text(String(p.age), leftMargin + 80, yPos);
        doc.text(p.gender.charAt(0).toUpperCase() + p.gender.slice(1), leftMargin + 95, yPos);
        doc.text(p.preferredBerth.replace(/_/g, ' ').split(' ').map(w=>w.charAt(0).toUpperCase() + w.slice(1)).join(' '), leftMargin + 120, yPos);
        yPos += lineSpacing;
      });
    } else { // Fallback for older bookings without passengersList
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.text("Passenger details not itemized (legacy booking).", leftMargin + 15, yPos);
        yPos += lineSpacing;
        booking.seats.forEach((seat, index) => {
            if (yPos > 270) { doc.addPage(); yPos = 20; }
             doc.text(`${index + 1}.`, leftMargin, yPos);
             doc.text(`Seat: ${seat}`, leftMargin + 15, yPos);
             yPos += lineSpacing;
        });
    }
    yPos += sectionSpacing - lineSpacing;
    doc.line(leftMargin, yPos - (sectionSpacing / 2), rightMargin, yPos - (sectionSpacing / 2));

    // Fare Details
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("Fare Details", leftMargin, yPos);
    doc.setFont(undefined, 'normal');
    yPos += lineSpacing + 2;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("Total Price:", leftMargin, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(`INR ${booking.totalPrice.toFixed(2)}`, contentStartMargin, yPos);
    yPos += sectionSpacing + 5;


    // Footer
    doc.setFontSize(10);
    doc.text("Thank you for choosing Indian Rail Connect! Happy Journey!", pageWidth / 2, yPos, { align: "center" });
    yPos += lineSpacing;
    doc.setFontSize(8);
    doc.text("This is a computer-generated ticket and does not require a signature.", pageWidth / 2, yPos, { align: "center" });


    doc.save(`IndianRailConnect-Ticket-${booking.id}.pdf`);
    toast({
        title: "Ticket Downloading",
        description: "Your ticket PDF is being generated.",
    });
  };


  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading booking details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-lg mx-auto my-10">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
         <Button variant="outline" onClick={() => router.push('/bookings')} className="mt-4">
            Go to My Bookings
        </Button>
      </Alert>
    );
  }

  if (!booking) {
    return (
        <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]">
            <Info className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Booking details could not be loaded.</p>
            <Button variant="link" onClick={() => router.push('/bookings')} className="mt-2">
                Return to My Bookings
            </Button>
        </div>
    );
  }

  return (
    <ClientAuthGuard>
      <div className="max-w-3xl mx-auto space-y-8">
        <Button variant="outline" size="sm" onClick={() => router.push('/bookings')} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Bookings
        </Button>
        <Card className="shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/30">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <CardTitle className="text-2xl font-headline flex items-center">
                        <Ticket className="mr-3 h-7 w-7 text-primary" />
                        Manage Your Booking
                    </CardTitle>
                    <CardDescription>Booking ID: {booking.id}</CardDescription>
                </div>
                {booking.status === 'upcoming' && <span className="mt-2 sm:mt-0 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">Upcoming</span>}
                {booking.status === 'completed' && <span className="mt-2 sm:mt-0 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">Completed</span>}
                {booking.status === 'cancelled' && <span className="mt-2 sm:mt-0 px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Cancelled</span>}
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-primary">{booking.trainName} ({booking.trainNumber})</h3>
              <p className="text-sm text-muted-foreground flex items-center mt-1">
                <MapPin className="mr-2 h-4 w-4" />
                {booking.origin} to {booking.destination}
              </p>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4" /> Travel Date</p>
                    <p className="font-medium">{new Date(booking.travelDate + "T00:00:00").toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                 <div>
                    <p className="text-sm text-muted-foreground">Departure - Arrival</p>
                    <p className="font-medium">{booking.departureTime} - {booking.arrivalTime}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Class</p>
                    <p className="font-medium">{booking.selectedClass.toUpperCase()}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground flex items-center"><DollarSign className="mr-1 h-4 w-4 text-green-600" />Total Price</p>
                    <p className="font-medium text-green-600">₹{booking.totalPrice.toFixed(2)}</p>
                </div>
            </div>
            <Separator />
            <div>
                <h4 className="text-md font-semibold mb-2 flex items-center">
                    <Users className="mr-2 h-5 w-5 text-muted-foreground" /> Passengers ({booking.passengersList?.length || booking.seats.length})
                </h4>
                {booking.passengersList && booking.passengersList.length > 0 ? (
                    <ul className="list-disc list-inside pl-4 space-y-1 text-sm">
                        {booking.passengersList.map((p, index) => (
                            <li key={index}>{p.name} (Age: {p.age}, Gender: {p.gender.charAt(0).toUpperCase() + p.gender.slice(1)}, Berth: {p.preferredBerth.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')})</li>
                        ))}
                    </ul>
                ) : (
                     <ul className="list-disc list-inside pl-4 space-y-1 text-sm">
                        {booking.seats.map((seatName, index) => (
                            <li key={index}>{seatName}</li>
                        ))}
                    </ul>
                )}
            </div>
             <Separator />
             <p className="text-xs text-muted-foreground">Booked on: {new Date(booking.bookingDate).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </CardContent>
          {booking.status === 'upcoming' && (
            <CardFooter className="bg-muted/30 p-6 border-t flex flex-col sm:flex-row gap-3 justify-end">
                <Button variant="outline" onClick={handleModifyPassengers}>
                    <Edit3 className="mr-2 h-4 w-4" /> Modify Passengers
                </Button>
                <Button variant="default" onClick={handleDownloadTicket}>
                    <Download className="mr-2 h-4 w-4" /> Download Ticket
                </Button>
                <Button variant="destructive" onClick={handleCancelBooking}>
                    <Trash2 className="mr-2 h-4 w-4" /> Cancel Booking
                </Button>
            </CardFooter>
          )}
           {booking.status === 'completed' && (
            <CardFooter className="bg-muted/30 p-6 border-t flex justify-end">
                <Button variant="outline">Leave a Review</Button>
            </CardFooter>
          )}
           {booking.status === 'cancelled' && (
            <CardFooter className="bg-muted/30 p-6 border-t flex justify-end">
                <p className="text-sm text-destructive">This booking has been cancelled.</p>
            </CardFooter>
          )}
        </Card>
      </div>
    </ClientAuthGuard>
  );
}

    