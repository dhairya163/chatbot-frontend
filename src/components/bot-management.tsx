import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Edit2, Play } from "lucide-react"
import { useBotManagement, DEFAULT_LOGO, DEFAULT_VALUES, Bot } from "@/hooks/use-bot-management"
import { useBotDialogs } from "@/hooks/use-bot-dialogs"

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

interface BotManagementProps {
  onBotLoad: (bot: BotInfo) => void
}

export function BotManagement({ onBotLoad }: BotManagementProps) {
  const {
    bots,
    selectedBot,
    formData,
    setFormData,
    handleCreateBot,
    handleUpdateBot,
    handleAction,
    handlePasswordSubmit,
    resetForm,
  } = useBotManagement(onBotLoad)

  const {
    isCreateOpen,
    setIsCreateOpen,
    isPasswordOpen,
    password,
    setPassword,
    action,
    setAction,
    openCreateDialog,
    closeCreateDialog,
    openPasswordDialog,
    closePasswordDialog,
  } = useBotDialogs()

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await handleCreateBot()
    if (success) {
      closeCreateDialog()
    }
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await handleUpdateBot()
    if (success) {
      closeCreateDialog()
    }
  }

  const handlePasswordFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await handlePasswordSubmit(password)
    if (success) {
      closePasswordDialog()
      if (action === "edit") {
        openCreateDialog()
      }
    }
  }

  const handleBotAction = async (bot: Bot, actionType: "edit" | "load") => {
    setAction(actionType)
    const result = await handleAction(bot, actionType)
    if (result.requiresPassword) {
      openPasswordDialog()
    } else if (actionType === "edit") {
      openCreateDialog()
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500 mb-4">
          Welcome to Our AI Chat Assistant
        </h1>
        <p className="text-lg text-muted-foreground">
          Get instant help and support with our intelligent chatbot powered by advanced AI technology.
        </p>
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b bg-muted/50 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Available Bots</h2>
            <Button 
              onClick={() => {
                resetForm()
                openCreateDialog()
              }}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
            >
              Create New Bot
            </Button>
          </div>
        </div>

        <div className="p-6">
          {bots.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-[120px] h-[120px] mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-100 to-blue-50 rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-purple-500/80"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">No Bots Available</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                Create your first bot to start engaging with your users.
                It only takes a few minutes to set up.
              </p>
              <Button 
                onClick={() => {
                  resetForm()
                  openCreateDialog()
                }} 
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
              >
                Create Your First Bot
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Created At</TableHead>
                    <TableHead className="w-[100px] font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bots.map((bot) => (
                    <TableRow key={bot.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {bot.logo && (
                            <div className="w-10 h-10 rounded-full border-2 border-purple-200 overflow-hidden">
                              <img 
                                src={bot.logo} 
                                alt={bot.headline} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <span className="font-semibold">{bot.headline}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(bot.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={async () => {
                              await handleBotAction(bot, "edit")
                            }}
                            className="hover:bg-purple-50 hover:text-purple-500 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={async () => {
                              await handleBotAction(bot, "load")
                            }}
                            className="hover:bg-blue-50 hover:text-blue-500 transition-colors"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        if (!open) {
          resetForm()
        }
        setIsCreateOpen(open)
      }}>
        <DialogContent className="max-h-[90vh] flex flex-col p-0 gap-0 max-w-xl">
          <DialogHeader className="px-4 py-2 border-b shrink-0">
            <DialogTitle>{selectedBot ? "Update your Bot" : "Create New Bot"}</DialogTitle>
            <DialogDescription className="text-sm">
              {selectedBot ? "Update the details of your chat bot." : "Fill in the details to create a new chat bot."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={selectedBot ? handleUpdateSubmit : handleCreateSubmit} className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-2 space-y-3">
                <div className="grid gap-1">
                  <label htmlFor="headline" className="text-sm font-medium">
                    Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="headline"
                    value={formData.headline}
                    onChange={(e) =>
                      setFormData({ ...formData, headline: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-1">
                  <label htmlFor="starter_message" className="text-sm font-medium">
                    Welcome Message & Actions <span className="text-destructive">*</span>
                  </label>
                  <div className="space-y-2 p-2 border rounded-lg bg-muted/50">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">
                        Message <span className="text-destructive">*</span>
                      </label>
                      <Textarea
                        id="starter_message"
                        value={formData.starter_message.message}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            starter_message: {
                              ...formData.starter_message,
                              message: e.target.value
                            }
                          })
                        }
                        placeholder="Enter the welcome message that users will see first..."
                        required
                        className="resize-none min-h-[60px]"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-muted-foreground">Quick Action Buttons (Optional)</label>
                        <p className="text-xs text-muted-foreground">Add buttons for quick responses</p>
                      </div>
                      <div className="space-y-1.5">
                        {formData.starter_message.action_items.map((item, index) => (
                          <div key={index} className="flex gap-1">
                            <Input
                              value={item}
                              onChange={(e) => {
                                const newItems = [...formData.starter_message.action_items]
                                newItems[index] = e.target.value
                                setFormData({
                                  ...formData,
                                  starter_message: {
                                    ...formData.starter_message,
                                    action_items: newItems
                                  }
                                })
                              }}
                              placeholder="e.g., 'Tell me about pricing' or 'Schedule a demo'"
                              className="text-sm"
                            />
                            <div className="flex gap-0.5 shrink-0">
                              {index === formData.starter_message.action_items.length - 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    setFormData({
                                      ...formData,
                                      starter_message: {
                                        ...formData.starter_message,
                                        action_items: [...formData.starter_message.action_items, ""]
                                      }
                                    })
                                  }
                                >
                                  +
                                </Button>
                              )}
                              {formData.starter_message.action_items.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => {
                                    const newItems = [...formData.starter_message.action_items]
                                    newItems.splice(index, 1)
                                    setFormData({
                                      ...formData,
                                      starter_message: {
                                        ...formData.starter_message,
                                        action_items: newItems
                                      }
                                    })
                                  }}
                                >
                                  -
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid gap-1">
                  <label htmlFor="secondary_description" className="text-sm font-medium">
                    Knowledge Base <span className="text-destructive">*</span>
                    <span className="block text-xs text-muted-foreground font-normal">
                      This information will be used by the bot to answer user questions
                    </span>
                  </label>
                  <Textarea
                    id="secondary_description"
                    value={formData.secondary_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        secondary_description: e.target.value,
                      })
                    }
                    className="resize-none min-h-[50px]"
                    rows={3}
                    required
                    placeholder="Describe your product, service, or use case. The bot will use this information to answer questions."
                  />
                </div>
                <div className="grid gap-1">
                  <label htmlFor="logo" className="text-sm font-medium">
                    Logo URL <span className="text-destructive">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="logo"
                      value={formData.logo}
                      onChange={(e) =>
                        setFormData({ ...formData, logo: e.target.value })
                      }
                      placeholder="https://example.com/logo.png"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0 whitespace-nowrap"
                      onClick={() =>
                        setFormData({ ...formData, logo: DEFAULT_LOGO })
                      }
                    >
                      Use Default
                    </Button>
                  </div>
                </div>
                {!selectedBot && (
                  <div className="grid gap-1">
                    <label htmlFor="admin_password" className="text-sm font-medium">
                      Admin Password <span className="text-destructive">*</span>
                    </label>
                    <div className="space-y-1">
                      <Input
                        id="admin_password"
                        type="password"
                        value={formData.admin_password}
                        onChange={(e) =>
                          setFormData({ ...formData, admin_password: e.target.value })
                        }
                        required
                        minLength={8}
                        placeholder="Enter a secure password (minimum 8 characters)"
                      />
                      <p className="text-xs text-muted-foreground">
                        Password must be at least 8 characters long. Remember this for future access to manage your bot.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="px-4 py-2 border-t mt-auto shrink-0">
              <Button type="submit">{selectedBot ? "Update Bot" : "Create Bot"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordOpen} onOpenChange={(open) => {
        if (!open) {
          closePasswordDialog()
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enter Bot Password</DialogTitle>
            <DialogDescription>
              Please enter the admin password to {action === "load" ? "run" : "edit"} this bot.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Admin Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Enter password (minimum 8 characters)"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => closePasswordDialog()}>
                Cancel
              </Button>
              <Button type="submit">Continue</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 