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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, MapPin, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
      date: format(values.date, "PPP"), // Pretty print date for logging
    });
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Search Submitted",
        description: `Searching trains from ${values.origin} to ${values.destination} on ${format(values.date, "PPP")}.`,
      });
      // Here you would typically navigate to a search results page or update state
      // For now, we just log and show a toast. The main page already displays mock results.
      setIsLoading(false);
    }, 1500);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <FormField
          control={form.control}
          name="origin"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground" />Origin</FormLabel>
              <FormControl>
                <Input placeholder="e.g., New York" {...field} className="bg-background" />
              </FormControl>
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
              <FormControl>
                <Input placeholder="e.g., Washington D.C." {...field} className="bg-background" />
              </FormControl>
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
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} // Disable past dates
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* <FormField
          control={form.control}
          name="passengers"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Users className="mr-2 h-4 w-4 text-muted-foreground" />Passengers</FormLabel>
              <FormControl>
                <Input type="number" min="1" placeholder="1" {...field} 
                  onChange={event => field.onChange(+event.target.value)} // Ensure value is number
                  className="bg-background" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        /> */}
        <Button type="submit" className="w-full lg:col-span-1 py-3 h-auto" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Search Trains
        </Button>
      </form>
    </Form>
  );
}
