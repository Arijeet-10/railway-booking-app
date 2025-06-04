
import type { Train, Booking } from '@/lib/types';

// Mock data for train search results - Indian context
export const MOCK_TRAINS: Train[] = [
  { id: 'T001', trainName: 'Rajdhani Express', trainNumber: '12301', origin: 'New Delhi (NDLS)', destination: 'Mumbai Central (MMCT)', departureTime: '17:00', arrivalTime: '09:00', duration: '16h 00m', price: 2500, availableClasses: ['1A', '2A', '3A'] },
  { id: 'T002', trainName: 'Shatabdi Express', trainNumber: '12002', origin: 'Chennai Egmore (MS)', destination: 'Bengaluru Cantt (BNC)', departureTime: '06:00', arrivalTime: '11:00', duration: '5h 00m', price: 1200, availableClasses: ['SL', '2S', 'economy'] },
  { id: 'T003', trainName: 'Deccan Queen', trainNumber: '12124', origin: 'Pune Jn (PUNE)', destination: 'Chhatrapati Shivaji Maharaj Terminus (CSMT)', departureTime: '07:15', arrivalTime: '10:25', duration: '3h 10m', price: 450, availableClasses: ['economy', '2S'] },
  { id: 'T004', trainName: 'Coromandel Express', trainNumber: '12841', origin: 'Kolkata Shalimar (SHM)', destination: 'Chennai Central (MAS)', departureTime: '14:50', arrivalTime: '17:00', duration: '26h 10m', price: 1800, availableClasses: ['SL', '3A', '2A'] },
  { id: 'T005', trainName: 'Kacheguda Express', trainNumber: '12786', origin: 'KSR Bengaluru City Junction (SBC)', destination: 'Hyderabad Deccan Nampally (HYB)', departureTime: '18:20', arrivalTime: '05:40', duration: '11h 20m', price: 950, availableClasses: ['SL', '3A'] },
  { id: 'T006', trainName: 'Ashram Express', trainNumber: '12915', origin: 'Ahmedabad Jn (ADI)', destination: 'Jaipur Jn (JP)', departureTime: '19:30', arrivalTime: '05:45', duration: '10h 15m', price: 800, availableClasses: ['SL', '3A', '2A'] },
  { id: 'T007', trainName: 'Tejas Express', trainNumber: '82501', origin: 'Lucknow Charbagh NR (LKO)', destination: 'New Delhi (NDLS)', departureTime: '06:10', arrivalTime: '12:25', duration: '6h 15m', price: 1500, availableClasses: ['business', 'first', 'economy'] },
  { id: 'T008', trainName: 'North East Express', trainNumber: '12506', origin: 'Anand Vihar Terminal (ANVT)', destination: 'Kamakhya Jn (KYQ)', departureTime: '07:40', arrivalTime: '16:25', duration: '32h 45m', price: 1100, availableClasses: ['SL', '3A'] },
  { id: 'T009', trainName: 'Nagpur Pune Superfast', trainNumber: '12136', origin: 'Nagpur Jn (NGP)', destination: 'Pune Jn (PUNE)', departureTime: '18:00', arrivalTime: '09:45', duration: '15h 45m', price: 1050, availableClasses: ['SL', '3A', '2A'] },
  { id: 'T010', trainName: 'Marudhar Express', trainNumber: '14854', origin: 'Jaipur Jn (JP)', destination: 'Varanasi Jn (BSB)', departureTime: '13:45', arrivalTime: '06:15', duration: '16h 30m', price: 700, availableClasses: ['SL', '3A'] },
  { id: 'T011', trainName: 'Kalka Mail', trainNumber: '12311', origin: 'Kolkata Howrah Jn (HWH)', destination: 'Kalka (KLK)', departureTime: '19:40', arrivalTime: '04:30', duration: '32h 50m', price: 1750, availableClasses: ['SL', '3A', '2A', '1A'] },
  { id: 'T012', trainName: 'Jammu Rajdhani', trainNumber: '12425', origin: 'New Delhi (NDLS)', destination: 'Jammu Tawi (JAT)', departureTime: '20:40', arrivalTime: '05:00', duration: '8h 20m', price: 2200, availableClasses: ['1A', '2A', '3A'] },
  { id: 'T013', trainName: 'Saraighat Express', trainNumber: '12345', origin: 'Kolkata Howrah Jn (HWH)', destination: 'Guwahati (GHY)', departureTime: '15:50', arrivalTime: '09:50', duration: '18h 00m', price: 1300, availableClasses: ['SL', '3A', '2A'] },
  { id: 'T014', trainName: 'Duronto Express', trainNumber: '12273', origin: 'Kolkata Howrah Jn (HWH)', destination: 'New Delhi (NDLS)', departureTime: '08:35', arrivalTime: '06:00', duration: '21h 25m', price: 2800, availableClasses: ['1A', '2A', '3A', 'first'] },
  { id: 'T015', trainName: 'Gitanjali Express', trainNumber: '12860', origin: 'Kolkata Howrah Jn (HWH)', destination: 'Chhatrapati Shivaji Maharaj Terminus (CSMT)', departureTime: '13:50', arrivalTime: '21:20', duration: '31h 30m', price: 1900, availableClasses: ['SL', '3A', '2A'] },
];

// Mock data for bookings - Indian context
export const MOCK_BOOKINGS: Booking[] = [
  { id: 'B001', userId: 'user1', trainId: 'T001', trainName: 'Rajdhani Express', trainNumber: '12301', origin: 'New Delhi', destination: 'Mumbai Central', bookingDate: '2023-10-15T10:00:00Z', travelDate: '2024-07-20', departureTime: '17:00', arrivalTime: '09:00', seats: ['A1', 'A2'], totalPrice: 5000, status: 'upcoming' },
  { id: 'B002', userId: 'user1', trainId: 'T002', trainName: 'Shatabdi Express', trainNumber: '12002', origin: 'Chennai Egmore', destination: 'Bengaluru Cantt', bookingDate: '2023-09-01T14:30:00Z', travelDate: '2024-05-10', departureTime: '06:00', arrivalTime: '11:00', seats: ['C5'], totalPrice: 1200, status: 'completed' },
  { id: 'B003', userId: 'user1', trainId: 'T003', trainName: 'Himalayan Queen', trainNumber: '14095', origin: 'Kalka', destination: 'Shimla', bookingDate: '2024-01-05T09:15:00Z', travelDate: '2024-02-15', departureTime: '12:10', arrivalTime: '17:30', seats: ['B10'], totalPrice: 750, status: 'cancelled' },
];
