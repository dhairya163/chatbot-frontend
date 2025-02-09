import { useState } from "react"

export type BotAction = "edit" | "load" | null

export function useBotDialogs() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [action, setAction] = useState<BotAction>(null)

  const openCreateDialog = () => setIsCreateOpen(true)
  const closeCreateDialog = () => setIsCreateOpen(false)
  const openPasswordDialog = () => setIsPasswordOpen(true)
  const closePasswordDialog = () => {
    setIsPasswordOpen(false)
    setPassword("")
  }

  return {
    isCreateOpen,
    setIsCreateOpen,
    isPasswordOpen,
    setIsPasswordOpen,
    password,
    setPassword,
    action,
    setAction,
    openCreateDialog,
    closeCreateDialog,
    openPasswordDialog,
    closePasswordDialog,
  }
} 