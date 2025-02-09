"use client"

import * as React from "react"
import { X, Send, MoreVertical, Pencil, Trash2, RefreshCcw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useChatStore } from "@/lib/store"
import Image from "next/image"

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
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (currentBot) {
      setMessages([
        {
          id: "1",
          content: currentBot.starter_message.message,
          sender: "bot",
          actions: currentBot.starter_message.action_items,
        },
      ])
    }
  }, [currentBot])

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        content: inputValue,
        sender: "user",
      },
    ])
    setInputValue("")
  }

  const handleDeleteMessage = (id: string) => {
    setMessages(
      messages.map((msg) => (msg.id === id ? { ...msg, deleted: true, content: "This message was deleted" } : msg)),
    )
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

  const handleSaveEdit = (id: string) => {
    setMessages(messages.map((msg) => 
      msg.id === id 
        ? { ...msg, content: editValue, edited: true, isEditing: false }
        : msg
    ))
    setEditValue("")
  }

  const handleCancelEdit = () => {
    setMessages(messages.map((msg) => ({
      ...msg,
      isEditing: false
    })))
    setEditValue("")
  }

  const handleResetChat = () => {
    if (currentBot) {
      setMessages([
        {
          id: "1",
          content: currentBot.starter_message.message,
          sender: "bot",
          actions: currentBot.starter_message.action_items,
        },
      ])
    }
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
                                handleSaveEdit(message.id)
                              }}
                              className="flex flex-col gap-2"
                            >
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="bg-white text-black"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button 
                                  type="submit" 
                                  size="sm" 
                                  variant="secondary"
                                  className="bg-white hover:bg-gray-50"
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
                              <p className="whitespace-pre-line">{message.content}</p>
                              {message.actions && !message.deleted && (
                                <div className="flex flex-col gap-2">
                                  {message.actions.map((action) => (
                                    <Button 
                                      key={action} 
                                      variant="outline" 
                                      className="justify-start border-[#7C3AED] text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-colors"
                                      onClick={() => {
                                        setMessages([
                                          ...messages,
                                          {
                                            id: Date.now().toString(),
                                            content: action,
                                            sender: "user",
                                          },
                                        ])
                                      }}
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
                        {message.sender === "user" && !message.deleted && !message.isEditing && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 absolute -left-7 top-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={() => handleEditMessage(message.id)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteMessage(message.id)}
                                className="text-destructive"
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
                </div>
              </CardContent>

              <CardFooter className="border-t p-4">
                <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="Type a message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon">
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