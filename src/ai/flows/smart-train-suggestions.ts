'use server';

/**
 * @fileOverview A smart train route suggestion AI agent.
 *
 * - getSmartTrainSuggestions - A function that generates smart train route suggestions.
 * - SmartTrainSuggestionsInput - The input type for the getSmartTrainSuggestions function.
 * - SmartTrainSuggestionsOutput - The return type for the getSmartTrainSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartTrainSuggestionsInputSchema = z.object({
  userId: z.string().describe('The ID of the user.'),
  origin: z.string().describe('The origin station for the journey.'),
  destination: z.string().describe('The destination station for the journey.'),
  date: z.string().describe('The date of travel (YYYY-MM-DD).'),
  pastRoutes: z
    .array(
      z.object({
        origin: z.string(),
        destination: z.string(),
        date: z.string(),
      })
    )
    .optional()
    .describe('A list of the users past train routes taken.'),
  popularRoutes: z
    .array(
      z.object({
        origin: z.string(),
        destination: z.string(),
      })
    )
    .optional()
    .describe('A list of popular train routes.'),
});
export type SmartTrainSuggestionsInput = z.infer<typeof SmartTrainSuggestionsInputSchema>;

const SmartTrainSuggestionsOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      origin: z.string().describe('The origin station.'),
      destination: z.string().describe('The destination station.'),
      date: z.string().describe('The date of travel (YYYY-MM-DD).'),
      reason: z
        .string()
        .optional()
        .describe('The reason for this route suggestion, if any.'),
    })
  ),
});

export type SmartTrainSuggestionsOutput = z.infer<typeof SmartTrainSuggestionsOutputSchema>;

export async function getSmartTrainSuggestions(input: SmartTrainSuggestionsInput): Promise<SmartTrainSuggestionsOutput> {
  return smartTrainSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartTrainSuggestionsPrompt',
  input: {schema: SmartTrainSuggestionsInputSchema},
  output: {schema: SmartTrainSuggestionsOutputSchema},
  prompt: `You are a train travel expert, recommending routes to users based on their history and popular routes.

  The user is travelling from {{origin}} to {{destination}} on {{date}}.

  Here are the user's past routes:
  {{#if pastRoutes}}
    {{#each pastRoutes}}
      - From {{this.origin}} to {{this.destination}} on {{this.date}}
    {{/each}}
  {{else}}
    - None
  {{/if}}

  Here are some popular routes:
  {{#if popularRoutes}}
    {{#each popularRoutes}}
      - From {{this.origin}} to {{this.destination}}
    {{/each}}
  {{else}}
    - None
  {{/if}}

  Based on this information, suggest the 3 most convenient train routes for the user. Be creative, and consider edge cases not explicitly mentioned.
  Each suggestion should include a reason, if possible.
  The date should be the same as the user's travel date.
  Do not suggest any routes that start or end at stations that do not exist.
  `,
});

const smartTrainSuggestionsFlow = ai.defineFlow(
  {
    name: 'smartTrainSuggestionsFlow',
    inputSchema: SmartTrainSuggestionsInputSchema,
    outputSchema: SmartTrainSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
