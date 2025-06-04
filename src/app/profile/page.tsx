import ClientAuthGuard from '@/components/ClientAuthGuard';
import ProfileForm from '@/components/profile/profile-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfilePage() {
  return (
    <ClientAuthGuard>
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-headline">Your Profile</CardTitle>
            <CardDescription>View and update your account details.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm />
          </CardContent>
        </Card>
      </div>
    </ClientAuthGuard>
  );
}
