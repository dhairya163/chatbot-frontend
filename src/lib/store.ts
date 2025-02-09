import { create } from 'zustand'

interface Bot {
  id: string
  headline: string
  starter_message: {
    message: string
    action_items: string[]
  }
  secondary_description: string | null
  logo: string | null
}

interface ChatState {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  currentBot: Bot | null
  setCurrentBot: (bot: Bot | null) => void
}

export const useChatStore = create<ChatState>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
  currentBot: null,
  setCurrentBot: (currentBot) => set({ currentBot }),
})) 