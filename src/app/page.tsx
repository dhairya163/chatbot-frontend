"use client"

import { useChatStore } from "@/lib/store"

export default function Home() {
  const isOpen = useChatStore((state) => state.isOpen)

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col items-center gap-8 max-w-3xl text-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Welcome to Our AI Chat Assistant
        </h1>
        
        <p className="text-xl text-muted-foreground">
          Get instant help and support with our intelligent chatbot powered by advanced AI technology.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
          <FeatureCard 
            title="24/7 Support"
            description="Get answers to your questions anytime, anywhere with our always-available chat assistant."
          />
          <FeatureCard 
            title="Smart Responses"
            description="Powered by advanced AI to provide accurate and helpful information tailored to your needs."
          />
          <FeatureCard 
            title="Easy to Use"
            description="Simply click the chat button in the bottom right corner to start a conversation."
          />
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          <p className="text-lg font-medium">Ready to get started?</p>
            <div className="flex items-center gap-2">
              <span className={!isOpen ? "animate-bounce" : undefined}>👉</span>
              <p className="text-muted-foreground">
                Click the chat icon in the bottom right corner to start chatting
              </p>
              <span className={!isOpen ? "animate-bounce" : undefined}>👈</span>
            </div>
        </div>
      </div>
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