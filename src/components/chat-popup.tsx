"use client"

import * as React from "react"
import { X, Send, MoreVertical, Pencil, Trash2, RefreshCcw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { v4 as uuidv4 } from 'uuid'
import Cookies from 'js-cookie'
import { toast } from "@/hooks/use-toast"

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useChatStore } from "@/lib/store"
import Image from "next/image"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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

interface Message {
  id: string
  content: string
  sender: "bot" | "user"
  actions?: string[]
  deleted?: boolean
  edited?: boolean
  isEditing?: boolean
}

export function ChatPopup() {
  const { isOpen, setIsOpen, currentBot } = useChatStore()
  const [messages, setMessages] = React.useState<Message[]>([])
  const [inputValue, setInputValue] = React.useState("")
  const [editValue, setEditValue] = React.useState("")
  const [chatId, setChatId] = React.useState<string>("")
  const [messageToDelete, setMessageToDelete] = React.useState<string | null>(null)
  const [isStreaming, setIsStreaming] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages])

  React.useEffect(() => {
    if (currentBot) {
      const savedChatId = Cookies.get(`chat_${currentBot.id}`)
      if (savedChatId) {
        setChatId(savedChatId)
        loadChatHistory(savedChatId)
      } else {
        const newChatId = uuidv4()
        setChatId(newChatId)
        Cookies.set(`chat_${currentBot.id}`, newChatId)
        setMessages([
          {
            id: "1",
            content: currentBot.starter_message.message,
            sender: "bot",
            actions: currentBot.starter_message.action_items,
          },
        ])
      }
    }
  }, [currentBot])

  const loadChatHistory = async (chatId: string) => {
    if (!currentBot) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/history?chat_id=${chatId}&bot_id=${currentBot.id}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to load chat history')
      }

      const data = await response.json()
      const formattedMessages: Message[] = data.messages.map((msg: any) => ({
        id: msg.message_id,
        content: msg.message,
        sender: msg.type === 'user' ? 'user' : 'bot',
        deleted: msg.is_deleted,
        edited: msg.versions.length > 1,
      }))

      setMessages(formattedMessages)
    } catch (error) {
      // If history load fails, show starter message
      setMessages([
        {
          id: "1",
          content: currentBot.starter_message.message,
          sender: "bot",
          actions: currentBot.starter_message.action_items,
        },
      ])
    }
  }

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement> | string) => {
    // If already streaming, don't allow new messages
    if (isStreaming) return
    
    // If e is a string, it's from an action button. Otherwise, prevent form submission
    if (typeof e !== 'string') {
      e.preventDefault()
    }
    
    const messageText = typeof e === 'string' ? e : inputValue
    if (!messageText.trim() || !currentBot) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      sender: "user",
    }

    setMessages(prev => {
      // Remove starter message if it exists
      const filteredMessages = prev.filter(msg => msg.id !== "1")
      return [...filteredMessages, userMessage]
    })
    setInputValue("")
    setIsStreaming(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/sse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          chat_id: chatId,
          bot_id: currentBot.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const reader = response.body?.getReader()
      let botResponse = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = new TextDecoder().decode(value)
          let parsedChunk = ''
          try {
            const lines = chunk.split('\n')
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = JSON.parse(line.slice(5))
                if (data.delta) {
                  parsedChunk += data.delta
                }
              }
            }
          } catch (e) {
            console.log(chunk)
          }
          botResponse += parsedChunk

          // Update the UI with the partial response
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1]
            if (lastMessage.sender === 'bot') {
              return prev.map((msg, i) => 
                i === prev.length - 1 ? { ...msg, content: botResponse } : msg
              )
            } else {
              return [...prev, { id: Date.now().toString(), content: botResponse, sender: 'bot' }]
            }
          })
        }

        // After SSE stream ends, reload chat history to sync with backend
        await loadChatHistory(chatId)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message",
      })
    } finally {
      setIsStreaming(false)
    }
  }

  const handleDeleteMessage = async (id: string) => {
    if (!currentBot) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/message`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          bot_id: currentBot.id,
          message_id: id,
          is_delete: true
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete message')
      }

      const data = await response.json()
      const formattedMessages: Message[] = data.messages.map((msg: any) => ({
        id: msg.message_id,
        content: msg.message,
        sender: msg.type === 'user' ? 'user' : 'bot',
        deleted: msg.is_deleted,
        edited: msg.versions.length > 1,
      }))

      setMessages(formattedMessages)
      setMessageToDelete(null)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete message",
      })
    }
  }

  const handleEditMessage = (id: string) => {
    const message = messages.find((msg) => msg.id === id)
    if (message) {
      setEditValue(message.content)
      setMessages(messages.map((msg) => ({
        ...msg,
        isEditing: msg.id === id
      })))
      inputRef.current?.focus()
    }
  }

  const handleSaveEdit = async (id: string) => {
    if (!currentBot) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/message`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          bot_id: currentBot.id,
          message_id: id,
          updated_value: editValue
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to edit message')
      }

      const data = await response.json()
      const formattedMessages: Message[] = data.messages.map((msg: any) => ({
        id: msg.message_id,
        content: msg.message,
        sender: msg.type === 'user' ? 'user' : 'bot',
        deleted: msg.is_deleted,
        edited: msg.versions.length > 1,
      }))

      setMessages(formattedMessages)
      setEditValue("")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to edit message",
      })
    }
  }

  const handleCancelEdit = () => {
    setMessages(messages.map((msg) => ({
      ...msg,
      isEditing: false
    })))
    setEditValue("")
  }

  const handleResetChat = () => {
    if (!currentBot) return
    
    const newChatId = uuidv4()
    setChatId(newChatId)
    Cookies.set(`chat_${currentBot.id}`, newChatId)
    
    setMessages([
      {
        id: "1",
        content: currentBot.starter_message.message,
        sender: "bot",
        actions: currentBot.starter_message.action_items,
      },
    ])
    setInputValue("")
    setEditValue("")
  }

  if (!currentBot) return null

  return (
    <>
      <Button
        size="icon"
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Image 
          src="/chat-icon.svg"
          alt="Chat icon"
          width={24}
          height={24}
        />
      </Button>

      <AlertDialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This message will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => messageToDelete && handleDeleteMessage(messageToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed right-4 bottom-20 z-50 w-[380px]"
          >
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="flex flex-row items-center gap-4 p-4">
                <Button size="icon" variant="ghost" className="absolute left-2" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-3 mx-auto">
                  <Avatar>
                    {currentBot.logo ? (
                      <AvatarImage src={currentBot.logo} />
                    ) : (
                      <AvatarFallback>
                        {currentBot.headline.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="text-lg">{currentBot.headline}</div>
                </div>
                <Button size="icon" variant="ghost" className="absolute right-2" onClick={handleResetChat}>
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </CardHeader>

              <div className="text-center text-muted-foreground px-4 pb-4">
                Ask me anything or pick a place to start
              </div>

              <CardContent className="flex-1 overflow-auto p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className="group relative">
                        <div
                          className={`rounded-lg px-4 py-2 max-w-[280px] space-y-2 ${
                            message.sender === "user" ? "bg-[#7C3AED] text-white" : "bg-[#F3F4F6]"
                          } ${message.deleted ? "italic opacity-70" : ""}`}
                        >
                          {message.isEditing ? (
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault()
                                if (editValue.trim()) {
                                  handleSaveEdit(message.id)
                                }
                              }}
                              className="flex flex-col gap-2"
                            >
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="bg-white text-black"
                                autoFocus
                                required
                                minLength={1}
                              />
                              <div className="flex gap-2">
                                <Button 
                                  type="submit" 
                                  size="sm" 
                                  variant="secondary"
                                  className="bg-white hover:bg-gray-50"
                                  disabled={!editValue.trim()}
                                >
                                  Save
                                </Button>
                                <Button 
                                  type="button"
                                  size="sm" 
                                  variant="ghost"
                                  className="text-white hover:bg-[#6B21A8]"
                                  onClick={handleCancelEdit}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <p className="whitespace-pre-line">
                                {message.deleted ? "This message was deleted" : message.content}
                              </p>
                              {message.actions && !message.deleted && (
                                <div className="flex flex-col gap-2">
                                  {message.actions.map((action) => (
                                    <Button 
                                      key={action} 
                                      variant="outline" 
                                      className="justify-start border-[#7C3AED] text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-colors"
                                      onClick={() => handleSendMessage(action)}
                                    >
                                      {action}
                                    </Button>
                                  ))}
                                </div>
                              )}
                              {message.edited && !message.deleted && (
                                <span className="text-xs opacity-70 mt-1">edited</span>
                              )}
                            </>
                          )}
                        </div>
                        {message.sender === "user" && !message.deleted && !message.isEditing && !isStreaming && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 absolute -left-7 top-1 opacity-20 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem 
                                onClick={() => handleEditMessage(message.id)}
                                className="cursor-pointer hover:bg-purple-50"
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setMessageToDelete(message.id)}
                                className="cursor-pointer text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>

              <CardFooter className="border-t p-4">
                <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
                  <Input
                    ref={inputRef}
                    placeholder={isStreaming ? "Please wait..." : "Type a message..."}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="flex-1"
                    disabled={isStreaming}
                  />
                  <Button type="submit" size="icon" disabled={isStreaming}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
} 