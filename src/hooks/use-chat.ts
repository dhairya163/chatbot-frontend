import * as React from "react"
import { v4 as uuidv4 } from 'uuid'
import Cookies from 'js-cookie'
import { toast } from "@/hooks/use-toast"

interface Message {
  id: string
  content: string
  sender: "bot" | "user"
  actions?: string[]
  deleted?: boolean
  edited?: boolean
  isEditing?: boolean
}

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

interface ChatMessage {
  message_id: string
  message: string
  type: 'user' | 'bot'
  is_deleted: boolean
  versions: string[]
}

export function useChat(currentBot: Bot | null) {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [inputValue, setInputValue] = React.useState("")
  const [editValue, setEditValue] = React.useState("")
  const [chatId, setChatId] = React.useState<string>("")
  const [messageToDelete, setMessageToDelete] = React.useState<string | null>(null)
  const [isStreaming, setIsStreaming] = React.useState(false)

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
      const formattedMessages: Message[] = data.messages.map((msg: ChatMessage) => ({
        id: msg.message_id,
        content: msg.message,
        sender: msg.type === 'user' ? 'user' : 'bot',
        deleted: msg.is_deleted,
        edited: msg.versions.length > 1,
      }))

      setMessages(formattedMessages)
    } catch (error) {
      console.error('Failed to load chat history:', error)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBot])

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement> | string) => {
    if (typeof e !== 'string') {
      e.preventDefault()
    }
    if (isStreaming || !currentBot) return
    
    const messageText = typeof e === 'string' ? e : inputValue
    if (!messageText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      sender: "user",
    }

    setMessages(prev => {
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
          } catch (error) {
            console.error('Error parsing chunk:', error)
            console.log(chunk)
          }
          botResponse += parsedChunk

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

        await loadChatHistory(chatId)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message",
      })
      console.error('Failed to send message:', error)
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
      const formattedMessages: Message[] = data.messages.map((msg: ChatMessage) => ({
        id: msg.message_id,
        content: msg.message,
        sender: msg.type === 'user' ? 'user' : 'bot',
        deleted: msg.is_deleted,
        edited: msg.versions.length > 1,
      }))

      setMessages(formattedMessages)
      setMessageToDelete(null)
    } catch (error) {
      console.error('Failed to delete message:', error)
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
      const formattedMessages: Message[] = data.messages.map((msg: ChatMessage) => ({
        id: msg.message_id,
        content: msg.message,
        sender: msg.type === 'user' ? 'user' : 'bot',
        deleted: msg.is_deleted,
        edited: msg.versions.length > 1,
      }))

      setMessages(formattedMessages)
      setEditValue("")
    } catch (error) {
      console.error('Failed to edit message:', error)
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

  return {
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
  }
} 