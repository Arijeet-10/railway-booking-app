"use client";

import ClientAuthGuard from '@/components/ClientAuthGuard';
import ProfileForm from '@/components/profile/profile-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { User, Users, Shield, Bell, Trash2, Edit, PlusCircle, XCircle } from 'lucide-react';
import type { SavedPassenger } from '@/lib/types';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import PassengerForm, { type PassengerFormValues } from '@/components/bookings/passenger-form'; // Re-using for consistency

// --- NEW COMPONENT: Saved Passenger Management ---

const SavedPassengerManager = () => {
    const { toast } = useToast();
    // Mocking state that would come from a backend (e.g., Firestore)
    const [savedPassengers, setSavedPassengers] = useState<SavedPassenger[]>([
        { id: 'saved1', name: 'Aditya Sharma', age: 30, gender: 'male', preferredBerth: 'lower', isSenior: false },
        { id: 'saved2', name: 'Priya Singh', age: 28, gender: 'female', preferredBerth: 'side_lower', isSenior: false },
        { id: 'saved4', name: 'Geeta Devi', age: 62, gender: 'female', preferredBerth: 'lower', isSenior: true },
    ]);
    const [editingPassenger, setEditingPassenger] = useState<SavedPassenger | null>(null);

    const handleAddOrUpdatePassenger = (passengerData: PassengerFormValues) => {
        if (editingPassenger) {
            // Update logic
            setSavedPassengers(prev => prev.map(p => p.id === editingPassenger.id ? { ...p, ...passengerData } : p));
            toast({ title: "Passenger Updated", description: `${passengerData.name}'s details have been updated.` });
            setEditingPassenger(null);
        } else {
            // Add logic
            const newPassenger: SavedPassenger = { ...passengerData, id: `saved-${Date.now()}` };
            setSavedPassengers(prev => [...prev, newPassenger]);
            toast({ title: "Passenger Added", description: `${passengerData.name} has been saved for faster bookings.` });
        }
    };

    const handleDeletePassenger = (id: string) => {
        setSavedPassengers(prev => prev.filter(p => p.id !== id));
        toast({ title: "Passenger Removed", variant: "destructive" });
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>{editingPassenger ? 'Edit Passenger' : 'Add a New Passenger'}</CardTitle>
                    <CardDescription>Save passenger details to pre-fill them during booking.</CardDescription>
                </CardHeader>
                <CardContent>
                    <PassengerForm
                        onAddPassenger={handleAddOrUpdatePassenger}
                        initialData={editingPassenger}
                        isProfileContext={true} // Prop to change button text etc.
                        key={editingPassenger?.id || 'new'}
                    />
                    {editingPassenger && (
                        <Button variant="ghost" className="mt-4" onClick={() => setEditingPassenger(null)}>
                            <XCircle className="mr-2 h-4 w-4" /> Cancel Edit
                        </Button>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Your Saved Passengers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {savedPassengers.length > 0 ? (
                        savedPassengers.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                <div className="flex items-center space-x-3">
                                    <Avatar><AvatarFallback>{p.name.charAt(0)}</AvatarFallback></Avatar>
                                    <div>
                                        <p className="font-semibold">{p.name}</p>
                                        <p className="text-sm text-muted-foreground">{p.age} yrs, {p.gender}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <Button variant="ghost" size="icon" onClick={() => setEditingPassenger(p)}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeletePassenger(p.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground p-4 text-center">No saved passengers yet. Add one using the form above.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

// --- NEW COMPONENT: Security Tab Content ---
const SecurityTab = () => (
    <Card>
        <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage your password and account security.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg">
                    <div>
                        <h4 className="font-semibold">Change Password</h4>
                        <p className="text-sm text-muted-foreground">It's a good idea to use a strong password that you're not using elsewhere.</p>
                    </div>
                    <Button className="mt-2 sm:mt-0">Change Password</Button>
                </div>
                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg">
                    <div>
                        <h4 className="font-semibold">Two-Factor Authentication</h4>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
                    </div>
                    <Button variant="secondary" className="mt-2 sm:mt-0">Enable 2FA</Button>
                </div>
            </div>
        </CardContent>
    </Card>
);

// --- MAIN PROFILE PAGE ---
export default function ProfilePage() {
    const { user, loading } = useAuth();
    
    if (loading) return <div className="text-center py-20">Loading profile...</div>;

    const getInitials = (name: string | null | undefined) => {
        if (!name) return 'U';
        const names = name.split(' ');
        if (names.length > 1) {
            return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
        }
        return name.charAt(0).toUpperCase();
    };

    return (
        <ClientAuthGuard>
            <div className="bg-gradient-to-b from-slate-50 to-white min-h-[calc(100vh-64px)]">
                <div className="container mx-auto px-4 py-8 space-y-8">
                    {/* --- Profile Header --- */}
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16 text-xl">
                            <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-bold">{user?.displayName || 'Welcome!'}</h1>
                            <p className="text-muted-foreground">{user?.email}</p>
                        </div>
                    </div>

                    {/* --- Tabs --- */}
                    <Tabs defaultValue="profile" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                            <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" />Profile</TabsTrigger>
                            <TabsTrigger value="passengers"><Users className="mr-2 h-4 w-4" />Saved Passengers</TabsTrigger>
                            <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" />Security</TabsTrigger>
                            <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" />Preferences</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="profile" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Personal Information</CardTitle>
                                    <CardDescription>View and update your account details.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ProfileForm />
                                </CardContent>
                            </Card>
                        </TabsContent>
                        
                        <TabsContent value="passengers" className="mt-6">
                            <SavedPassengerManager />
                        </TabsContent>

                        <TabsContent value="security" className="mt-6">
                           <SecurityTab />
                        </TabsContent>

                        <TabsContent value="notifications" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notification Preferences</CardTitle>
                                    <CardDescription>Manage how you receive updates from us.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Alert>
                                        <Bell className="h-4 w-4" />
                                        <AlertTitle>Feature Coming Soon!</AlertTitle>
                                        <AlertDescription>
                                            We're working on adding customizable notifications for bookings, promotions, and more.
                                        </AlertDescription>
                                    </Alert>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </ClientAuthGuard>
    );
}