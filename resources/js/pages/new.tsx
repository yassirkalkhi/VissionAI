"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Head, router } from "@inertiajs/react"
import axios from "axios"
import {  X, Loader2, ArrowUp, PaperclipIcon, Code } from "lucide-react"
import { createWorker } from "tesseract.js"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import AppSidebarLayout from "@/layouts/app/app-sidebar-layout"
import type { BreadcrumbItem, Conversation } from "@/types"

const breadcrumbs: BreadcrumbItem[] = [{ title: "VisionAI", href: "/chat" }]

interface Props {
  conversations?: Conversation[]
}

export default function Chat({ conversations = [] }: Props) {
  const [isCreating, setIsCreating] = useState(false)
  const [message, setMessage] = useState("")
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isExtracting, setIsExtracting] = useState<number[]>([])
  const [extractedText, setExtractedText] = useState("")
  const [textareaHeight, setTextareaHeight] = useState<number>(40)
  const [pastedCodeSnippets, setPastedCodeSnippets] = useState<{ code: string }[]>([])
  const [previewCodeIndex, setPreviewCodeIndex] = useState<number | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px"
      const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 40), 120)
      textareaRef.current.style.height = `${newHeight}px`
      setTextareaHeight(newHeight)
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [message, adjustTextareaHeight])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    return () => eventSourceRef.current?.close()
  }, [])

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return

    const newFiles = Array.from(e.target.files).slice(0, 3 - imageFiles.length)
    const updatedFiles = [...imageFiles, ...newFiles]

    setImageFiles(updatedFiles)
    setExtractedText("")

    newFiles.forEach((file, index) => {
      const reader = new FileReader()
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const result = e.target?.result
        if (result) {
          setImagePreviews((prev) => [...prev, result as string])
          const currentIndex = imageFiles.length + index
          setIsExtracting((prev) => [...prev, currentIndex])

          extractTextFromImage(file)
            .then((text) => {
              if (text) {
                setExtractedText((prev) => (prev ? prev + "\n\n" : "") + text)
              }
              setIsExtracting((prev) => prev.filter((idx) => idx !== currentIndex))
            })
            .catch(() => {
              setIsExtracting((prev) => prev.filter((idx) => idx !== currentIndex))
            })
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const extractTextFromImage = async (imageFile: File): Promise<string> => {
    try {
      const worker = await createWorker("eng")
      const imageUrl = URL.createObjectURL(imageFile)
      const result = await worker.recognize(imageUrl)
      await worker.terminate()
      return result.data.text || ""
    } catch {
      return ""
    }
  }

  const removeImage = (index: number) => {
    const updatedFiles = imageFiles.filter((_, i) => i !== index)
    setImageFiles(updatedFiles)
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
    setExtractedText("")
  }

  const isCodeSnippet = (text: string): boolean => {
    const codePatterns = [
      /function\s+\w+\s*\(/i,
      /<\?php/i,
      /namespace\s+[\w\\]+;/i,
      /class\s+\w+/i,
      /import\s+[\w\s{},*]+\s+from/i,
      /public|private|protected\s+function/i,
      /(const|let|var)\s+\w+\s*[:=]/i,
      /def\s+\w+\s*\(/i,
      /#include\s+[<"]\w+[>"]/i,
      /public\s+class\s+\w+/i,
      /SELECT\s+[\w\s*,]+\s+FROM\s+\w+/i,
      /<\w+\s+[\w\s={}]*\/>/i,
      /<\w+>[\s\S]*<\/\w+>/i,
      /\.\w+\s*\{[\s\S]*\}/i,
      /@\w+\s*\(/i,
    ]

    return (
      (text.split("\n").length > 2 ||
        (text.includes("{") && text.includes("}")) ||
        (text.includes("<") && text.includes(">"))) &&
      codePatterns.some((pattern) => pattern.test(text))
    )
  }

  const calculateSizeInKB = (text: string): number => {
    const bytes = new TextEncoder().encode(text).length
    return Math.round((bytes / 1024) * 10) / 10
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!message.trim() && !imageFiles.length && pastedCodeSnippets.length === 0) return
    setIsCreating(true)

    try {
      let uploadedImages: Array<{ path: string; url: string; name: string; contentType?: string }> = []
      if (imageFiles.length > 0) {
        const formData = new FormData()
        imageFiles.forEach((file) => formData.append("images[]", file))
        const response = await axios.post("/api/upload-images", formData)
        uploadedImages = response.data.images
      }

      let messageContent = message
      if (pastedCodeSnippets.length > 0) {
        messageContent += "\n\n" + pastedCodeSnippets.map((snippet,index) => `Attached Code Snippet ${index} \`\`\`\n${snippet.code}\n\`\`\``).join("\n\n")
      }

      const formData = new FormData()
      formData.append("message", messageContent)
      if (extractedText) {
        formData.append("extracted_text", extractedText)
      }
      uploadedImages.forEach((img) => formData.append("images[]", img.path))

      const response = await axios.post(route("conversation.create"), formData, {
        headers: {
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
          "Content-Type": "multipart/form-data",
        },
      })

      const conversationId = response.data.id

      sessionStorage.setItem("pendingMessage", message.trim() === "" ? "EMPTY_MESSAGE" : message.trim())
      if (extractedText) {
        sessionStorage.setItem("pendingExtractedText", extractedText)
      }

      if (uploadedImages.length > 0) {
        sessionStorage.setItem("pendingImages", JSON.stringify(uploadedImages))
      }

      sessionStorage.setItem("textExtracted", extractedText ? "true" : "false")

      router.visit(`/chat/${conversationId}`)
    } catch {
      setIsCreating(false)
    }
  }

  return (
    <AppSidebarLayout conversations={conversations} breadcrumbs={breadcrumbs}>
      <Head title="New Chat" />
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="text-center py-8">
                <h1 className="text-2xl font-bold mb-2">Start a New Chat</h1>
                <p className="text-muted-foreground">Ask a question or upload an image to get started</p>
              </div>
            </div>
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t bg-background">
            <div className="max-w-3xl mx-auto p-4">
              {(imagePreviews.length > 0 || pastedCodeSnippets.length > 0) && (
                <div className="mb-3 border border-border rounded-md p-2 bg-background">
                  <div className="flex overflow-x-auto pb-2 gap-2">
                    {imagePreviews.map((preview, i) => (
                      <div key={`img-${i}`} className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden">
                        <img
                          src={preview}
                          alt={`Preview ${i}`}
                          className="h-full w-full object-cover"
                        />
                        {isExtracting.includes(i) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/70 dark:bg-background/70">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-0 right-0 bg-black/70 rounded-full p-0.5"
                          title="Remove image"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ))}

                    {pastedCodeSnippets.map((snippet, index) => {
                      const sizeKB = calculateSizeInKB(snippet.code)
                      return (
                        <div
                          key={`code-${index}`}
                          className="flex-shrink-0 w-48 h-16 flex flex-col bg-muted/30 rounded-md border border-border overflow-hidden hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center justify-between bg-muted/50 px-2 py-1 border-b border-border">
                            <div className="flex items-center flex-1 gap-1">
                              <Code className="h-3 w-3 text-primary" />
                              <span className="text-xs font-medium truncate">code-snippet-{index + 1}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setPastedCodeSnippets((prev) => prev.filter((_, i) => i !== index))
                                if (previewCodeIndex === index) {
                                  setPreviewCodeIndex(null)
                                }
                              }}
                              className="text-xs text-muted-foreground hover:text-foreground ml-1"
                              title="Remove code snippet"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <div
                            className="flex-1 p-1 overflow-hidden cursor-pointer"
                            onClick={() => setPreviewCodeIndex(index)}
                          >
                            <pre className="text-xs line-clamp-2 text-muted-foreground">
                              {snippet.code.substring(0, 100)}
                            </pre>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <TooltipProvider>
                <form onSubmit={handleSubmit} className="relative">
                  <div className="relative flex-1 flex items-start rounded-lg border border-input bg-background focus-within:ring-1 focus-within:ring-ring">
                    <textarea
                      ref={textareaRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="w-full rounded-lg py-3 pl-4 pr-24 resize-none focus-visible:outline-none bg-transparent text-sm"
                      style={{ height: `${textareaHeight}px` }}
                      disabled={isExtracting.length > 0 || isCreating}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          const form = e.currentTarget.form
                          form?.requestSubmit()
                        } else if (e.key === "Enter" && e.ctrlKey) {
                          e.preventDefault()
                          setMessage(message + "\n")
                          setTimeout(adjustTextareaHeight, 0)
                        }
                      }}
                      onPaste={(e) => {
                        const clipboardData = e.clipboardData
                        const pastedText = clipboardData.getData("text")

                        if (isCodeSnippet(pastedText) && pastedCodeSnippets.length < 5) {
                          e.preventDefault()
                          setPastedCodeSnippets((prev) => [...prev, { code: pastedText }])
                        }
                      }}
                    />

                    <div className="absolute right-2 top-2 flex items-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={imageFiles.length >= 3 || isExtracting.length > 0 || isCreating}
                      >
                        <PaperclipIcon className="h-4 w-4" />
                      </Button>

                      <Button
                        type="submit"
                        size="icon"
                        className="h-8 w-8"
                        disabled={
                          isExtracting.length > 0 ||
                          isCreating ||
                          (!message.trim() && !imageFiles.length && pastedCodeSnippets.length === 0)
                        }
                      >
                        {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                      </Button>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageSelect}
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={imageFiles.length >= 3 || isExtracting.length > 0 || isCreating}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Press Enter to send, Ctrl+Enter for line break</p>
                </form>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </AppSidebarLayout>
  )
}
