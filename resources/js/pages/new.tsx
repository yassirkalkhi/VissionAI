"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Head } from "@inertiajs/react"
import axios from "axios"
import { MessageSquare, Image, X, Loader2, Send, PaperclipIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import AppSidebarLayout from "@/layouts/app/app-sidebar-layout"
import type { BreadcrumbItem, Conversation } from "@/types"

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Chat",
    href: "/chat",
  },
]

// Declare the route function (replace with your actual route function or import)
declare function route(name: string, params?: any): string

interface Props {
  conversations?: Conversation[]
}

export default function Chat({ conversations = [] }: Props) {
  const [isCreating, setIsCreating] = useState(false)
  const [message, setMessage] = useState("")
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return

    const newFiles = Array.from(e.target.files).slice(0, 3 - imageFiles.length)
    const updatedFiles = [...imageFiles, ...newFiles]

    setImageFiles(updatedFiles)

    newFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e: any) => {
        e.target?.result && setImagePreviews((prev) => [...prev, e.target.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    const updatedFiles = imageFiles.filter((_, i) => i !== index)
    setImageFiles(updatedFiles)
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!message.trim() && !imageFiles.length) return
    setIsCreating(true)

    try {
      // Upload images first
      let imagePaths: string[] = []
      if (imageFiles.length > 0) {
        const formData = new FormData()
        imageFiles.forEach((file) => formData.append("images[]", file))
        const response = await axios.post("/api/upload-images", formData)
        imagePaths = response.data.paths
      }

      // Create conversation with initial message
      const formData = new FormData()
      formData.append("message", message)
      imagePaths.forEach((path) => formData.append("images[]", path))

      const response = await axios.post(route("chat.create"), formData, {
        headers: {
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
        },
      })

      // Redirect to the new chat
      window.location.href = `/chat/${response.data.id}`
    } catch (error) {
      console.error("Error creating new chat:", error)
      setIsCreating(false)
    }
  }

  return (
    <AppSidebarLayout conversations={conversations} breadcrumbs={breadcrumbs}>
      <Head title="New Chat" />
      <div className="flex h-full flex-1 flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-3xl mx-auto space-y-12">
          {/* Hero section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">What can I help you with?</h1>
          </div>

          {/* Message Form */}
          <div className="w-full">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <div className="rounded-lg border border-input bg-background shadow-sm">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask me anything..."
                    className="w-full min-h-[120px] rounded-t-lg border-0 bg-transparent px-4 py-3 text-base placeholder:text-muted-foreground focus-visible:outline-none resize-none"
                  />

                  {imagePreviews.length > 0 && (
                    <div className="border-t border-border/30 p-3">
                      <div className="flex flex-wrap gap-2">
                        {imagePreviews.map((preview, i) => (
                          <div
                            key={i}
                            className="relative h-16 w-16 rounded-md overflow-hidden border border-border/50"
                          >
                            <img
                              src={preview || "/placeholder.svg"}
                              alt={`Preview ${i}`}
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5 shadow-sm"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 border-t border-border/30">
                    <div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={imagePreviews.length >= 3 || isCreating}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Image className="h-5 w-5" />
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageSelect}
                        disabled={imagePreviews.length >= 3 || isCreating}
                      />
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={(!message.trim() && !imageFiles.length) || isCreating}
                      className="rounded-full px-4"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap justify-center gap-2">
            <QuickAction icon={<MessageSquare className="h-4 w-4" />} label="New Conversation" />
            <QuickAction
              icon={<Image className="h-4 w-4" />}
              label="Upload Image"
              onClick={() => fileInputRef.current?.click()}
            />
            <QuickAction icon={<PaperclipIcon className="h-4 w-4" />} label="Attach File" />
          </div>

          {/* Examples Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Recent Conversations</h2>
              <Button variant="link" size="sm">
                View All
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ExampleCard
                title="Project Planning"
                description="Discussing timeline and resources for the new dashboard"
                date="2 hours ago"
              />
              <ExampleCard
                title="Image Analysis"
                description="Analyzing product photos for the marketing campaign"
                date="Yesterday"
              />
              <ExampleCard
                title="Code Review"
                description="Reviewing the authentication implementation"
                date="3 days ago"
              />
            </div>
          </div>
        </div>
      </div>
    </AppSidebarLayout>
  )
}

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <Button variant="outline" className="h-9 rounded-full text-xs font-normal" onClick={onClick}>
      {icon}
      <span className="ml-2">{label}</span>
    </Button>
  )
}

function ExampleCard({
  title,
  description,
  date,
}: {
  title: string
  description: string
  date: string
}) {
  return (
    <Card className="p-4 hover:bg-accent/5 transition-colors cursor-pointer">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">{title}</h3>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
        <p className="text-xs text-muted-foreground/70">{date}</p>
      </div>
    </Card>
  )
}

