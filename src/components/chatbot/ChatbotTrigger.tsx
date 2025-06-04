
"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

interface ChatbotTriggerProps {
  setIsChatOpen: Dispatch<SetStateAction<boolean>>;
}

export default function ChatbotTrigger({ setIsChatOpen }: ChatbotTriggerProps) {
  return (
    <Button
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
      size="icon"
      onClick={() => setIsChatOpen(true)}
      aria-label="Open chat assistant"
    >
      <MessageCircle size={28} />
    </Button>
  );
}
