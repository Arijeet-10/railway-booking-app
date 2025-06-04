import ClientAuthGuard from '@/components/ClientAuthGuard';
import SuggestionForm from '@/components/smart-suggestions/suggestion-form';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

export default function SmartSuggestionsPage() {
  return (
    <ClientAuthGuard>
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <Lightbulb size={48} className="text-primary" />
            </div>
            <CardTitle className="text-3xl font-headline">Smart Train Suggestions</CardTitle>
            <CardDescription>
              Let our AI help you find the best routes based on your travel patterns and popular choices.
            </CardDescription>
          </CardHeader>
          {/* Form and results will be handled by SuggestionForm client component */}
          <SuggestionForm /> 
        </Card>
      </div>
    </ClientAuthGuard>
  );
}
