
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
import { format, parseISO } from 'date-fns';

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

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 30;
    const contentWidth = pageWidth - 2 * margin;
    let yPos = margin;

    doc.setFont('helvetica', 'normal');

    // WL and Title
    doc.setFontSize(10);
    doc.text("WL", margin, yPos);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Electronic Reservation Slip (ERS)", pageWidth / 2, yPos, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text("Normal User", pageWidth / 2 + doc.getTextWidth("Electronic Reservation Slip (ERS)")/2 + 5 , yPos);
    doc.text("WL", pageWidth - margin - doc.getTextWidth("WL"), yPos);
    yPos += 25;

    // Booked From / Boarding At / To
    const journeyBlockYStart = yPos;
    doc.setFontSize(8);
    doc.setTextColor(100); // Gray
    doc.text("Booked from", margin, yPos);
    yPos += 12;
    doc.setFontSize(10);
    doc.setTextColor(0); // Black
    doc.text(booking.origin.toUpperCase(), margin, yPos);
    yPos += 12;
    doc.setFontSize(8);
    doc.text(`Start Date* ${format(parseISO(booking.travelDate + "T00:00:00"), "dd-MMM-yyyy")}`, margin, yPos);

    yPos = journeyBlockYStart; // Reset yPos for middle column
    const boardingAtX = margin + contentWidth / 3 + 10;
    const boardingAtWidth = contentWidth / 3 - 20;
    doc.setFillColor(66, 133, 244); // Blue background for Boarding At
    doc.rect(boardingAtX - 5, yPos - 10, boardingAtWidth + 10, 38, 'F');
    doc.setFontSize(10);
    doc.setTextColor(255); // White
    doc.setFont('helvetica', 'bold');
    doc.text("Boarding At", boardingAtX, yPos);
    yPos += 12;
    doc.setFontSize(10);
    doc.text(booking.origin.toUpperCase(), boardingAtX, yPos); // Assuming boarding at origin
    yPos += 12;
    doc.setFontSize(8);
    doc.text(`Departure* ${booking.departureTime} ${format(parseISO(booking.travelDate + "T00:00:00"), "dd-MMM-yyyy")}`, boardingAtX, yPos);

    yPos = journeyBlockYStart; // Reset yPos for right column
    const toX = margin + (contentWidth / 3) * 2 + 20;
    doc.setFontSize(8);
    doc.setTextColor(100); // Gray
    doc.text("To", toX, yPos);
    yPos += 12;
    doc.setFontSize(10);
    doc.setTextColor(0); // Black
    doc.text(booking.destination.toUpperCase(), toX, yPos);
    yPos += 12;
    doc.setFontSize(8);
    // Arrival date might be next day
    const arrivalDate = new Date(parseISO(booking.travelDate + "T00:00:00"));
    if (parseInt(booking.arrivalTime.split(':')[0]) < parseInt(booking.departureTime.split(':')[0])) {
        arrivalDate.setDate(arrivalDate.getDate() + 1);
    }
    doc.text(`Arrival* ${booking.arrivalTime} ${format(arrivalDate, "dd-MMM-yyyy")}`, toX, yPos);
    yPos += 20; // Space after journey block
    doc.setDrawColor(200);
    doc.line(margin, yPos, pageWidth - margin, yPos); // Horizontal line
    yPos += 15;

    // PNR, Train, Quota, Class, Distance, Booking Date
    const infoBlockYStart = yPos;
    function drawInfoItem(label: string, value: string, x: number, currentY: number, isValueBold = false, valueColor = 0) {
      doc.setFontSize(8); doc.setTextColor(100);
      doc.text(label, x, currentY);
      doc.setFontSize(10); doc.setTextColor(valueColor);
      doc.setFont('helvetica', isValueBold ? 'bold' : 'normal');
      doc.text(value, x, currentY + 12);
      doc.setFont('helvetica', 'normal');
    }

    drawInfoItem("PNR", booking.pnr || "N/A", margin, yPos, true, doc.getFont().fontName === 'helvetica-bold' ? 0 : 66); // Blue if bold possible
    drawInfoItem("Train No./Name", `${booking.trainNumber}/${booking.trainName}`, margin + contentWidth / 3, yPos, true, 66);
    drawInfoItem("Class", booking.selectedClass.toUpperCase(), margin + (contentWidth / 3) * 2, yPos, true, 66);
    yPos += 30;
    drawInfoItem("Quota", booking.quota || "N/A", margin, yPos);
    drawInfoItem("Distance", booking.distance || "N/A", margin + contentWidth / 3, yPos);
    drawInfoItem("Booking Date", format(parseISO(booking.bookingDate), "dd-MMM-yyyy HH:mm:ss 'HRS'"), margin + (contentWidth / 3) * 2, yPos);
    yPos += 30;
    doc.line(margin, yPos, pageWidth - margin, yPos); // Horizontal line
    yPos += 10;

    // Passenger Details
    doc.setFontSize(10); doc.setTextColor(0); doc.setFont('helvetica', 'bold');
    doc.text("Passenger Details", margin, yPos);
    yPos += 15;
    const passengerHeaderY = yPos;
    const colWidths = [25, (contentWidth - 25) * 0.35, (contentWidth - 25) * 0.15, (contentWidth - 25) * 0.15, (contentWidth - 25) * 0.20, (contentWidth - 25) * 0.15];
    let currentX = margin;

    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    ["#", "Name", "Age", "Gender", "Booking Status", "Current Status"].forEach((header, i) => {
      doc.text(header, currentX + (i === 0 ? 0 : 2) , passengerHeaderY);
      currentX += colWidths[i];
    });
    yPos += 5;
    doc.line(margin, yPos, pageWidth - margin, yPos); // Line under passenger headers
    yPos += 10;

    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    booking.passengersList.forEach((p, index) => {
      currentX = margin;
      doc.text(`${index + 1}.`, currentX, yPos); currentX += colWidths[0];
      doc.text(p.name.toUpperCase(), currentX, yPos); currentX += colWidths[1];
      doc.text(String(p.age), currentX, yPos); currentX += colWidths[2];
      doc.text(p.gender.charAt(0).toUpperCase(), currentX, yPos); currentX += colWidths[3];
      doc.text(p.bookingStatus || 'N/A', currentX, yPos); currentX += colWidths[4];
      doc.text(p.currentStatus || 'N/A', currentX, yPos);
      yPos += 15;
    });
    yPos += 5;
    // Acronyms (simplified)
    doc.setFontSize(7); doc.setTextColor(100);
    doc.text("Acronyms: RLWL: REMOTE LOCATION WAITLIST, PQWL: POOLED QUOTA WAITLIST, RSWL: ROADSIDE WAITLIST", margin, yPos, { maxWidth: contentWidth });
    yPos += 20;
    doc.line(margin, yPos, pageWidth - margin, yPos); // Horizontal line
    yPos += 10;

    // Transaction ID
    doc.setFontSize(9); doc.setTextColor(0);
    doc.text(`Transaction ID: ${booking.transactionId || 'N/A'}`, margin, yPos);
    yPos += 12;
    doc.setFontSize(8); doc.setTextColor(100);
    doc.text("IR recovers only 57% of cost of travel on an average.", margin, yPos);
    yPos += 15;

    // Payment Details
    doc.setFontSize(10); doc.setTextColor(0); doc.setFont('helvetica', 'bold');
    doc.text("Payment Details", margin, yPos);
    yPos += 15;
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    const paymentXLabel = margin;
    const paymentXValue = margin + contentWidth - 100; // For right-aligning values

    function drawPaymentItem(label: string, value: number | undefined) {
        doc.text(label, paymentXLabel, yPos);
        if (value !== undefined) {
            doc.text(`₹ ${value.toFixed(2)}`, paymentXValue, yPos, { align: 'right'});
        } else {
            doc.text("N/A", paymentXValue, yPos, { align: 'right'});
        }
        yPos += 15;
    }
    drawPaymentItem("Ticket Fare", booking.ticketFare);
    drawPaymentItem("IRCTC Convenience Fee (Incl of GST)", booking.convenienceFee);
    doc.setFont('helvetica', 'bold');
    drawPaymentItem("Total Fare (all inclusive)", booking.totalPrice);
    doc.setFont('helvetica', 'normal');
    yPos += 5;
    doc.setFontSize(8); doc.setTextColor(100);
    doc.text("PG Charges as applicable (Additional)", margin, yPos);
    yPos += 20;
    doc.line(margin, yPos, pageWidth - margin, yPos); // Horizontal line
    yPos += 10;

    // Important Notes
    doc.setFontSize(8); doc.setTextColor(0);
    const notes = [
        "IRCTC Convenience Fee is charged per e-ticket irrespective of number of passengers on the ticket.",
        "* The printed Departure and Arrival Times are liable to change. Please Check correct departure, arrival from Railway Station Enquiry or Dial 139 or SMS RAIL to 139.",
        "This ticket is booked on a personal User ID, its sale/purchase is an offence u/s 143 of the Railways Act, 1989.",
        "Prescribed original ID proof is required while travelling along with SMS/ VRM/ ERS otherwise will be treated as without ticket and penalized as per Railway Rules."
    ];
    notes.forEach(note => {
        const splitText = doc.splitTextToSize(note, contentWidth);
        doc.text(splitText, margin, yPos);
        yPos += (splitText.length * 10) + 2;
    });
    yPos += 10;
    doc.line(margin, yPos, pageWidth - margin, yPos); // Horizontal line
    yPos += 10;

    // GST Details (Simplified)
    doc.setFontSize(10); doc.setTextColor(0); doc.setFont('helvetica', 'bold');
    doc.text("Indian Railways GST Details:", margin, yPos);
    yPos += 15;
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    if (booking.gstDetails) {
        const gst = booking.gstDetails;
        doc.text(`Invoice Number: ${gst.invoiceNumber || 'N/A'}`, margin, yPos);
        doc.text(`Address: ${gst.supplierAddress || 'N/A'}`, margin + contentWidth / 2, yPos);
        yPos += 15;
        doc.text("Supplier Information:", margin, yPos); yPos += 15;
        doc.text(`SAC Code: ${gst.supplierSacCode || 'N/A'}`, margin + 10, yPos);
        doc.text(`GSTIN: ${gst.supplierGstin || 'N/A'}`, margin + contentWidth / 2, yPos);
        yPos += 15;
        // ... more GST details can be added if needed.
    } else {
        doc.text("GST Details not available.", margin, yPos);
    }
    yPos += 20;


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

  // Format travel date for display
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
                                <br/>
                                <span className="text-xs text-muted-foreground">Booking: {p.bookingStatus || 'N/A'} | Current: {p.currentStatus || 'N/A'}</span>
                            </li>
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
