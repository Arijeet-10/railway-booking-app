
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, MapPin, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import React, { useState, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { indianStations } from '@/lib/indian-stations';

const formSchema = z.object({
  origin: z.string().min(2, { message: "Origin must be at least 2 characters." }),
  destination: z.string().min(2, { message: "Destination must be at least 2 characters." }),
  date: z.date({ required_error: "A date of travel is required." }),
  passengers: z.number().min(1, {message: "At least one passenger required."}).optional(),
});

export default function TrainSearchForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origin: "",
      destination: "",
      date: new Date(),
      passengers: 1,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    // Hide suggestion popovers on submit
    setShowOriginSuggestions(false);
    setShowDestinationSuggestions(false);
    // In a real app, you would navigate to a search results page or fetch data
    // For now, we'll just log and show a toast
    console.log("Search values:", {
      ...values,
      date: format(values.date, "PPP"),
    });
    setTimeout(() => {
      toast({
        title: "Search Submitted (Mock)",
        description: `Searching trains from ${values.origin} to ${values.destination} on ${format(values.date, "PPP")}.`,
      });
      setIsLoading(false);
    }, 1500);
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
    ).slice(0, 10); // Limit to 10 suggestions
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
    ).slice(0, 10); // Limit to 10 suggestions
  }, [destinationInputValue]);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <FormField
          control={form.control}
          name="origin"
          render={({ field }) => ( // field is not directly used for Input value/onChange to allow local state for autocomplete
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
                        onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 150)} // Delay to allow click on suggestion
                        className="bg-background"
                        autoComplete="off"
                        aria-autocomplete="list"
                        aria-controls="origin-suggestions"
                      />
                    </FormControl>
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  id="origin-suggestions"
                  className="p-0 w-full max-h-60 overflow-y-auto"
                  style={{ width: originInputWrapperRef.current?.offsetWidth }}
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()} // Prevent focus stealing
                >
                  {filteredOriginStations.map((station) => (
                    <div
                      key={station}
                      className="p-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-md"
                      onMouseDown={(e) => { // Use onMouseDown to prevent blur before click
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
                        className="bg-background"
                        autoComplete="off"
                        aria-autocomplete="list"
                        aria-controls="destination-suggestions"
                      />
                    </FormControl>
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  id="destination-suggestions"
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
                        "w-full justify-start text-left font-normal bg-background",
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
                    onSelect={(date) => {
                        if (date) field.onChange(date);
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} // Disable past dates
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full h-10" disabled={isLoading}> {/* Adjusted self-end to items-end on parent grid and set height */}
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Search Trains
        </Button>
      </form>
    </Form>
  );
}
