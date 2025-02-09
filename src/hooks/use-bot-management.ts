import { useState, useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import Cookies from "js-cookie"

export interface Bot {
  id: string
  headline: string
  logo: string | null
  created_at: string
}

interface BotInfo {
  id: string
  headline: string
  starter_message: {
    message: string
    action_items: string[]
  }
  secondary_description: string | null
  logo: string | null
  created_at: string
}

interface FormData {
  headline: string
  starter_message: {
    message: string
    action_items: string[]
  }
  secondary_description: string
  logo: string
  admin_password: string
}

export const DEFAULT_LOGO = "https://cdn3d.iconscout.com/3d/premium/thumb/girl-3d-icon-download-in-png-blend-fbx-gltf-file-formats--woman-female-person-young-human-avatar-pack-people-icons-7590886.png"
export const DEFAULT_VALUES = {
  headline: "Hello, I'm your AI Assistant",
  starter_message: {
    message: "Welcome! I'm here to help answer your questions and provide assistance. How can I help you today?",
    action_items: [
      "Learn about our security measures",
      "View our pricing plans and features",
    ]
  }
}

export function useBotManagement(onBotLoad: (bot: BotInfo) => void) {
  const [bots, setBots] = useState<Bot[]>([])
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null)
  const [action, setAction] = useState<"edit" | "load" | null>(null)
  const [formData, setFormData] = useState<FormData>({
    headline: DEFAULT_VALUES.headline,
    starter_message: {
      message: DEFAULT_VALUES.starter_message.message,
      action_items: DEFAULT_VALUES.starter_message.action_items
    },
    secondary_description: "",
    logo: "",
    admin_password: "",
  })

  useEffect(() => {
    fetchBots()
  }, [])

  const fetchBots = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/bot`)
      const data = await response.json()
      setBots(data)
    } catch (error) {
      console.error("Failed to fetch bots:", error)
    }
  }

  const fetchBotInfo = async (botId: string, password: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/bot/${botId}`, {
        headers: {
          'admin-password': password
        }
      })
      if (response.status === 401) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Invalid admin password. Please try again.",
        })
        return null
      }
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch bot information. Please try again.",
        })
        return null
      }
      const data = await response.json()
      return data as BotInfo
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      })
      console.error("Failed to fetch bot information:", error)
      return null
    }
  }

  const handleCreateBot = async () => {
    try {
      const submissionData = {
        ...formData,
        logo: formData.logo || DEFAULT_LOGO
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/bot`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "admin-password": formData.admin_password
        },
        body: JSON.stringify(submissionData),
      })
      if (response.ok) {
        toast({
          title: "Success",
          description: "Bot created successfully!",
        })
        resetForm()
        fetchBots()
        return true
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create bot. Please try again.",
        })
        return false
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      })
      console.error("Failed to create bot:", error)
      return false
    }
  }

  const handleUpdateBot = async () => {
    if (!selectedBot) return false

    try {
      const submissionData = {
        headline: formData.headline,
        starter_message: formData.starter_message,
        secondary_description: formData.secondary_description || null,
        logo: formData.logo || DEFAULT_LOGO
      }

      const savedPassword = Cookies.get(`bot_${selectedBot.id}`)
      if (!savedPassword) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Authentication required. Please try again.",
        })
        return false
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/bot/${selectedBot.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "admin-password": savedPassword
        },
        body: JSON.stringify(submissionData),
      })
      if (response.ok) {
        toast({
          title: "Success",
          description: "Bot updated successfully!",
        })
        resetForm()
        fetchBots()
        return true
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update bot. Please try again.",
        })
        return false
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      })
      console.error("Failed to update bot:", error)
      return false
    }
  }

  const handleAction = async (bot: Bot, actionType: "edit" | "load") => {
    const savedPassword = Cookies.get(`bot_${bot.id}`)
    if (savedPassword) {
      const botInfo = await fetchBotInfo(bot.id, savedPassword)
      if (!botInfo) {
        setSelectedBot(bot)
        setAction(actionType)
        return { requiresPassword: true }
      }

      if (actionType === "load") {
        onBotLoad(botInfo)
        toast({
          title: "Success",
          description: "Bot loaded successfully!",
        })
      } else {
        setSelectedBot(bot)
        setFormData({
          headline: botInfo.headline,
          starter_message: botInfo.starter_message,
          secondary_description: botInfo.secondary_description || "",
          logo: botInfo.logo || "",
          admin_password: savedPassword,
        })
      }
      return { requiresPassword: false, botInfo }
    } else {
      setSelectedBot(bot)
      setAction(actionType)
      return { requiresPassword: true }
    }
  }

  const handlePasswordSubmit = async (password: string) => {
    if (!selectedBot) return false

    const botInfo = await fetchBotInfo(selectedBot.id, password)
    if (!botInfo) return false
      
    Cookies.set(`bot_${selectedBot.id}`, password, { path: "/" })

    if (action === "load") {
      onBotLoad(botInfo)
      toast({
        title: "Success",
        description: "Bot loaded successfully!",
      })
    } else if (action === "edit") {
      setFormData({
        headline: botInfo.headline,
        starter_message: botInfo.starter_message,
        secondary_description: botInfo.secondary_description || "",
        logo: botInfo.logo || "",
        admin_password: password,
      })
    }
    return true
  }

  const resetForm = () => {
    setSelectedBot(null)
    setFormData({
      headline: DEFAULT_VALUES.headline,
      starter_message: {
        message: DEFAULT_VALUES.starter_message.message,
        action_items: DEFAULT_VALUES.starter_message.action_items
      },
      secondary_description: "",
      logo: "",
      admin_password: "",
    })
  }

  return {
    bots,
    selectedBot,
    formData,
    setFormData,
    handleCreateBot,
    handleUpdateBot,
    handleAction,
    handlePasswordSubmit,
    resetForm,
  }
} 