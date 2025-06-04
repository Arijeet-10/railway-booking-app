
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CardContent, CardFooter } from "@/components/ui/card";
import { CalendarIcon, MapPin, Loader2, Sparkles, AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import React, { useState, useMemo, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { SmartTrainSuggestionsInput, SmartTrainSuggestionsOutput, PastRoute, PopularRoute } from '@/lib/types';
import { getSmartTrainSuggestions } from '@/ai/flows/smart-train-suggestions';
import { Alert, AlertTitle, AlertDescription as UIAlertDescription } from "@/components/ui/alert";
import { indianStations } from '@/lib/indian-stations';

const suggestionFormSchema = z.object({
  origin: z.string().min(2, { message: "Origin must be at least 2 characters." }),
  destination: z.string().min(2, { message: "Destination must be at least 2 characters." }),
  date: z.date({ required_error: "A date of travel is required." }),
});

// Mock data for demonstration purposes
const MOCK_PAST_ROUTES: PastRoute[] = [
  { origin: "New Delhi (NDLS)", destination: "Jaipur Jn (JP)", date: "2023-05-10" },
  { origin: "Mumbai Central (MMCT)", destination: "Pune Jn (PUNE)", date: "2023-08-22" },
];
const MOCK_POPULAR_ROUTES: PopularRoute[] = [
  { origin: "New Delhi (NDLS)", destination: "Mumbai Central (MMCT)" },
  { origin: "Chennai Egmore (MS)", destination: "Bengaluru Cantt (BNC)" },
  { origin: "Kolkata Howrah Jn (HWH)", destination: "Patna Jn (PNBE)" },
];

export default function SuggestionForm() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SmartTrainSuggestionsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof suggestionFormSchema>>({
    resolver: zodResolver(suggestionFormSchema),
    defaultValues: {
      origin: "",
      destination: "",
      date: new Date(),
    },
  });

  async function onSubmit(values: z.infer<typeof suggestionFormSchema>) {
    if (!user) {
      toast({ title: "Authentication Required", description: "Please log in to get smart suggestions.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuggestions(null);
    setShowOriginSuggestions(false); // Hide popovers on submit
    setShowDestinationSuggestions(false);

    const inputForAI: SmartTrainSuggestionsInput = {
      userId: user.uid,
      origin: values.origin,
      destination: values.destination,
      date: format(values.date, "yyyy-MM-dd"),
      pastRoutes: MOCK_PAST_ROUTES, 
      popularRoutes: MOCK_POPULAR_ROUTES,
    };

    try {
      const result = await getSmartTrainSuggestions(inputForAI);
      setSuggestions(result);
      if (!result.suggestions || result.suggestions.length === 0) {
        toast({ title: "No Suggestions", description: "AI couldn't find any specific suggestions for this route on Indian Railways." });
      }
    } catch (e: any) {
      console.error("Error getting smart suggestions:", e);
      setError("Failed to fetch smart suggestions. Please try again.");
      toast({ title: "Error", description: "Could not fetch suggestions for Indian Railways.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  // State for Origin Autocomplete
  const [originInputValue, setOriginInputValue] = useState(form.getValues("origin") || "");
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const originInputWrapperRef = useRef<HTMLDivElement>(null);

  const handleOriginInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setOriginInputValue(value);
    form.setValue("origin", value, { shouldValidate: true });
     if (value.trim()) {
      setShowOriginSuggestions(true);
    } else {
      setShowOriginSuggestions(false);
    }
  };
  const handleOriginSelectSuggestion = (value: string) => {
    setOriginInputValue(value);
    form.setValue("origin", value, { shouldValidate: true });
    setShowOriginSuggestions(false);
  };
  const filteredOriginStations = useMemo(() => {
    if (!originInputValue.trim()) return [];
    return indianStations.filter((station) =>
      station.toLowerCase().includes(originInputValue.toLowerCase().trim())
    ).slice(0, 10);
  }, [originInputValue]);

  // State for Destination Autocomplete
  const [destinationInputValue, setDestinationInputValue] = useState(form.getValues("destination") || "");
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const destinationInputWrapperRef = useRef<HTMLDivElement>(null);

  const handleDestinationInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setDestinationInputValue(value);
    form.setValue("destination", value, { shouldValidate: true });
    if (value.trim()) {
      setShowDestinationSuggestions(true);
    } else {
      setShowDestinationSuggestions(false);
    }
  };
  const handleDestinationSelectSuggestion = (value: string) => {
    setDestinationInputValue(value);
    form.setValue("destination", value, { shouldValidate: true });
    setShowDestinationSuggestions(false);
  };
  const filteredDestinationStations = useMemo(() => {
    if (!destinationInputValue.trim()) return [];
    return indianStations.filter((station) =>
      station.toLowerCase().includes(destinationInputValue.toLowerCase().trim())
    ).slice(0, 10);
  }, [destinationInputValue]);


  if (authLoading) {
     return <div className="flex justify-center items-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <CardContent className="pt-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="origin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground" />Origin</FormLabel>
                  <Popover open={showOriginSuggestions && filteredOriginStations.length > 0} onOpenChange={setShowOriginSuggestions}>
                    <PopoverTrigger asChild>
                      <div ref={originInputWrapperRef} className="relative">
                        <FormControl>
                          <Input
                            placeholder="e.g., New Delhi"
                            value={originInputValue}
                            onChange={handleOriginInputChange}
                            onFocus={() => {
                               if (originInputValue.trim() && filteredOriginStations.length > 0) setShowOriginSuggestions(true);
                            }}
                            onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 150)}
                            autoComplete="off"
                            aria-autocomplete="list"
                            aria-controls="origin-suggestions-smart"
                          />
                        </FormControl>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent
                      id="origin-suggestions-smart"
                      className="p-0 w-full max-h-60 overflow-y-auto"
                      style={{ width: originInputWrapperRef.current?.offsetWidth }}
                      align="start"
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      {filteredOriginStations.map((station) => (
                        <div
                          key={station}
                          className="p-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-md"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleOriginSelectSuggestion(station);
                          }}
                        >
                          {station}
                        </div>
                      ))}
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground" />Destination</FormLabel>
                  <Popover open={showDestinationSuggestions && filteredDestinationStations.length > 0} onOpenChange={setShowDestinationSuggestions}>
                     <PopoverTrigger asChild>
                        <div ref={destinationInputWrapperRef} className="relative">
                          <FormControl>
                            <Input
                              placeholder="e.g., Mumbai Central"
                              value={destinationInputValue}
                              onChange={handleDestinationInputChange}
                              onFocus={() => {
                                if (destinationInputValue.trim() && filteredDestinationStations.length > 0) setShowDestinationSuggestions(true);
                              }}
                              onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 150)}
                               autoComplete="off"
                               aria-autocomplete="list"
                               aria-controls="destination-suggestions-smart"
                            />
                          </FormControl>
                        </div>
                      </PopoverTrigger>
                    <PopoverContent
                      id="destination-suggestions-smart"
                      className="p-0 w-full max-h-60 overflow-y-auto"
                      style={{ width: destinationInputWrapperRef.current?.offsetWidth }}
                      align="start"
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      {filteredDestinationStations.map((station) => (
                        <div
                          key={station}
                          className="p-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-md"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleDestinationSelectSuggestion(station);
                          }}
                        >
                          {station}
                        </div>
                      ))}
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="flex items-center"><CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />Date of Travel</FormLabel>
                <Popover>
                   <PopoverTrigger asChild>
                      <FormControl>
                         <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                      </FormControl>
                    </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormDescription>
            We use your (mocked) past Indian Railways travel and popular routes to provide tailored suggestions.
          </FormDescription>
          <Button type="submit" className="w-full" disabled={isLoading || authLoading || !user}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {user ? (isLoading ? 'Getting Suggestions...' : 'Get Smart Suggestions') : 'Login to Get Suggestions'}
          </Button>
        </form>
      </Form>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <UIAlertDescription>{error}</UIAlertDescription>
        </Alert>
      )}

      {suggestions && suggestions.suggestions && suggestions.suggestions.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-xl font-semibold text-center">Here are your smart suggestions:</h3>
          {suggestions.suggestions.map((suggestion, index) => (
            <div key={index} className="border border-accent shadow-md rounded-lg bg-background/50">
              <div className="p-4">
                <h4 className="text-lg font-semibold flex items-center">
                  <MapPin className="mr-2 h-5 w-5 text-primary" />
                  {suggestion.origin} <ArrowRight className="mx-2 h-4 w-4 text-muted-foreground" /> {suggestion.destination}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Travel Date: {format(parseISO(suggestion.date), "PPP")}
                </p>
              </div>
              {suggestion.reason && (
                <div className="px-4 pb-3 pt-1"> {/* Adjusted padding */}
                  <p className="text-sm text-muted-foreground italic">"{suggestion.reason}"</p>
                </div>
              )}
              <CardFooter className="p-4 border-t bg-muted/30 rounded-b-lg"> {/* Added bg for footer */}
                <Button variant="outline" asChild className="w-full">
                  <a href={`/?origin=${encodeURIComponent(suggestion.origin)}&destination=${encodeURIComponent(suggestion.destination)}&date=${suggestion.date}`}>Search this route</a>
                </Button>
              </CardFooter>
            </div>
          ))}
        </div>
      )}
      {suggestions && suggestions.suggestions && suggestions.suggestions.length === 0 && !error && (
         <Alert className="mt-6">
            <Sparkles className="h-4 w-4" />
            <AlertTitle>No Specific Suggestions</AlertTitle>
            <UIAlertDescription>
              The AI couldn&apos;t find any specific alternative suggestions for this query. You can try a standard search on Indian Rail Connect.
            </UIAlertDescription>
          </Alert>
      )}
    </CardContent>
  );
}
