
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";

const passengerFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(50, { message: "Name is too long." }),
  age: z.coerce.number().min(1, { message: "Age must be at least 1." }).max(120, { message: "Age seems incorrect." }),
  gender: z.enum(["male", "female", "other"], { required_error: "Please select a gender." }),
  preferredBerth: z.enum(["lower", "middle", "upper", "side_lower", "side_upper", "no_preference"], {
    required_error: "Please select a berth preference.",
  }),
});

export type PassengerFormValues = z.infer<typeof passengerFormSchema>;

interface PassengerFormProps {
  selectedClass: string;
  onAddPassenger: (passenger: PassengerFormValues) => void;
}

export default function PassengerForm({ selectedClass, onAddPassenger }: PassengerFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PassengerFormValues>({
    resolver: zodResolver(passengerFormSchema),
    defaultValues: {
      name: "",
      age: undefined,
      gender: undefined,
      preferredBerth: "no_preference",
    },
  });

  async function onSubmit(values: PassengerFormValues) {
    setIsLoading(true);
    
    // Simulate API call or processing
    await new Promise(resolve => setTimeout(resolve, 700));

    onAddPassenger(values);
    toast({
      title: "Passenger Added",
      description: `${values.name} has been added to the list.`,
    });
    form.reset({ // Reset form for next passenger, keeping selectedClass
        name: "",
        age: undefined,
        gender: undefined,
        preferredBerth: "no_preference",
    });
    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 rounded-lg border bg-card p-6 shadow-sm">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter passenger's full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Age</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="Enter Age" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} >
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormItem>
                <FormLabel>Preferred Class</FormLabel>
                <FormControl>
                    <Input value={selectedClass} disabled className="bg-muted" />
                </FormControl>
                <FormMessage />
            </FormItem>

            <FormField
            control={form.control}
            name="preferredBerth"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Preferred Berth</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Berth Preference" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="no_preference">No Preference</SelectItem>
                    <SelectItem value="lower">Lower</SelectItem>
                    <SelectItem value="middle">Middle</SelectItem>
                    <SelectItem value="upper">Upper</SelectItem>
                    <SelectItem value="side_lower">Side Lower</SelectItem>
                    <SelectItem value="side_upper">Side Upper</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Add Passenger to List
          </Button>
        </div>
      </form>
    </Form>
  );
}
