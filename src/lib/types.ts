
import type { PassengerFormValues as OriginalPassengerFormValues } from '@/components/bookings/passenger-form';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  emailVerified?: boolean;
}

export interface Train {
  id: string;
  trainName: string;
  trainNumber: string;
  origin: string;
  destination:string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number; // Base price, consider if this is per passenger or total before taxes
  availableClasses: Array<'economy' | 'business' | 'first' | '1A' | '2A' | '3A' | 'SL' | '2S'>;
}

export interface TrainDetailed extends Train {
  // Specific fields for the detailed view if different from basic Train
  // For now, it's the same as Train but can be extended
}


export interface Seat {
  id: string;
  coach: string;
  status: 'available' | 'booked' | 'selected' | 'unavailable';
  type?: 'window' | 'aisle' | 'middle';
  number: string; // e.g. "1A", "12C"
}

// Extend PassengerFormValues for PDF
export interface PassengerFormValues extends OriginalPassengerFormValues {
  bookingStatus?: string; // e.g., "CNF", "WL/10"
  currentStatus?: string; // e.g., "CNF", "WL/2"
  // seatNumber?: string; // e.g. "S10, 34" // This might be better stored at booking level if seats are confirmed
}

export interface GstDetails {
  invoiceNumber?: string;
  supplierSacCode?: string;
  supplierGstin?: string;
  supplierAddress?: string;
  recipientGstin?: string;
  recipientName?: string;
  recipientAddress?: string;
  taxableValue?: number;
  cgstRate?: string; // e.g. "2.5%"
  cgstAmount?: number;
  sgstUtgstRate?: string; // e.g. "2.5%" or "NA"
  sgstUtgstAmount?: number;
  igstRate?: string; // e.g. "5.0%" or "NA"
  igstAmount?: number;
}

export interface Booking {
  id: string; // Document ID from Firestore, can be optional if creating
  userId: string;
  trainId: string;
  trainName: string;
  trainNumber: string;
  origin: string; // e.g. AHMEDABAD JN (ADI)
  destination: string; // e.g. KASGANJ (KSJ)
  bookingDate: string; // ISO string, e.g. "2023-08-26T13:49:25Z"
  travelDate: string;  // YYYY-MM-DD, e.g. "2023-08-28"
  departureTime: string; // HH:MM
  arrivalTime: string; // HH:MM
  seats: string[]; // Legacy, use passengersList for names for new bookings.
  totalPrice: number; // Final total price paid
  status: 'upcoming' | 'completed' | 'cancelled';
  selectedClass: string; // e.g. "SLEEPER CLASS (SL)" or just "SL"
  numPassengers: number;
  passengersList: PassengerFormValues[]; // Detailed passenger info

  // New fields based on the provided PDF design
  pnr?: string; // e.g. "8607428810"
  quota?: string; // e.g. "GENERAL (GN)"
  distance?: string; // e.g. "980 KM"
  transactionId?: string; // e.g. "100004399916431"
  ticketFare?: number; // Base fare before fees
  convenienceFee?: number; // IRCTC Fee
  // Booking status and current status for passengers are inside passengersList

  gstDetails?: GstDetails;
}

export interface SavedPassenger extends OriginalPassengerFormValues { // Use original non-extended passenger form values
  id: string; // A unique ID for the saved passenger
}

export interface SmartSuggestionInputParams {
    origin: string;
    destination: string;
    date: string; // YYYY-MM-DD
}

export type PastRoute = {
  origin: string;
  destination: string;
  date: string; // YYYY-MM-DD
};

export type PopularRoute = {
  origin: string;
  destination: string;
};

// AI Flow specific types (already defined in smart-train-suggestions.ts, re-exporting or aligning for consistency)
export type { SmartTrainSuggestionsInput, SmartTrainSuggestionsOutput } from '@/ai/flows/smart-train-suggestions';

// Chatbot Message Type
export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}
