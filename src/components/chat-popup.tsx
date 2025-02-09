"use client"

import * as React from "react"
import { X, Send, MoreVertical, Pencil, Trash2, RefreshCcw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useChat } from "@/hooks/use-chat"

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


export function ChatPopup() {
  const { isOpen, setIsOpen, currentBot } = useChatStore()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const {
    messages,
    inputValue,
    setInputValue,
    editValue,
    setEditValue,
    messageToDelete,
    setMessageToDelete,
    isStreaming,
    handleSendMessage,
    handleDeleteMessage,
    handleEditMessage,
    handleSaveEdit,
    handleCancelEdit,
    handleResetChat
  } = useChat(currentBot)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages])

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
              <CardHeader className="pt-4 pb-0 px-4">
                <div className="relative flex items-start justify-center w-full">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="absolute left-0 top-0 h-8 w-8 [&_svg]:size-5" 
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>

                  <div className="flex flex-col items-center pt-2">
                    <motion.div
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Avatar className="h-16 w-16 ring-2 ring-purple-500/20 ring-offset-2">
                        {currentBot.logo ? (
                          <AvatarImage src={currentBot.logo} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                            {currentBot.headline.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </motion.div>
                    <motion.div 
                      className="text-base font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mt-2"
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      {currentBot.headline}
                    </motion.div>
                  </div>

                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="absolute right-0 top-0 h-8 w-8" 
                    onClick={handleResetChat} 
                    disabled={isStreaming}
                  >
                    <RefreshCcw className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>

              <div className="text-center text-sm text-muted-foreground px-4 pb-4">
                Ask me anything or pick a place to start
              </div>

              <CardContent className="flex-1 overflow-auto p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.sender === "bot" && (
                        <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                          {currentBot.logo ? (
                            <AvatarImage src={currentBot.logo} />
                          ) : (
                            <AvatarFallback>
                              {currentBot.headline.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      )}
                      <div className="group relative">
                        <div
                          className={`rounded-lg px-4 py-2 max-w-[280px] ${
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
                              {message.edited && !message.deleted && (
                                <span className="text-xs opacity-70 mt-1">edited</span>
                              )}
                            </>
                          )}
                        </div>
                        {message.actions && !message.deleted && (
                          <div className="flex flex-col gap-1.5 mt-2 pl-2">
                            {message.actions.map((action) => (
                              <Button 
                                key={action} 
                                variant="outline" 
                                size="sm"
                                className="justify-start rounded-full bg-white border border-purple-400 text-purple-500 hover:bg-purple-100/50 hover:border-purple-500 hover:text-purple-600 transition-all duration-200 px-3 py-1 text-xs font-medium w-fit"
                                onClick={() => handleSendMessage(action)}
                              >
                                {action}
                              </Button>
                            ))}
                          </div>
                        )}
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

              <CardFooter className="p-4 border-t bg-gradient-to-r from-purple-50 to-white">
                <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
                  <Input
                    ref={inputRef}
                    placeholder={isStreaming ? "AI is thinking..." : "Ask me anything..."}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="flex-1 rounded-full border-purple-200 focus:border-purple-400 focus:outline-none focus:ring-0 focus-visible:ring-0 transition-colors duration-200"
                    disabled={isStreaming}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={isStreaming}
                    className="rounded-full bg-purple-500 hover:bg-purple-600 transition-colors duration-200"
                  >
                    <Send className="h-4 w-4 text-white" />
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