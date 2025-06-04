
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
    const margin = 40;
    const contentWidth = pageWidth - 2 * margin;
    let yPos = margin;

    // Define colors
    const colors = {
      primary: [0, 123, 255],      // Blue
      secondary: [40, 167, 69],    // Green
      accent: [255, 193, 7],       // Yellow/Orange
      dark: [52, 58, 64],          // Dark gray
      light: [248, 249, 250],      // Light gray
      danger: [220, 53, 69],       // Red
      white: [255, 255, 255],
      text: [33, 37, 41]           // Dark text
    };

    // Helper function to set RGB color
    const setColor = (colorArray, type = 'text') => {
      if (type === 'text') {
        doc.setTextColor(...colorArray);
      } else if (type === 'fill') {
        doc.setFillColor(...colorArray);
      } else if (type === 'draw') {
        doc.setDrawColor(...colorArray);
      }
    };

    // Header with gradient-like effect
    setColor(colors.primary, 'fill');
    doc.rect(0, 0, pageWidth, 80, 'F');

    // Add decorative elements
    setColor(colors.accent, 'fill');
    doc.rect(0, 70, pageWidth, 10, 'F');

    // Logo area (placeholder)
    setColor(colors.white, 'fill');
    doc.roundedRect(margin, 15, 120, 50, 5, 5, 'F');
    setColor(colors.primary, 'text');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("IndianRail", margin + 60, 35, { align: 'center' });
    doc.setFontSize(10);
    doc.text("Connect", margin + 60, 50, { align: 'center' });

    // Main title
    setColor(colors.white, 'text');
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text("ELECTRONIC RESERVATION SLIP", pageWidth / 2, 35, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text("(ERS)", pageWidth / 2, 50, { align: 'center' });

    // Status indicators
    setColor(colors.white, 'fill');
    doc.roundedRect(pageWidth - 150, 15, 110, 20, 3, 3, 'F');
    setColor(colors.primary, 'text');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("CONFIRMED", pageWidth - 95, 28, { align: 'center' });

    yPos = 100;

    // Journey Information Card
    setColor(colors.light, 'fill');
    doc.roundedRect(margin, yPos, contentWidth, 120, 8, 8, 'F');

    // Journey header
    setColor(colors.primary, 'fill');
    doc.roundedRect(margin, yPos, contentWidth, 35, 8, 8, 'F');
    doc.rect(margin, yPos + 27, contentWidth, 8, 'F'); // Overlap for seamless look

    setColor(colors.white, 'text');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("JOURNEY DETAILS", margin + 15, yPos + 22);

    yPos += 50;

    // Journey details with icons (using symbols)
    const journeyY = yPos;

    // From section
    setColor(colors.text, 'text');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text("FROM", margin + 15, journeyY);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(booking.origin.toUpperCase(), margin + 15, journeyY + 18);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    setColor(colors.dark, 'text');
    doc.text(`Departure: ${booking.departureTime}`, margin + 15, journeyY + 35);
    doc.text(format(parseISO(booking.travelDate + "T00:00:00"), "dd MMM yyyy"), margin + 15, journeyY + 50);

    // Arrow or connection line
    setColor(colors.primary, 'draw');
    doc.setLineWidth(2);
    doc.line(margin + contentWidth / 2 - 30, journeyY + 10, margin + contentWidth / 2 + 30, journeyY + 10);
    // Arrow head
    doc.line(margin + contentWidth / 2 + 25, journeyY + 5, margin + contentWidth / 2 + 30, journeyY + 10);
    doc.line(margin + contentWidth / 2 + 25, journeyY + 15, margin + contentWidth / 2 + 30, journeyY + 10);

    // To section
    setColor(colors.text, 'text');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text("TO", pageWidth - margin - 15, journeyY, { align: 'right' });
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(booking.destination.toUpperCase(), pageWidth - margin - 15, journeyY + 18, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    setColor(colors.dark, 'text');

    // Calculate arrival date
    const arrivalDate = new Date(parseISO(booking.travelDate + "T00:00:00"));
    if (parseInt(booking.arrivalTime.split(':')[0]) < parseInt(booking.departureTime.split(':')[0])) {
      arrivalDate.setDate(arrivalDate.getDate() + 1);
    }

    doc.text(`Arrival: ${booking.arrivalTime}`, pageWidth - margin - 15, journeyY + 35, { align: 'right' });
    doc.text(format(arrivalDate, "dd MMM yyyy"), pageWidth - margin - 15, journeyY + 50, { align: 'right' });

    yPos += 140;

    // Train and Booking Information Cards
    const cardHeight = 100;
    const cardSpacing = 15;
    const cardWidth = (contentWidth - cardSpacing) / 2;

    // Train Information Card
    setColor(colors.white, 'fill');
    doc.roundedRect(margin, yPos, cardWidth, cardHeight, 8, 8, 'F');
    setColor(colors.light, 'draw');
    doc.setLineWidth(1);
    doc.roundedRect(margin, yPos, cardWidth, cardHeight, 8, 8, 'S');

    setColor(colors.secondary, 'fill');
    doc.roundedRect(margin, yPos, cardWidth, 25, 8, 8, 'F');
    doc.rect(margin, yPos + 17, cardWidth, 8, 'F');

    setColor(colors.white, 'text');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("TRAIN INFORMATION", margin + 10, yPos + 17);

    setColor(colors.text, 'text');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("Train Number:", margin + 10, yPos + 40);
    doc.setFont('helvetica', 'bold');
    doc.text(booking.trainNumber, margin + 10, yPos + 55);

    doc.setFont('helvetica', 'normal');
    doc.text("Train Name:", margin + 10, yPos + 70);
    doc.setFont('helvetica', 'bold');
    doc.text(booking.trainName, margin + 10, yPos + 85);

    // Booking Information Card
    const bookingCardX = margin + cardWidth + cardSpacing;
    setColor(colors.white, 'fill');
    doc.roundedRect(bookingCardX, yPos, cardWidth, cardHeight, 8, 8, 'F');
    setColor(colors.light, 'draw');
    doc.setLineWidth(1);
    doc.roundedRect(bookingCardX, yPos, cardWidth, cardHeight, 8, 8, 'S');

    setColor(colors.accent, 'fill');
    doc.roundedRect(bookingCardX, yPos, cardWidth, 25, 8, 8, 'F');
    doc.rect(bookingCardX, yPos + 17, cardWidth, 8, 'F');

    setColor(colors.dark, 'text');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("BOOKING DETAILS", bookingCardX + 10, yPos + 17);

    setColor(colors.text, 'text');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`PNR: ${booking.pnr || 'N/A'}`, bookingCardX + 10, yPos + 40);
    doc.text(`Class: ${booking.selectedClass.toUpperCase()}`, bookingCardX + 10, yPos + 55);
    doc.text(`Quota: ${booking.quota || 'N/A'}`, bookingCardX + 10, yPos + 70);
    doc.text(`Distance: ${booking.distance || 'N/A'} km`, bookingCardX + 10, yPos + 85);

    yPos += cardHeight + 30;

    // Passenger Details Section
    setColor(colors.dark, 'fill');
    doc.roundedRect(margin, yPos, contentWidth, 30, 8, 8, 'F');
    doc.rect(margin, yPos + 22, contentWidth, 8, 'F');

    setColor(colors.white, 'text');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("PASSENGER DETAILS", margin + 15, yPos + 20);

    yPos += 45;

    // Passenger table with better styling
    setColor(colors.light, 'fill');
    doc.rect(margin, yPos, contentWidth, 25, 'F');

    const colWidths = [40, (contentWidth - 40) * 0.35, (contentWidth - 40) * 0.15, (contentWidth - 40) * 0.15, (contentWidth - 40) * 0.20, (contentWidth - 40) * 0.15];
    let currentX = margin;

    setColor(colors.dark, 'text');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const headers = ["S.No", "Passenger Name", "Age", "Gender", "Booking Status", "Current Status"];
    headers.forEach((header, i) => {
      doc.text(header, currentX + 5, yPos + 15);
      currentX += colWidths[i];
    });

    yPos += 25;

    // Passenger rows with alternating colors
    booking.passengersList.forEach((passenger, index) => {
      if (index % 2 === 0) {
        setColor(colors.white, 'fill');
        doc.rect(margin, yPos, contentWidth, 20, 'F');
      }

      currentX = margin;
      setColor(colors.text, 'text');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      doc.text(`${index + 1}`, currentX + 5, yPos + 12);
      currentX += colWidths[0];
      doc.text(passenger.name.toUpperCase(), currentX + 5, yPos + 12);
      currentX += colWidths[1];
      doc.text(String(passenger.age), currentX + 5, yPos + 12);
      currentX += colWidths[2];
      doc.text(passenger.gender.charAt(0).toUpperCase(), currentX + 5, yPos + 12);
      currentX += colWidths[3];

      // Status with color coding
      const bookingStatus = passenger.bookingStatus || 'N/A';
      if (bookingStatus.includes('CNF') || bookingStatus.includes('CONFIRMED')) {
        setColor(colors.secondary, 'text');
      } else if (bookingStatus.includes('WL') || bookingStatus.includes('WAITLIST')) {
        setColor(colors.accent, 'text');
      } else {
        setColor(colors.text, 'text');
      }
      doc.text(bookingStatus, currentX + 5, yPos + 12);
      currentX += colWidths[4];

      setColor(colors.text, 'text');
      doc.text(passenger.currentStatus || 'N/A', currentX + 5, yPos + 12);
      yPos += 20;
    });

    yPos += 20;

    // Payment Details Card
    setColor(colors.white, 'fill');
    doc.roundedRect(margin, yPos, contentWidth, 150, 8, 8, 'F');
    setColor(colors.light, 'draw');
    doc.setLineWidth(1);
    doc.roundedRect(margin, yPos, contentWidth, 150, 8, 8, 'S');

    setColor(colors.primary, 'fill');
    doc.roundedRect(margin, yPos, contentWidth, 30, 8, 8, 'F');
    doc.rect(margin, yPos + 22, contentWidth, 8, 'F');

    setColor(colors.white, 'text');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("PAYMENT DETAILS", margin + 15, yPos + 20);

    yPos += 45;

    // Payment items
    const paymentItems = [
      { label: "Ticket Fare", value: booking.ticketFare },
      { label: "IRCTC Convenience Fee (Incl. GST)", value: booking.convenienceFee },
      { label: "Total Amount", value: booking.totalPrice, isTotal: true }
    ];

    paymentItems.forEach((item, index) => {
      if (item.isTotal) {
        setColor(colors.primary, 'fill');
        doc.rect(margin + 10, yPos - 5, contentWidth - 20, 25, 'F');
        setColor(colors.white, 'text');
        doc.setFont('helvetica', 'bold');
      } else {
        setColor(colors.text, 'text');
        doc.setFont('helvetica', 'normal');
      }

      doc.setFontSize(10);
      doc.text(item.label, margin + 15, yPos + 10);

      const valueText = item.value ? `₹ ${item.value.toFixed(2)}` : 'N/A';
      doc.text(valueText, pageWidth - margin - 15, yPos + 10, { align: 'right' });

      yPos += item.isTotal ? 35 : 25;
    });

    yPos += 20;

    // Transaction ID
    setColor(colors.dark, 'text');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Transaction ID: ${booking.transactionId || 'N/A'}`, margin, yPos);
    doc.text(`Booking Date: ${format(parseISO(booking.bookingDate), "dd-MMM-yyyy HH:mm")}`, pageWidth - margin, yPos, { align: 'right' });

    yPos += 30;

    // Important Notes Section
    setColor(colors.danger, 'fill');
    doc.roundedRect(margin, yPos, contentWidth, 25, 8, 8, 'F');
    doc.rect(margin, yPos + 17, contentWidth, 8, 'F');

    setColor(colors.white, 'text');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("IMPORTANT NOTES", margin + 15, yPos + 17);

    yPos += 35;

    const notes = [
      "• Carry original photo ID proof during journey. SMS/VRM/ERS along with ID is mandatory.",
      "• Departure/Arrival times are subject to change. Verify from Railway Station or Dial 139.",
      "• This ticket is booked on personal User ID. Sale/Purchase is punishable under Railways Act.",
      "• IRCTC Convenience Fee is charged per e-ticket regardless of passenger count."
    ];

    setColor(colors.text, 'text');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    notes.forEach(note => {
      const splitText = doc.splitTextToSize(note, contentWidth - 20);
      doc.text(splitText, margin + 10, yPos);
      yPos += (splitText.length * 10) + 5;
    });

    // Footer
    yPos = pageHeight - 60;
    setColor(colors.light, 'fill');
    doc.rect(0, yPos, pageWidth, 60, 'F');

    setColor(colors.dark, 'text');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text("Generated by IndianRailConnect", pageWidth / 2, yPos + 20, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, yPos + 35, { align: 'center' });
    setColor(colors.primary, 'text');
    doc.text("Safe Journey!", pageWidth / 2, yPos + 50, { align: 'center' });

    // Save the PDF
    doc.save(`IndianRailConnect-Ticket-${booking.id}.pdf`);
    toast({
      title: "Success",
      description: "Your professional ticket PDF has been generated successfully!",
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
                      <br />
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
