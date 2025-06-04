
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
import { Popover, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, MapPin, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import React, { useState, useMemo } from "react";
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
    console.log("Search values:", {
      ...values,
      date: format(values.date, "PPP"),
    });
    // Hide suggestion popovers on submit
    setShowOriginSuggestions(false);
    setShowDestinationSuggestions(false);
    setTimeout(() => {
      toast({
        title: "Search Submitted",
        description: `Searching trains from ${values.origin} to ${values.destination} on ${format(values.date, "PPP")}. (Mock search)`,
      });
      setIsLoading(false);
    }, 1500);
  }

  // State for Origin Autocomplete
  const [originInputValue, setOriginInputValue] = useState(form.getValues("origin") || "");
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const originInputWrapperRef = React.useRef<HTMLDivElement>(null);

  const handleOriginInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setOriginInputValue(value);
    form.setValue("origin", value, { shouldValidate: true });
    if (value) {
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
    if (!originInputValue) return [];
    return indianStations.filter((station) =>
      station.toLowerCase().includes(originInputValue.toLowerCase())
    );
  }, [originInputValue]);

  // State for Destination Autocomplete
  const [destinationInputValue, setDestinationInputValue] = useState(form.getValues("destination") || "");
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const destinationInputWrapperRef = React.useRef<HTMLDivElement>(null);

  const handleDestinationInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setDestinationInputValue(value);
    form.setValue("destination", value, { shouldValidate: true });
    if (value) {
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
    if (!destinationInputValue) return [];
    return indianStations.filter((station) =>
      station.toLowerCase().includes(destinationInputValue.toLowerCase())
    );
  }, [destinationInputValue]);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        <FormField
          control={form.control}
          name="origin"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground" />Origin</FormLabel>
              <Popover open={showOriginSuggestions && filteredOriginStations.length > 0} onOpenChange={setShowOriginSuggestions}>
                <div ref={originInputWrapperRef} className="relative">
                  <FormControl>
                    <Input
                      placeholder="e.g., New Delhi"
                      {...field}
                      value={originInputValue}
                      onChange={handleOriginInputChange}
                      onFocus={() => {
                        if (originInputValue && filteredOriginStations.length > 0) setShowOriginSuggestions(true);
                      }}
                      onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 150)}
                      className="bg-background"
                      autoComplete="off"
                    />
                  </FormControl>
                </div>
                <PopoverContent
                  className="p-0 max-h-60 overflow-y-auto"
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
                <div ref={destinationInputWrapperRef} className="relative">
                  <FormControl>
                    <Input
                      placeholder="e.g., Mumbai Central"
                      {...field}
                      value={destinationInputValue}
                      onChange={handleDestinationInputChange}
                      onFocus={() => {
                         if (destinationInputValue && filteredDestinationStations.length > 0) setShowDestinationSuggestions(true);
                      }}
                      onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 150)}
                      className="bg-background"
                      autoComplete="off"
                    />
                  </FormControl>
                </div>
                <PopoverContent
                  className="p-0 max-h-60 overflow-y-auto"
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
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                        if (date) field.onChange(date);
                        // Manually close popover if needed, though ShadCN Calendar might handle this
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                    initialFocus
                  />
                </PopoverContent>
                <FormControl>
                  <Button
                    variant={"outline"}
                     onClick={(e) => {
                      // Toggle date picker popover
                      // This requires managing Popover open state for date picker too
                      // For simplicity, default Radix behavior is fine.
                    }}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-background",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                  </Button>
                </FormControl>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full lg:col-span-1 py-3 h-auto self-end" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Search Trains
        </Button>
      </form>
    </Form>
  );
}
