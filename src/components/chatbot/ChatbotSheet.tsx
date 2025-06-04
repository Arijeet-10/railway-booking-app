
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
  SheetDescription,
} from "@/components/ui/sheet";
import { Send, Loader2, Bot } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { chatWithAssistant } from "@/ai/flows/chatbot-assistant-flow";
import { cn } from "@/lib/utils";

interface ChatbotSheetProps {
  isChatOpen: boolean;
  setIsChatOpen: (isOpen: boolean) => void;
}

export default function ChatbotSheet({ isChatOpen, setIsChatOpen }: ChatbotSheetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen && messages.length === 0) {
      // Add initial greeting message from bot when chat opens for the first time
      setMessages([
        {
          id: "initial-greeting",
          role: "bot",
          content: "Hello! I'm the Indian Rail Connect assistant. How can I help you today?",
          timestamp: new Date(),
        },
      ]);
    }
  }, [isChatOpen, messages.length]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollableViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollableViewport) {
        scrollableViewport.scrollTop = scrollableViewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    const userMessageContent = inputValue.trim();
    if (!userMessageContent) return;

    const newUserMessage: ChatMessage = {
      id: Date.now().toString() + "-user",
      role: "user",
      content: userMessageContent,
      timestamp: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await chatWithAssistant({ message: userMessageContent });
      const botMessage: ChatMessage = {
        id: Date.now().toString() + "-bot",
        role: "bot",
        content: response.reply,
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error("Error calling chatbot flow:", error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + "-error",
        role: "bot",
        content: "Sorry, I'm having trouble connecting. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
      <SheetContent className="flex flex-col p-0 sm:max-w-md">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="flex items-center">
            <Bot className="mr-2 h-6 w-6 text-primary" />
            Chat Assistant
          </SheetTitle>
          <SheetDescription>
            Ask me about Indian Rail Connect or how to use the site.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-grow p-6 pt-0" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex w-max max-w-[85%] flex-col gap-2 rounded-lg px-3 py-2 text-sm shadow-sm",
                  msg.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {msg.content}
                 <span className={cn("text-xs self-end opacity-70", msg.role === 'user' ? 'text-primary-foreground/80' : 'text-muted-foreground/80')}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center space-x-2 self-start">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Assistant is typing...</span>
              </div>
            )}
          </div>
        </ScrollArea>
        <SheetFooter className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
            <Input
              type="text"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
