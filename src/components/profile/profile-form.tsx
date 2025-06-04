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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { updateProfile, sendEmailVerification } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const profileFormSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters.").max(50, "Display name too long."),
  email: z.string().email(),
});

export default function ProfileForm() {
  const { user, rawUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
      email: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || "",
        email: user.email || "",
      });
    }
  }, [user, form]);

  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    setLoading(true);
    if (!rawUser) {
      toast({ title: "Error", description: "User not found.", variant: "destructive" });
      setLoading(false);
      return;
    }

    try {
      await updateProfile(rawUser, { displayName: values.displayName });
      // To update email, Firebase requires re-authentication. This is a more complex flow.
      // For simplicity, we'll just update displayName.
      // If you want to update email, you'd use `updateEmail` function from firebase/auth.
      toast({ title: "Profile Updated", description: "Your display name has been updated." });
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const handleSendVerificationEmail = async () => {
    if (!rawUser) return;
    setVerifyingEmail(true);
    try {
      await sendEmailVerification(rawUser);
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox to verify your email address.",
      });
    } catch (error: any) {
      toast({
        title: "Error Sending Email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setVerifyingEmail(false);
    }
  };

  if (authLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return <p>Please log in to view your profile.</p>;
  }

  return (
    <div className="space-y-6">
      {!user.emailVerified && (
        <Alert variant="default" className="border-accent bg-accent/10">
          <ShieldAlert className="h-5 w-5 text-accent" />
          <AlertTitle className="text-accent">Verify Your Email</AlertTitle>
          <AlertDescription>
            Your email address is not verified. Please check your inbox or click below to resend the verification email.
            <Button 
              variant="link" 
              className="p-0 h-auto ml-1 text-accent hover:underline" 
              onClick={handleSendVerificationEmail}
              disabled={verifyingEmail}
            >
              {verifyingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Resend Verification Email
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {user.emailVerified && (
         <Alert variant="default" className="border-green-500 bg-green-500/10">
          <ShieldCheck className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-700">Email Verified</AlertTitle>
          <AlertDescription>
            Your email address has been successfully verified.
          </AlertDescription>
        </Alert>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="your@email.com" {...field} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </form>
      </Form>
    </div>
  );
}
