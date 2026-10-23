"use client";

import { ChatIA } from "@/components/ia/ChatIA";

export default function AssistentePage() {
  return (
    <div className="py-4">
      <ChatIA agente="assistente" titulo="Assistente Por ELAS" />
    </div>
  );
}
