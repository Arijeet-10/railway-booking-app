
"use client";

import { useParams, useRouter } from 'next/navigation';
import ClientAuthGuard from '@/components/ClientAuthGuard';
import { useAuth } from '@/hooks/useAuth';
import type { Booking } from '@/lib/types';
import { firestore } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Ticket, CalendarDays, Users, MapPin, Trash2, Download, Edit3, ArrowLeft, DollarSign, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { format, parseISO, addDays } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ManageBookingPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

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

  const handleCancelBookingTrigger = () => {
    setIsCancelDialogOpen(true);
  };

  const confirmCancelBooking = async () => {
    if (!booking) return;
    setIsCancelling(true);
    try {
      const bookingRef = doc(firestore, 'bookings', booking.id);
      await updateDoc(bookingRef, {
        status: 'cancelled'
      });
      setBooking(prev => prev ? { ...prev, status: 'cancelled' } : null);
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been successfully cancelled.",
      });
      setIsCancelDialogOpen(false);
    } catch (err) {
      console.error("Error cancelling booking:", err);
      toast({
        title: "Cancellation Failed",
        description: "Could not cancel the booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
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

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight(); // Added for footer calculation
    const margin = 40;
    const contentWidth = pageWidth - 2 * margin;
    let currentY = margin; // Renamed yPos to currentY for clarity

    // Define colors
    const colors = {
      primary: [75, 0, 130], // #4B0082 Deep Indigo
      secondary: [0, 128, 128], // #008080 Teal
      accent: [100, 149, 237], // Cornflower Blue as accent (example)
      dark: [52, 58, 64],      // Dark gray
      light: [248, 249, 250],  // Light gray
      danger: [220, 53, 69],   // Red
      white: [255, 255, 255],
      text: [33, 37, 41]       // Dark text for content
    };

    const setColor = (colorArray: number[], type = 'text') => {
      if (type === 'text') {
        doc.setTextColor(colorArray[0], colorArray[1], colorArray[2]);
      } else if (type === 'fill') {
        doc.setFillColor(colorArray[0], colorArray[1], colorArray[2]);
      } else if (type === 'draw') {
        doc.setDrawColor(colorArray[0], colorArray[1], colorArray[2]);
      }
    };
    
    // Calculate arrivalDate for PDF
    let arrivalDate: Date = parseISO(booking.travelDate + "T00:00:00"); // Default to travelDate
    const [depHourStr, depMinStr] = booking.departureTime.split(':');
    const [arrHourStr, arrMinStr] = booking.arrivalTime.split(':');
    const depHour = parseInt(depHourStr, 10);
    const depMinute = parseInt(depMinStr, 10);
    const arrHour = parseInt(arrHourStr, 10);
    const arrMinute = parseInt(arrMinStr, 10);

    if (arrHour < depHour || (arrHour === depHour && arrMinute < depMinute)) {
        arrivalDate = addDays(parseISO(booking.travelDate + "T00:00:00"), 1);
    }


    // Header
    setColor(colors.primary, 'fill');
    doc.rect(0, 0, pageWidth, 70, 'F'); // Reduced header height
    setColor(colors.white, 'text');
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text("ELECTRONIC RESERVATION SLIP", pageWidth / 2, currentY + 5, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text("(ERS) - RailEase Ticket", pageWidth / 2, currentY + 25, { align: 'center' });
    currentY += 40; // Adjusted starting currentY after header

    // PNR, Train, Class Info Section
    currentY += 15;
    setColor(colors.text, 'text');
    doc.setFontSize(10);
    doc.text(`PNR: ${booking.pnr || 'N/A'}`, margin, currentY);
    doc.text(`Train: ${booking.trainNumber} / ${booking.trainName}`, margin + contentWidth / 3, currentY);
    doc.text(`Class: ${booking.selectedClass.toUpperCase()}`, margin + (contentWidth / 3) * 2, currentY);
    currentY += 15;
    doc.text(`Quota: ${booking.quota || 'N/A'}`, margin, currentY);
    doc.text(`Distance: ${booking.distance || 'N/A'}`, margin + contentWidth / 3, currentY);
    doc.text(`Booking Date: ${format(parseISO(booking.bookingDate), "dd-MMM-yy HH:mm")}`, margin + (contentWidth / 3) * 2, currentY);
    currentY += 10;
    doc.setLineWidth(0.5);
    setColor(colors.dark, 'draw');
    doc.line(margin, currentY, pageWidth - margin, currentY); // Separator
    currentY += 15;

    // Journey Details Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    setColor(colors.primary, 'text');
    doc.text("Journey Details", margin, currentY);
    currentY += 18;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    setColor(colors.text, 'text');

    const journeyColumnWidth = contentWidth / 3;
    const journeyY = currentY;

    doc.text("From:", margin, journeyY);
    doc.setFont('helvetica', 'bold');
    doc.text(booking.origin.toUpperCase(), margin, journeyY + 15);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dep: ${format(parseISO(booking.travelDate + "T00:00:00"), "dd MMM yyyy")}, ${booking.departureTime}`, margin, journeyY + 30);

    doc.text("To:", margin + journeyColumnWidth + 20, journeyY); // Adjusted X for "To"
    doc.setFont('helvetica', 'bold');
    doc.text(booking.destination.toUpperCase(), margin + journeyColumnWidth + 20, journeyY + 15);
    doc.setFont('helvetica', 'normal');
    doc.text(`Arr: ${format(arrivalDate, "dd MMM yyyy")}, ${booking.arrivalTime}`, margin + journeyColumnWidth + 20, journeyY + 30);
    currentY = journeyY + 45;


    doc.setLineWidth(0.5);
    setColor(colors.dark, 'draw');
    doc.line(margin, currentY, pageWidth - margin, currentY); // Separator
    currentY += 15;

    // Passenger Details Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    setColor(colors.primary, 'text');
    doc.text("Passenger Details", margin, currentY);
    currentY += 18;

    // Table Headers
    const passengerTableStartY = currentY;
    setColor(colors.light, 'fill'); // Light background for header row
    doc.rect(margin, currentY - 2, contentWidth, 20, 'F');
    setColor(colors.dark, 'text');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const colWidths = [30, (contentWidth - 30) * 0.3, (contentWidth - 30) * 0.15, (contentWidth - 30) * 0.15, (contentWidth - 30) * 0.20, (contentWidth - 30) * 0.20];
    let currentX = margin;
    const headers = ["SNo", "Name", "Age", "Gender", "Booking Status", "Current Status"];
    headers.forEach((header, i) => {
      doc.text(header, currentX + 3, currentY + 12);
      currentX += colWidths[i];
    });
    currentY += 20;

    // Passenger Rows
    setColor(colors.text, 'text');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    (booking.passengersList || []).forEach((passenger, index) => {
      currentX = margin;
      if (index % 2 !== 0) { // Alternate row color
          setColor(colors.light, 'fill');
          doc.rect(margin, currentY -2 , contentWidth, 18, 'F');
          setColor(colors.text, 'text');
      }
      doc.text(`${index + 1}`, currentX + 3, currentY + 10);
      currentX += colWidths[0];
      doc.text(passenger.name.toUpperCase(), currentX + 3, currentY + 10);
      currentX += colWidths[1];
      doc.text(String(passenger.age), currentX + 3, currentY + 10);
      currentX += colWidths[2];
      doc.text(passenger.gender.charAt(0).toUpperCase(), currentX + 3, currentY + 10);
      currentX += colWidths[3];
      doc.text(passenger.bookingStatus || 'N/A', currentX + 3, currentY + 10);
      currentX += colWidths[4];
      doc.text(passenger.currentStatus || 'N/A', currentX + 3, currentY + 10);
      currentY += 18; // Height for each passenger row
    });
    // Draw table lines
    setColor(colors.dark, 'draw');
    doc.setLineWidth(0.5);
    doc.rect(margin, passengerTableStartY - 2, contentWidth, currentY - passengerTableStartY); // Outer box for table
    currentX = margin;
    for(let i = 0; i < colWidths.length -1; i++) {
        currentX += colWidths[i];
        doc.line(currentX, passengerTableStartY -2, currentX, currentY -2); // Vertical lines
    }
     doc.line(margin, passengerTableStartY -2 + 20, pageWidth - margin, passengerTableStartY -2 + 20); // Horizontal line after header

    currentY += 10; // Space after passenger table

    // Fare Details Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    setColor(colors.primary, 'text');
    doc.text("Fare Details", margin, currentY);
    currentY += 18;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    setColor(colors.text, 'text');
    doc.text(`Ticket Fare:`, margin, currentY);
    doc.text(`₹ ${booking.ticketFare?.toFixed(2) || 'N/A'}`, pageWidth - margin - 100, currentY, {align: 'right'});
    currentY += 15;
    doc.text(`Convenience Fee (Incl. GST):`, margin, currentY);
    doc.text(`₹ ${booking.convenienceFee?.toFixed(2) || 'N/A'}`, pageWidth - margin - 100, currentY, {align: 'right'});
    currentY += 15;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount:`, margin, currentY);
    doc.text(`₹ ${booking.totalPrice.toFixed(2)}`, pageWidth - margin - 100, currentY, {align: 'right'});
    currentY += 10;
    doc.setLineWidth(0.5);
    setColor(colors.dark, 'draw');
    doc.line(margin, currentY, pageWidth - margin, currentY); // Separator
    currentY += 15;

    // Transaction ID
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    setColor(colors.text, 'text');
    doc.text(`Transaction ID: ${booking.transactionId || 'N/A'}`, margin, currentY);
    currentY += 20;

    // Important Notes - reduced font size and content for fitting
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    setColor(colors.danger, 'text');
    doc.text("Important Notes:", margin, currentY);
    currentY += 15;
    doc.setFontSize(7); // Smaller font for notes
    doc.setFont('helvetica', 'normal');
    setColor(colors.text, 'text');
    const notes = [
      "• Carry original Photo ID proof. ERS/VRM/SMS with ID is mandatory.",
      "• Verify Departure/Arrival times from Railway Station or Dial 139.",
      "• This ticket is booked on personal User ID. Sale/Purchase is punishable.",
      "• IRCTC Convenience Fee is per e-ticket irrespective of passenger count."
    ];
    notes.forEach(note => {
      const splitText = doc.splitTextToSize(note, contentWidth);
      doc.text(splitText, margin, currentY);
      currentY += (splitText.length * 8) + 2; // Adjusted line height for 7pt font
       if (currentY > pageHeight - margin - 30) { // Check if overflowing
            doc.addPage();
            currentY = margin;
       }
    });


    // GST Details (Simplified)
    currentY += 10;
     if (currentY > pageHeight - margin - 60) { // Check before adding GST
        doc.addPage();
        currentY = margin;
    }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    setColor(colors.primary, 'text');
    doc.text("GST Details (Supplier):", margin, currentY);
    currentY += 12;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    setColor(colors.text, 'text');
    doc.text(`GSTIN: ${booking.gstDetails?.supplierGstin || 'N/A'}`, margin, currentY);
    doc.text(`SAC: ${booking.gstDetails?.supplierSacCode || 'N/A'}`, margin + contentWidth / 2, currentY);
    currentY += 12;
    doc.text(`Address: ${booking.gstDetails?.supplierAddress || 'Indian Railways, New Delhi'}`, margin, currentY);
    currentY += 20;

    // Footer
    const footerY = pageHeight - 30;
    doc.setFontSize(8);
    setColor(colors.dark, 'text');
    doc.text("This is a computer generated ticket. For RailEase by Firebase Studio.", margin, footerY);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth - margin, footerY, { align: 'right' });


    doc.save(`RailEase-Ticket-${booking.id}.pdf`);
    toast({
      title: "Success",
      description: "Your ticket PDF has been generated successfully!",
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

  const travelDateDisplay = booking.travelDate ? format(parseISO(booking.travelDate + "T00:00:00"), "PPP") : "N/A";
  const bookingDateDisplay = booking.bookingDate ? format(parseISO(booking.bookingDate), "PPpp") : "N/A";


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
                <CardDescription>Booking ID: {booking.id} (PNR: {booking.pnr || 'N/A'})</CardDescription>
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
                <p className="font-medium">{travelDateDisplay}</p>
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
                <p className="text-sm text-muted-foreground">Distance</p>
                <p className="font-medium">{booking.distance || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quota</p>
                <p className="font-medium">{booking.quota || 'N/A'}</p>
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
                    <li key={index}>
                      {p.name} (Age: {p.age}, Gender: {p.gender.charAt(0).toUpperCase() + p.gender.slice(1)}, Berth: {p.preferredBerth.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')})
                      <br />
                      <span className="text-xs text-muted-foreground">Booking: {p.bookingStatus || (p.age && p.age > 18 ? 'CNF/S10/34' : 'WL/15')} | Current: {p.currentStatus || (p.age && p.age > 18 ? 'CNF/S10/34' : 'WL/5')}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="list-disc list-inside pl-4 space-y-1 text-sm">
                  {(booking.seats || []).map((seatName, index) => (
                    <li key={index}>{seatName}</li>
                  ))}
                </ul>
              )}
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">Booked on: {bookingDateDisplay} (Transaction ID: {booking.transactionId || 'N/A'})</p>
          </CardContent>
          {booking.status === 'upcoming' && (
            <CardFooter className="bg-muted/30 p-6 border-t flex flex-col sm:flex-row gap-3 justify-end">
              <Button variant="outline" onClick={handleModifyPassengers}>
                <Edit3 className="mr-2 h-4 w-4" /> Modify Passengers
              </Button>
              <Button variant="default" onClick={handleDownloadTicket}>
                <Download className="mr-2 h-4 w-4" /> Download Ticket
              </Button>
              <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" onClick={handleCancelBookingTrigger}>
                    <Trash2 className="mr-2 h-4 w-4" /> Cancel Booking
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently cancel your booking.
                      Cancellation charges may apply as per railway rules.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isCancelling}>Back</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={confirmCancelBooking}
                      disabled={isCancelling}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                      {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Yes, Cancel Booking
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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

