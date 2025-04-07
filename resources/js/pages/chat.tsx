"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import AppSidebarLayout from "@/layouts/app/app-sidebar-layout"
import type { BreadcrumbItem } from "@/types"
import { Head, useForm } from "@inertiajs/react"
import { Image, Send, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import axios from "axios"

interface Message {
  id: string | number
  content: string
  role: "user" | "assistant"
  attachments?: Array<{
    url: string
    contentType: string
  }>
  isStreaming?: boolean
}

interface Conversation {
  id: number
  title: string
  updated_at: string
}

interface Props {
  currentConversation?: {
    id: number
    title: string
  }
  messages?: Message[]
  conversations?: Conversation[]
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Chat", href: "/chat" },
]

export default function Chat({ currentConversation, messages: initialMessages = [], conversations = [] }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const assistantMessageId = useRef<string | number>(Date.now())

  const { data, setData, reset } = useForm({
    message: "",
    images: [] as File[],
    conversation_id: currentConversation?.id || 0,
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    return () => eventSourceRef.current?.close()
  }, [])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    
    const newFiles = Array.from(e.target.files).slice(0, 3 - imageFiles.length)
    const updatedFiles = [...imageFiles, ...newFiles]
    
    setImageFiles(updatedFiles)
    setData("images", updatedFiles)

    newFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e : any) => {
        e.target?.result && setImagePreviews(prev => [...prev, e.target.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    const updatedFiles = imageFiles.filter((_, i) => i !== index)
    setImageFiles(updatedFiles)
    setData("images", updatedFiles)
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    if (!data.message.trim() && !imageFiles.length) return

    // Upload images first
    let imagePaths: string[] = []
    try {
      if (imageFiles.length > 0) {
        const formData = new FormData()
        imageFiles.forEach(file => formData.append('images[]', file))
        const response = await axios.post('/api/upload-images', formData)
        imagePaths = response.data.paths
      }
    } catch (error) {
      console.error("Image upload failed:", error)
      return
    }

    // Create a new conversation if one doesn't exist
    let conversationId = data.conversation_id
    if (!conversationId) {
      try {
        const response = await axios.post(
          route("chat.create"),
          {},
          {
            headers: {
              "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
            },
          }
        )
        conversationId = response.data.id
        window.history.pushState({}, '', `/chat/${conversationId}`)
      } catch (error) {
        console.error("Error creating conversation:", error)
        return
      }
    }

    // Create user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: data.message,
      role: "user",
      attachments: imagePreviews.map((url, i) => ({
        url,
        contentType: imageFiles[i]?.type || "image/jpeg",
      })),
    }

    // Create temporary assistant message
    const tempAssistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      content: "",
      role: "assistant",
      isStreaming: true,
    }

    assistantMessageId.current = tempAssistantMessage.id
    setMessages(prev => [...prev, userMessage, tempAssistantMessage])
    setIsLoading(true)

    try {
      // Create query params
      const params = new URLSearchParams({
        message: data.message,
        conversation_id: conversationId.toString(),
      })
      
      imagePaths.forEach(path => params.append('images[]', path))

      // Close existing connection and create new EventSource
      eventSourceRef.current?.close()
      const eventSource = new EventSource(`/chat-stream?${params.toString()}`)
      eventSourceRef.current = eventSource

      eventSource.onmessage = (event) => {
        const { content, finished } = JSON.parse(event.data)
        
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId.current ? {
            ...msg,
            content: msg.content + content,
            isStreaming: !finished
          } : msg
        ))

        if (finished) {
          eventSource.close()
          setIsLoading(false)
        }
      }

      eventSource.onerror = () => {
        eventSource.close()
        setIsLoading(false)
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId.current ? { ...msg, isStreaming: false } : msg
        ))
      }

      // Reset form
      reset("message")
      setImageFiles([])
      setImagePreviews([])
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch (error) {
      console.error("Error starting stream:", error)
      setIsLoading(false)
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          content: "Sorry, there was an error processing your request.",
          role: "assistant",
        },
      ])
    }
  }

  return (
    <AppSidebarLayout conversations={conversations} breadcrumbs={breadcrumbs}>
      <Head title="Chat" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <div className="border-sidebar-border/70 dark:border-sidebar-border relative flex-1 overflow-hidden rounded-xl border flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-"
                  }`}>
                    <div className="whitespace-pre-wrap">
                      {message.content}
                      {message.isStreaming && <span className="animate-pulse">▋</span>}
                    </div>
                    {message.attachments?.map((attachment, i) => (
                      <div key={i} className="mt-2">
                        <img
                          src={attachment.url}
                          alt={`Attachment ${i}`}
                          className="max-w-[200px] max-h-[200px] rounded-md object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t p-4 bg-background">
            <div className="max-w-3xl mx-auto">
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {imagePreviews.map((preview, i) => (
                    <div key={i} className="relative h-12 w-12 rounded-md overflow-hidden">
                      <img src={preview} alt={`Preview ${i}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-0 right-0 bg-black/70 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <TooltipProvider>
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                  <div className="relative flex-1 flex items-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="absolute left-3 h-8 w-8"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={imageFiles.length >= 3 || isLoading}
                        >
                          <Image className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {imageFiles.length >= 3 ? "Maximum 3 images" : "Attach images"}
                      </TooltipContent>
                    </Tooltip>

                    <input
                      type="text"
                      value={data.message}
                      onChange={(e) => setData("message", e.target.value)}
                      placeholder="Type a message..."
                      className="w-full rounded-lg border border-input bg-background h-10 pl-12 pr-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          const form = e.currentTarget.form
                          form?.requestSubmit()
                        }
                      }}
                    />

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageSelect}
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={imageFiles.length >= 3}
                    />
                  </div>

                  <Button
                    type="submit"
                    size="icon"
                    className="h-10 w-10"
                    disabled={isLoading || (!data.message.trim() && !imageFiles.length)}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </TooltipProvider>

              <p className="text-xs text-muted-foreground mt-2">Press Enter to send</p>
            </div>
          </div>
        </div>
      </div>
    </AppSidebarLayout>
  )
}