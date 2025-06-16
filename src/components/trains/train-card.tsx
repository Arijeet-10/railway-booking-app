import type { Train } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  MapPin, 
  TrainFront as TrainIcon, 
  ArrowRight, 
  Ticket,
  Zap,
  Star,
  Users,
  Timer,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface TrainCardProps {
  train: Train;
}

export const TrainCard = ({ train }: TrainCardProps) => {
  // Helper function to determine if it's a premium train
  const isPremiumTrain = train.trainName.toLowerCase().includes('express') || 
                        train.trainName.toLowerCase().includes('shatabdi') ||
                        train.trainName.toLowerCase().includes('rajdhani');

  // Helper function to get class color
  const getClassColor = (className: string) => {
    const lowerClass = className.toLowerCase();
    if (lowerClass.includes('ac') || lowerClass.includes('1a') || lowerClass.includes('2a')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (lowerClass.includes('3a')) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (lowerClass.includes('sl')) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Card className="group relative overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-white to-gray-50/50 hover:from-white hover:to-blue-50/30">
      {/* Premium Badge */}
      {isPremiumTrain && (
        <div className="absolute top-4 right-4 z-10">
          <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-semibold px-3 py-1 shadow-lg">
            <Star className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        </div>
      )}

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600"></div>
      <div className="absolute -top-2 -right-2 w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
      <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-to-tr from-blue-50 to-purple-50 rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>

      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold flex items-center mb-2 group-hover:text-blue-700 transition-colors duration-300">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mr-3 group-hover:from-blue-600 group-hover:to-purple-700 transition-all duration-300">
                <TrainIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold">{train.trainName}</span>
                <CardDescription className="text-sm text-gray-600 mt-1">
                  #{train.trainNumber}
                </CardDescription>
              </div>
            </CardTitle>
          </div>
          <div className="text-right">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border border-green-100">
              <p className="text-2xl font-bold text-green-700">₹{train.price.toFixed(0)}</p>
              <p className="text-xs text-green-600 font-medium">per person</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-6">
        {/* Route Information */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{train.origin}</p>
                <p className="text-xs text-gray-500">Departure</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full"></div>
              <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                <ArrowRight className="h-3 w-3 text-white" />
              </div>
              <div className="flex-1 h-0.5 bg-gradient-to-r from-purple-300 to-blue-300 rounded-full"></div>
            </div>

            <div className="flex items-center space-x-3">
              <div>
                <p className="font-semibold text-gray-900 text-sm text-right">{train.destination}</p>
                <p className="text-xs text-gray-500 text-right">Arrival</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <MapPin className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Time Information */}
        <div className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {train.departureTime} → {train.arrivalTime}
              </p>
              <p className="text-xs text-gray-600">Travel Time</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Timer className="h-4 w-4 text-orange-600" />
            <span className="font-semibold text-orange-700 text-sm">{train.duration}</span>
          </div>
        </div>

        {/* Available Classes */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Ticket className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Available Classes</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {train.availableClasses.map((className, index) => (
              <Badge
                key={index}
                variant="outline"
                className={`text-xs font-medium px-3 py-1 ${getClassColor(className)} hover:shadow-md transition-shadow duration-200`}
              >
                {className.toUpperCase()}
              </Badge>
            ))}
          </div>
        </div>

        {/* Additional Features */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>Seats Available</span>
            </div>
            {isPremiumTrain && (
              <div className="flex items-center space-x-1">
                <Zap className="h-3 w-3 text-yellow-500" />
                <span className="text-yellow-600">Express</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button 
          asChild 
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
        >
          <Link href={`/trains/${train.id}/seats?origin=${train.origin}&destination=${train.destination}&date=${new Date().toISOString().split('T')[0]}`}>
            <div className="flex items-center justify-center space-x-2">
              <Ticket className="h-5 w-5" />
              <span>Select Seats & Book</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};