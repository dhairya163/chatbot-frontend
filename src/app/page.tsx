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
