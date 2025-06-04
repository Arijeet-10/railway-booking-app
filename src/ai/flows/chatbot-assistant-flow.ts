
'use server';
/**
 * @fileOverview A simple chatbot assistant for Indian Rail Connect.
 * - chatWithAssistant - A function to interact with the chatbot.
 * - ChatbotAssistantInput - Input type for the chatbot.
 * - ChatbotAssistantOutput - Output type for the chatbot.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatbotAssistantInputSchema = z.object({
  message: z.string().describe("The user's message to the chatbot."),
  // Optional: conversationHistory: z.array(z.object({ role: z.enum(['user', 'bot']), content: z.string() })).optional()
});
export type ChatbotAssistantInput = z.infer<typeof ChatbotAssistantInputSchema>;

const ChatbotAssistantOutputSchema = z.object({
  reply: z.string().describe("The chatbot's reply to the user."),
});
export type ChatbotAssistantOutput = z.infer<typeof ChatbotAssistantOutputSchema>;

export async function chatWithAssistant(input: ChatbotAssistantInput): Promise<ChatbotAssistantOutput> {
  return chatbotAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatbotAssistantPrompt',
  input: {schema: ChatbotAssistantInputSchema},
  output: {schema: ChatbotAssistantOutputSchema},
  prompt: `You are a friendly and helpful AI assistant for "Indian Rail Connect", a website designed for searching, viewing, and booking train tickets in India.
Your current capabilities are to provide general information, answer simple questions about using the website, and guide users.
You cannot yet perform actions like searching for trains, checking PNR status, or making bookings directly through this chat. For those actions, please guide the user to the relevant sections of the website.

User's message: "{{message}}"

Respond politely and concisely. If the user asks for something beyond your current capabilities, explain your limitations and direct them to the appropriate website features.
Example: If asked to book a ticket, you might say: "I can't book tickets directly through this chat yet. You can search for trains and book them by using the 'Search Trains' feature on the homepage."
Keep your responses to a few sentences.
  `,
});

const chatbotAssistantFlow = ai.defineFlow(
  {
    name: 'chatbotAssistantFlow',
    inputSchema: ChatbotAssistantInputSchema,
    outputSchema: ChatbotAssistantOutputSchema,
  },
  async input => {
    // In a more advanced version, you might add conversation history to the prompt input.
    const {output} = await prompt(input);
    return output!;
  }
);

