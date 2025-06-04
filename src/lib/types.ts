
import type { PassengerFormValues } from '@/components/bookings/passenger-form';

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
  price: number;
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

export interface Booking {
  id: string; // Document ID from Firestore, can be optional if creating
  userId: string;
  trainId: string;
  trainName: string;
  trainNumber: string;
  origin: string;
  destination: string;
  bookingDate: string; // ISO string
  travelDate: string;  // YYYY-MM-DD
  departureTime: string;
  arrivalTime: string;
  seats: string[]; // Legacy, use passengersList for names for new bookings.
  totalPrice: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  selectedClass: string;
  numPassengers: number;
  passengersList: PassengerFormValues[]; // Detailed passenger info, make it non-optional
}

export interface SavedPassenger extends PassengerFormValues {
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

    