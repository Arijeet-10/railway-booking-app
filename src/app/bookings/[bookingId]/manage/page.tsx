
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
import { format, parseISO, addDays } from 'date-fns';

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
    const pageWidth = doc.internal.pageSize.getWidth(); // approx 595pt for A4
    const pageHeight = doc.internal.pageSize.getHeight(); // approx 841pt for A4
    const margin = 40;
    const contentWidth = pageWidth - 2 * margin;
    let currentY = margin;

    const colors = {
      primary: [0, 123, 255],      // Blue
      secondary: [40, 167, 69],    // Green
      accent: [255, 193, 7],       // Yellow/Orange
      dark: [52, 58, 64],          // Dark gray
      light: [248, 249, 250],      // Light gray for card backgrounds if needed
      danger: [220, 53, 69],       // Red
      white: [255, 255, 255],
      text: [33, 37, 41],           // Dark text
      mutedText: [108, 117, 125]    // Muted text
    };

    const setColor = (colorArray: number[], type: 'text' | 'fill' | 'draw' = 'text') => {
      if (type === 'text') doc.setTextColor(colorArray[0], colorArray[1], colorArray[2]);
      else if (type === 'fill') doc.setFillColor(colorArray[0], colorArray[1], colorArray[2]);
      else if (type === 'draw') doc.setDrawColor(colorArray[0], colorArray[1], colorArray[2]);
    };

    // Header Block
    setColor(colors.primary, 'fill');
    doc.rect(0, 0, pageWidth, 70, 'F'); // Slightly shorter header
    setColor(colors.white, 'text');
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text("ELECTRONIC RESERVATION SLIP (ERS)", pageWidth / 2, currentY - 10, { align: 'center' });
    
    setColor(colors.white, 'fill'); // Placeholder for "WL"
    doc.roundedRect(pageWidth - margin - 50, currentY - 25, 40, 18, 3, 3, 'F');
    setColor(colors.primary, 'text');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("CNF", pageWidth - margin - 30, currentY - 12 , { align: 'center' });


    currentY += 40; // Start content below the blue header bar

    // Journey Information Block
    const journeyCardY = currentY;
    const journeyCardHeight = 110;
    setColor(colors.light, 'fill');
    doc.roundedRect(margin, journeyCardY, contentWidth, journeyCardHeight, 5, 5, 'F');
    setColor(colors.dark, 'draw');
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, journeyCardY, contentWidth, journeyCardHeight, 5, 5, 'S');

    let textY = journeyCardY + 15;
    setColor(colors.text, 'text');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text("Booked From:", margin + 10, textY);
    doc.setFont('helvetica', 'normal');
    doc.text(booking.origin.toUpperCase(), margin + 90, textY);

    textY += 20;
    doc.setFont('helvetica', 'bold');
    doc.text("Boarding At:", margin + 10, textY);
    doc.setFont('helvetica', 'normal');
    doc.text(booking.origin.toUpperCase(), margin + 90, textY); // Assuming boarding is same as origin

    textY += 20;
    doc.setFont('helvetica', 'bold');
    doc.text("To:", margin + 10, textY);
    doc.setFont('helvetica', 'normal');
    doc.text(booking.destination.toUpperCase(), margin + 90, textY);

    // Departure/Arrival Times on the right side of Journey Block
    const journeyRightX = margin + contentWidth / 2 + 20;
    textY = journeyCardY + 15;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text("Departure:", journeyRightX, textY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${format(parseISO(booking.travelDate + "T00:00:00"), "dd MMM yyyy")}, ${booking.departureTime}`, journeyRightX + 60, textY);

    textY += 20;
    doc.setFont('helvetica', 'bold');
    doc.text("Arrival:", journeyRightX, textY);
    doc.setFont('helvetica', 'normal');
    
    // Calculate arrival date
    const departureDate = parseISO(booking.travelDate + "T00:00:00");
    let arrivalDateCalc = departureDate;
    if (parseInt(booking.arrivalTime.split(':')[0]) < parseInt(booking.departureTime.split(':')[0])) {
      arrivalDateCalc = addDays(departureDate, 1);
    }
    doc.text(`${format(arrivalDateCalc, "dd MMM yyyy")}, ${booking.arrivalTime}`, journeyRightX + 60, textY);

    currentY = journeyCardY + journeyCardHeight + 15;

    // PNR / Train / Class Block
    const pnrTrainClassCardY = currentY;
    const pnrTrainClassCardHeight = 80; // Reduced height
    setColor(colors.light, 'fill');
    doc.roundedRect(margin, pnrTrainClassCardY, contentWidth, pnrTrainClassCardHeight, 5, 5, 'F');
    setColor(colors.dark, 'draw');
    doc.roundedRect(margin, pnrTrainClassCardY, contentWidth, pnrTrainClassCardHeight, 5, 5, 'S');
    
    textY = pnrTrainClassCardY + 15;
    const col1X = margin + 10;
    const col2X = margin + contentWidth / 2;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');doc.text("PNR:", col1X, textY);
    doc.setFont('helvetica', 'normal'); doc.text(booking.pnr || 'N/A', col1X + 70, textY);

    doc.setFont('helvetica', 'bold');doc.text("Train No./Name:", col2X, textY);
    doc.setFont('helvetica', 'normal'); doc.text(`${booking.trainNumber} / ${booking.trainName}`, col2X + 80, textY);

    textY += 20;
    doc.setFont('helvetica', 'bold');doc.text("Quota:", col1X, textY);
    doc.setFont('helvetica', 'normal'); doc.text(booking.quota || 'GENERAL', col1X + 70, textY);

    doc.setFont('helvetica', 'bold');doc.text("Class:", col2X, textY);
    doc.setFont('helvetica', 'normal'); doc.text(booking.selectedClass.toUpperCase(), col2X + 80, textY);
    
    textY += 20;
    doc.setFont('helvetica', 'bold');doc.text("Distance:", col1X, textY);
    doc.setFont('helvetica', 'normal'); doc.text(booking.distance || 'N/A', col1X + 70, textY);
    
    doc.setFont('helvetica', 'bold');doc.text("Booking Date:", col2X, textY);
    doc.setFont('helvetica', 'normal'); doc.text(format(parseISO(booking.bookingDate), "dd-MMM-yyyy HH:mm"), col2X + 80, textY);

    currentY = pnrTrainClassCardY + pnrTrainClassCardHeight + 15;

    // Passenger Details Table
    const passengerHeaderY = currentY;
    setColor(colors.dark, 'fill');
    doc.roundedRect(margin, passengerHeaderY, contentWidth, 25, 5, 5, 'F');
    doc.rect(margin, passengerHeaderY + 15, contentWidth, 10, 'F'); // bottom part of rounded header
    setColor(colors.white, 'text');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("PASSENGER DETAILS", margin + 10, passengerHeaderY + 16);
    currentY = passengerHeaderY + 25;

    const passengerTableStartY = currentY;
    const colWidths = [30, (contentWidth - 30) * 0.33, (contentWidth - 30) * 0.12, (contentWidth - 30) * 0.15, (contentWidth - 30) * 0.20, (contentWidth - 30) * 0.20];
    let tableHeaderX = margin;

    setColor(colors.mutedText, 'fill');
    doc.rect(margin, currentY, contentWidth, 20, 'F'); // Table header background
    setColor(colors.dark, 'text');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const headers = ["SNo", "Name", "Age", "Gender", "Booking Status", "Current Status"];
    headers.forEach((header, i) => {
      doc.text(header, tableHeaderX + 3, currentY + 13);
      tableHeaderX += colWidths[i];
    });
    currentY += 20;

    booking.passengersList.forEach((passenger, index) => {
      if (index % 2 !== 0) { // Alternate row color
         setColor(colors.light, 'fill');
         doc.rect(margin, currentY, contentWidth, 18, 'F');
      }
      let cellX = margin;
      setColor(colors.text, 'text');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');

      doc.text(`${index + 1}`, cellX + 3, currentY + 12); cellX += colWidths[0];
      doc.text(passenger.name.toUpperCase(), cellX + 3, currentY + 12); cellX += colWidths[1];
      doc.text(String(passenger.age), cellX + 3, currentY + 12); cellX += colWidths[2];
      doc.text(passenger.gender.charAt(0).toUpperCase(), cellX + 3, currentY + 12); cellX += colWidths[3];
      
      const bookingStatus = passenger.bookingStatus || (passenger.age && passenger.age > 18 ? 'CNF/S10/34' : 'WL/15');
      doc.text(bookingStatus, cellX + 3, currentY + 12); cellX += colWidths[4];
      
      const currentStatus = passenger.currentStatus || (passenger.age && passenger.age > 18 ? 'CNF/S10/34' : 'WL/5');
      doc.text(currentStatus, cellX + 3, currentY + 12);
      
      currentY += 18;
    });
    setColor(colors.dark, 'draw'); // Border for table
    doc.rect(margin, passengerTableStartY, contentWidth, currentY - passengerTableStartY, 'S');


    currentY += 15; // Space after passenger table

    // Payment Details Section
    const paymentCardY = currentY;
    const paymentCardHeight = 100; // Reduced
    setColor(colors.light, 'fill');
    doc.roundedRect(margin, paymentCardY, contentWidth, paymentCardHeight, 5, 5, 'F');
    setColor(colors.dark, 'draw');
    doc.roundedRect(margin, paymentCardY, contentWidth, paymentCardHeight, 5, 5, 'S');

    setColor(colors.secondary, 'fill');
    doc.roundedRect(margin, paymentCardY, contentWidth, 25, 5, 5, 'F');
    doc.rect(margin, paymentCardY + 15, contentWidth, 10, 'F');
    setColor(colors.white, 'text');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("PAYMENT DETAILS", margin + 10, paymentCardY + 16);
    
    textY = paymentCardY + 25 + 15;
    doc.setFontSize(9);
    const paymentItems = [
      { label: "Ticket Fare:", value: booking.ticketFare },
      { label: "IRCTC Convenience Fee (Incl. GST):", value: booking.convenienceFee },
      { label: "Total Amount:", value: booking.totalPrice, isTotal: true }
    ];

    paymentItems.forEach(item => {
      setColor(colors.text, 'text');
      doc.setFont('helvetica', item.isTotal ? 'bold' : 'normal');
      doc.text(item.label, margin + 10, textY);
      const valueText = item.value !== undefined ? `₹ ${item.value.toFixed(2)}` : 'N/A';
      doc.text(valueText, pageWidth - margin - 10, textY, { align: 'right' });
      textY += item.isTotal ? 20 : 18;
    });
    currentY = paymentCardY + paymentCardHeight + 10;

    // Transaction ID and GST details (simplified)
    setColor(colors.text, 'text');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Transaction ID: ${booking.transactionId || 'N/A'}`, margin, currentY);
    currentY += 12;
    doc.text(`Supplier GSTIN: ${booking.gstDetails?.supplierGstin || 'N/A'}`, margin, currentY);
    doc.text(`SAC Code: ${booking.gstDetails?.supplierSacCode || 'N/A'}`, margin + contentWidth / 2, currentY);
    currentY += 12;

    // Important Notes Section
    const notesHeaderY = currentY;
    setColor(colors.danger, 'fill');
    doc.roundedRect(margin, notesHeaderY, contentWidth, 20, 5, 5, 'F'); // Shorter header
    doc.rect(margin, notesHeaderY + 10, contentWidth, 10, 'F');
    setColor(colors.white, 'text');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("IMPORTANT NOTES", margin + 10, notesHeaderY + 14);
    currentY = notesHeaderY + 20 + 5;

    const notes = [
      "Carry original photo ID proof during journey. ERS/VRM/SMS with ID is mandatory.",
      "Verify departure/arrival times from Railway Station or Dial 139.",
      "This ticket is booked on personal User ID. Sale/Purchase is punishable under Railways Act.",
    ];
    setColor(colors.text, 'text');
    doc.setFontSize(7); // Smaller font for notes
    doc.setFont('helvetica', 'normal');
    notes.forEach(note => {
      if (currentY < pageHeight - margin - 30) { // Check if space left before footer
        const splitText = doc.splitTextToSize(note, contentWidth - 10); // -10 for internal padding
        doc.text(splitText, margin + 5, currentY);
        currentY += (splitText.length * 9) + 2; // 9pt line height for 7pt font
      }
    });
    
    // Footer
    currentY = pageHeight - 50; // Position footer
    setColor(colors.light, 'fill');
    doc.rect(0, currentY, pageWidth, 50, 'F');
    setColor(colors.mutedText, 'text');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text("Generated by IndianRailConnect", pageWidth / 2, currentY + 15, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, currentY + 30, { align: 'center' });
    setColor(colors.primary, 'text');
    doc.setFont('helvetica','bold');
    doc.text("Safe Journey!", pageWidth / 2, currentY + 45, { align: 'center' });

    doc.save(`IndianRailConnect-Ticket-${booking.id}.pdf`);
    toast({
      title: "Success",
      description: "Your ticket PDF has been generated!",
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
                  {/* Fallback if passengersList is somehow empty but seats exist (legacy) */}
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

    