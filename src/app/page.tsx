"use client"

import { BotManagement } from "@/components/bot-management"
import { useChatStore } from "@/lib/store"

export default function Home() {
  const setIsOpen = useChatStore((state) => state.setIsOpen)
  const setCurrentBot = useChatStore((state) => state.setCurrentBot)

  return (
    <main className="flex min-h-screen flex-col items-center p-12">
      <BotManagement 
        onBotLoad={(bot) => {
          setCurrentBot(bot)
          setIsOpen(true)
        }} 
      />
    </main>
  )
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}