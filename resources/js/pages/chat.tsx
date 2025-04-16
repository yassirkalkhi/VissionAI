"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import AppSidebarLayout from "@/layouts/app/app-sidebar-layout"
import type { BreadcrumbItem, SharedData } from "@/types"
import { Head, useForm, usePage } from "@inertiajs/react"
import { X, Loader2, FileText, Copy, Check, PaperclipIcon, ArrowUp, Square, RefreshCw, Code } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import ReactMarkdown from "react-markdown"
import axios from "axios"
import { createWorker } from "tesseract.js"
import { cn } from "@/lib/utils"

interface Message {
  id: string | number
  content: string
  role: "user" | "assistant"
  attachments?: Array<{
    url: string
    contentType: string
  }>
  isStreaming?: boolean
  isThinking?: boolean
  extractedText?: string
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

const breadcrumbs: BreadcrumbItem[] = [{ title: "", href: "/chat" }]

const animationStyles = `
@keyframes pulse {
  0% { opacity: 0.4; }
  50% { opacity: 0.8; }
  100% { opacity: 0.4; }
}

.thinking-pulse {
  animation: pulse 1.5s ease-in-out infinite;
}

.markdown-content p {
  margin-bottom: 1em;
}

.markdown-content h1, 
.markdown-content h2, 
.markdown-content h3, 
.markdown-content h4 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.markdown-content ul, 
.markdown-content ol {
  margin-left: 1.5em;
  margin-bottom: 1em;
}

.markdown-content li {
  margin-bottom: 0.5em;
}

.markdown-content pre {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 1em;
  border-radius: 0.5em;
  overflow-x: auto;
  margin: 1em 0;
}

.markdown-content code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.2em 0.4em;
  border-radius: 0.3em;
  font-size: 0.9em;
}

.markdown-content pre code {
  background-color: transparent;
  padding: 0;
}

.markdown-content blockquote {
  border-left: 4px solid rgba(0, 0, 0, 0.1);
  padding-left: 1em;
  margin-left: 0;
  margin-right: 0;
  font-style: italic;
}

.dark .markdown-content pre,
.dark .markdown-content code {
  background-color: rgba(255, 255, 255, 0.1);
}

.dark .markdown-content blockquote {
  border-left-color: rgba(255, 255, 255, 0.3);
}
`

export default function DeepSeekChat({
  currentConversation,
  messages: initialMessages = [],
  conversations = [],
}: Props) {
  const { auth } = usePage<SharedData>().props
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExtracting, setIsExtracting] = useState<number[]>([])
  const [extractedText, setExtractedText] = useState("")
  const [isLoadingChats, setIsLoadingChats] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [textareaHeight, setTextareaHeight] = useState<number>(40)
  const [copiedMessageId, setCopiedMessageId] = useState<string | number | null>(null)
  const [pastedCodeSnippets, setPastedCodeSnippets] = useState<{ code: string; language: { id: string; name: string; icon: React.ReactNode } }[]>([])
  const [previewCodeIndex, setPreviewCodeIndex] = useState<number | null>(null)

  const eventSourceRef = useRef<EventSource | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const assistantMessageId = useRef<string | number>(Date.now())

  const { data, setData, reset } = useForm({
    message: "",
    images: [] as File[],
    conversation_id: currentConversation?.id || 0,
  })

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
  }, [data.message, adjustTextareaHeight])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    return () => eventSourceRef.current?.close()
  }, [])

  const copyToClipboard = (text: string, messageId: string | number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMessageId(messageId)
      setTimeout(() => {
        if (copiedMessageId === messageId) {
          setCopiedMessageId(null)
        }
      }, 1000)
    })
  }

  const stopGeneration = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      setIsLoading(false)
      const currentAssistantMessage = messages.find((msg) => msg.id === assistantMessageId.current)
      if (currentAssistantMessage && currentConversation) {
        axios.post("/api/save-partial-response", {
          conversation_id: currentConversation.id,
          content: currentAssistantMessage.content,
          role: "assistant",
          is_partial: true,
        }).catch(console.error)
      }
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId.current ? { ...msg, isStreaming: false, isThinking: false } : msg
        )
      )
    }
  }

  useEffect(() => {
    // Simulate loading chats
    const timer = setTimeout(() => {
      setIsLoadingChats(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Check for pending messages from new.tsx
  useEffect(() => {
    const pendingMessage = sessionStorage.getItem("pendingMessage") === "EMPTY_MESSAGE" ? "" : sessionStorage.getItem("pendingMessage"); 
    console.log("Pending message:", pendingMessage)
    if (pendingMessage && currentConversation) {
      // Clear the pending message from sessionStorage
      sessionStorage.removeItem("pendingMessage")
      
      // Get any pending extracted text
      const pendingExtractedText = sessionStorage.getItem("pendingExtractedText")
      if (pendingExtractedText) {
        sessionStorage.removeItem("pendingExtractedText")
        setExtractedText(pendingExtractedText)
      }
      
      // Get any pending images
      let pendingImages: Array<{ path: string; url: string; name: string; contentType?: string }> = []
      const pendingImagesStr = sessionStorage.getItem("pendingImages")
      if (pendingImagesStr) {
        sessionStorage.removeItem("pendingImages")
        try {
          pendingImages = JSON.parse(pendingImagesStr)
        } catch (e) {
          console.error("Error parsing pending images:", e)
        }
      }
      
      // Check for text extraction feedback
      const textExtracted = sessionStorage.getItem("textExtracted")
      if (textExtracted) {
        sessionStorage.removeItem("textExtracted")
      }

      // Create temporary assistant message for streaming
      const tempAssistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: "",
        role: "assistant",
        isStreaming: true,
        isThinking: true,
      }

      assistantMessageId.current = tempAssistantMessage.id
      setMessages((prev) => [...prev, tempAssistantMessage])
      setIsLoading(true)
      
      // Create query params for streaming
      const params = new URLSearchParams({
        message: pendingMessage,
        conversation_id: currentConversation.id.toString(),
      })
      
      // Add extracted text if available
      if (pendingExtractedText) {
        params.append("extracted_text", pendingExtractedText)
      }
      
      // Add image paths to params
      pendingImages.forEach((img) => params.append("images[]", img.path))
      
      // Create new EventSource
      const eventSource = new EventSource(`/chat-stream?${params.toString()}`)
      eventSourceRef.current = eventSource
      
      eventSource.onmessage = (event) => {
        const { content, finished } = JSON.parse(event.data)

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId.current
              ? {
            ...msg,
            content: msg.content + content,
                  isStreaming: !finished,
                  isThinking: false,
                }
                : msg,
          ),
        )
        
        if (finished) {
          eventSource.close()
          setIsLoading(false)
          
          // Fetch the conversation data to get the correct message IDs
          axios
            .get(`/api/conversations/${currentConversation.id}`)
            .then((response) => {
              const conversationData = response.data
              // Preserve message order by keeping existing messages and only updating IDs
              setMessages((prev) => {
                const existingMessages = [...prev]
                const serverMessages = conversationData.messages

                // Update message IDs while maintaining order
                return existingMessages.map((msg) => {
                  const serverMsg = serverMessages.find(
                    (sMsg: Message) => sMsg.role === msg.role && sMsg.content === msg.content,
                  )
                  return serverMsg || msg
                })
              })
            })
            .catch((error) => {
              console.error("Error fetching conversation data:", error)
            })
        }
      }
      
      eventSource.onerror = (error) => {
        console.error("Stream error:", error)
        eventSource.close()
        setIsLoading(false)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId.current ? { ...msg, isStreaming: false, isThinking: false } : msg,
          ),
        )
      }
    }
  }, [currentConversation])

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    
    const newFiles = Array.from(e.target.files).slice(0, 3 - imageFiles.length)
    const updatedFiles = [...imageFiles, ...newFiles]
    
    setImageFiles(updatedFiles)
    setData("images", updatedFiles)
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
    setData("images", updatedFiles)
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
    setExtractedText("")
  }

  const detectLanguage = (code: string): { id: string; name: string; icon: React.ReactNode } => {
    if (code.includes("<?php") || code.includes("namespace App\\") || code.match(/\$\w+\s*=\s*[^;]+;/)) {
      return { id: "php", name: "PHP", icon: <img src='/icons/laravel.png' width={15} alt="Laravel icon" /> }
    }
    if (code.includes("<React") || code.includes("import React") || (code.includes("return (") && code.includes("<") && code.includes(">"))) {
      return { id: "jsx", name: "React", icon: <span className="text-sky-500">⚛️</span> }
    }
    if (code.includes("interface ") || code.includes(": string") || code.includes(": number") || code.includes(": boolean") || code.includes(": React.") || code.includes("<T>")) {
      return { id: "typescript", name: "TypeScript", icon: <img src='/icons/typescript.png' width={15} alt="TypeScript icon" /> }
    }
    if (code.includes("function") || code.includes("const ") || code.includes("let ") || code.includes("var ") || code.includes("=> {") || code.includes("new Promise")) {
      return { id: "javascript", name: "JavaScript", icon: <img src='/icons/js.png' width={15} alt="JavaScript icon" /> }
    }
    if (code.includes("def ") || (code.includes("import ") && code.includes(":")) || code.match(/if\s+[\w_]+\s*:/) || (code.includes("class ") && code.includes(":"))) {
      return { id: "python", name: "Python", icon: <img src='/icons/python.png' width={15} alt="Python icon" /> }
    }
    if (code.includes("public class") || (code.includes("private") && code.includes("void")) || code.includes("System.out.println") || code.includes("extends ")) {
      return { id: "java", name: "Java", icon: <img src='/icons/java.png' width={15} alt="Java icon" /> }
    }
    if (code.includes("#include") || code.includes("int main") || code.includes("std::") || code.includes("cout <<")) {
      return { id: "cpp", name: "C/C++", icon: <img src='/icons/c++.png' width={15} alt="C++ icon" /> }
    }
    if (code.match(/SELECT\s+[\w\s*,]+\s+FROM/) || code.includes("INSERT INTO") || code.includes("CREATE TABLE") || (code.includes("UPDATE ") && code.includes("SET "))) {
      return { id: "sql", name: "SQL", icon: <img src='/icons/mysql.png' width={15} alt="SQL icon" /> }
    }
    if (code.includes("<!DOCTYPE html>") || (code.includes("<html>") && code.includes("</html>")) || (code.includes("<div") && code.includes("</div>") && code.includes("<head>"))) {
      return { id: "html", name: "HTML", icon: <img src='/icons/html.png' width={15} alt="HTML icon" /> }
    }
    if (code.match(/\.\w+\s*\{/) || code.includes("@media ") || code.includes("@keyframes") || (code.includes("margin:") && code.includes("padding:"))) {
      return { id: "css", name: "CSS", icon: <img src='/icons/css-3.png' width={15} alt="CSS icon" /> }
    }
    return { id: "code", name: "Code", icon: <Code className="h-3 w-3 text-gray-500" /> }
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    if (!data.message.trim() && !imageFiles.length && pastedCodeSnippets.length === 0) return

    let uploadedImages: Array<{ path: string; url: string; name: string; contentType?: string }> = []
    try {
      if (imageFiles.length > 0) {
        const formData = new FormData()
        imageFiles.forEach((file) => formData.append("images[]", file))
        const response = await axios.post("/api/upload-images", formData)
        uploadedImages = response.data.images
      }
    } catch (error) {
      console.error("Image upload failed:", error)
      return
    }

    let messageContent = data.message
    if (pastedCodeSnippets.length > 0) {
      messageContent +=
        "\n\n" +
        pastedCodeSnippets.map((snippet) => `\`\`\`${snippet.language.id}\n${snippet.code}\n\`\`\``).join("\n\n")
    }

    const tempUserMessage: Message = {
      id: `user-${Date.now()}`,
      content: messageContent,
      role: "user",
      attachments: uploadedImages.map((img) => ({
        url: img.url,
        contentType: img.contentType || "image/jpeg",
      })),
    }

    setMessages((prev) => [...prev, tempUserMessage])

    const tempAssistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      content: "",
      role: "assistant",
      isStreaming: true,
      isThinking: true,
    }

    assistantMessageId.current = tempAssistantMessage.id
    setMessages((prev) => [...prev, tempAssistantMessage])
    setIsLoading(true)

    try {
      const params = new URLSearchParams({
        message: messageContent,
        conversation_id: data.conversation_id.toString(),
      })
      
      if (extractedText) {
        params.append("extracted_text", extractedText)
      }
      
      uploadedImages.forEach((img) => params.append("images[]", img.path))

      eventSourceRef.current?.close()
      const eventSource = new EventSource(`/chat-stream?${params.toString()}`)
      eventSourceRef.current = eventSource

      eventSource.onmessage = (event) => {
        const { content, finished, error } = JSON.parse(event.data)

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId.current
              ? {
            ...msg,
                  content: msg.content + (content || ""),
                  isStreaming: !finished,
                  isThinking: false,
                }
              : msg
          )
        )

        if (content) {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }

        if (finished) {
          eventSource.close()
          setIsLoading(false)
          setTimeout(() => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId.current
                  ? {
                      ...msg,
                      isStreaming: false,
                    }
                  : msg
              )
            )
          }, 300)
          
          axios
            .get(`/api/conversations/${data.conversation_id}`)
            .then((response) => {
              const conversationData = response.data
              setMessages((prev) => {
                const existingMessages = [...prev]
                const serverMessages = conversationData.messages
                return existingMessages.map((msg) => {
                  if (msg.role === "user" || !msg.isStreaming) {
                    const serverMsg = serverMessages.find(
                      (sMsg: Message) => sMsg.role === msg.role && sMsg.content === msg.content
                    )
                    return serverMsg || msg
                  }
                  return msg
                })
              })
            })
            .catch(console.error)
        }
      }

      eventSource.onerror = (error) => {
        console.error("Stream error:", error)
        eventSource.close()
        setIsLoading(false)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId.current
              ? {
                  ...msg,
                  content: msg.content + "\n\nSorry, there was an error processing your request.",
                  isStreaming: false,
                  isThinking: false,
                }
              : msg
          )
        )
      }

      reset("message")
      setImageFiles([])
      setImagePreviews([])
      setExtractedText("")
      setPastedCodeSnippets([])
      setPreviewCodeIndex(null)
      if (fileInputRef.current) fileInputRef.current.value = ""

      if (textareaRef.current) {
        textareaRef.current.style.height = "40px"
        setTextareaHeight(40)
      }
    } catch (error) {
      console.error("Error starting stream:", error)
      setIsLoading(false)
      setMessages((prev) => [
        ...prev.filter((msg) => msg.id !== assistantMessageId.current),
        {
          id: `error-${Date.now()}`,
          content: "Sorry, there was an error processing your request.",
          role: "assistant",
        },
      ])
    }
  }

  const SimpleMarkdown = ({ content, isUserMessage = false }: { content: string; isUserMessage?: boolean }) => {
    if (!content) return null

    const formatUserCodeBlocks = (text: string) => {
      const parts = text.split(/(```[\s\S]*?```)/g)

      return parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/)
          if (match) {
            const [_, lang, code] = match
            const language = lang.trim() || "code"
            const langInfo = getLangInfo(language)
            const codeId = `user-code-${index}-${Math.random().toString(36).substring(2, 9)}`

            return (
              <div key={index} className="my-2 rounded-md border border-border overflow-hidden bg-muted/20">
                <div className="flex items-center justify-between bg-muted/40 px-3 py-1.5 border-b border-border">
                  <div className="flex items-center gap-1.5">
                    {langInfo.icon}
                    <span className="text-sm font-medium">{langInfo.name}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(code, codeId)}
                    className="text-xs flex items-center gap-1 hover:text-foreground transition-colors"
                    title="Copy code"
                  >
                    {copiedMessageId === codeId ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <div className="p-4 overflow-x-auto">
                  <pre className="text-sm font-mono whitespace-pre-wrap">{code}</pre>
                </div>
              </div>
            )
          }
        }

        return (
          <ReactMarkdown
            key={index}
            components={{
              code({ children }) {
                return <code className="bg-muted/20 px-1 py-0.5 rounded">{children}</code>
              },
            }}
          >
            {part}
          </ReactMarkdown>
        )
      })
    }

    if (isUserMessage) {
      return <div className="whitespace-pre-wrap">{formatUserCodeBlocks(content)}</div>
    }

    return <div className="">{formatUserCodeBlocks(content)}</div>
  }

  useEffect(() => {
    const styleElement = document.createElement("style")
    styleElement.textContent = animationStyles
    document.head.appendChild(styleElement)
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  const calculateSizeInKB = (text: string): number => {
    const bytes = new TextEncoder().encode(text).length
    return Math.round((bytes / 1024) * 10) / 10
  }

  const countLines = (text: string): number => {
    return text.split("\n").length
  }

  const getFileExtension = (language: string): string => {
    const extensions: Record<string, string> = {
      php: "php",
      jsx: "jsx",
      typescript: "ts",
      javascript: "js",
      python: "py",
      java: "java",
      cpp: "cpp",
      go: "go",
      html: "html",
      css: "css",
      sql: "sql",
      blade: "blade.php",
      code: "txt",
    }
    return extensions[language] || "txt"
  }

  const getLangInfo = (lang: string) => {
    const langMap: Record<string, { name: string; icon: React.ReactNode }> = {
      php: { name: "Laravel", icon: <img src='/icons/laravel.png' width={15} alt="Laravel icon" /> },
      jsx: { name: "React", icon: <span className="text-sky-500">JSX</span> },
      typescript: { name: "TypeScript", icon: <img src='/icons/typescript.png' width={15} alt="TypeScript icon" /> },
      ts: { name: "TypeScript", icon: <span className="text-blue-500">TS</span> },
      javascript: { name: "JavaScript", icon: <img src='/icons/js.png' width={15} alt="JavaScript icon" /> },
      js: { name: "JavaScript", icon: <span className="text-yellow-500">JS</span> },
      python: { name: "Python", icon: <img src='/icons/python.png' width={15} alt="Python icon" /> },
      py: { name: "Python", icon: <img src='/icons/python.png' width={15} alt="Python icon" /> },
      java: { name: "Java", icon: <img src='/icons/java.png' width={15} alt="Java icon" /> },
      cpp: { name: "C++", icon: <img src='/icons/c++.png' width={15} alt="C++ icon" /> },
      c: { name: "C", icon: <span className="text-blue-600">C</span> },
      sql: { name: "SQL", icon: <img src='/icons/mysql.png' width={15} alt="SQL icon" /> },
      html: { name: "HTML", icon: <img src='/icons/html.png' width={15} alt="HTML icon" /> },
      css: { name: "CSS", icon: <img src='/icons/css-3.png' width={15} alt="CSS icon" /> },
      blade: { name: "Laravel", icon: <span className="text-red-500">🔪</span> },
      go: { name: "Go", icon: <span className="text-cyan-500">Go</span> },
      json: { name: "JSON", icon: <span className="text-gray-500">{}</span> },
      xml: { name: "XML", icon: <span className="text-orange-400">&lt;/&gt;</span> },
      bash: { name: "Bash", icon: <span className="text-green-600">$</span> },
      sh: { name: "Shell", icon: <span className="text-green-600">$</span> },
      ruby: { name: "Ruby", icon: <span className="text-red-600">💎</span> },
      rb: { name: "Ruby", icon: <span className="text-red-600">💎</span> },
      rust: { name: "Rust", icon: <span className="text-orange-700">🦀</span> },
      rs: { name: "Rust", icon: <span className="text-orange-700">🦀</span> },
      swift: { name: "Swift", icon: <span className="text-orange-500">🔶</span> },
      kotlin: { name: "Kotlin", icon: <span className="text-purple-500">K</span> },
      dart: { name: "Dart", icon: <span className="text-blue-400">🎯</span> },
    }

    return (
      langMap[lang.toLowerCase()] || {
        name: lang ? lang.charAt(0).toUpperCase() + lang.slice(1) : "Code",
        icon: <Code className="h-3 w-3" />,
      }
    )
  }

  // Find the previous user message for regeneration
  const findPreviousUserMessage = (currentMessageId: string | number) => {
    const currentIndex = messages.findIndex((msg) => msg.id === currentMessageId)
    if (currentIndex <= 0) return null

    // Look backwards for the most recent user message
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        return messages[i].content
      }
    }
    return null
  }

  return (
    <AppSidebarLayout conversations={conversations} breadcrumbs={breadcrumbs}>
      <Head title="DeepSeek Chat" />
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-3xl mx-auto space-y-5">
              {isLoadingChats ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <div className="space-y-12 flex-1">
                        <Skeleton className="h-30 w-180" />
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="flex items-start mt-10 group">
                    <div className="flex-shrink-0">
                      {message.role === "user" ? (
                        <div className="h-8 w-8 overflow-hidden rounded-md">
                          <img src={auth.user.avatar || "/placeholder.svg"} alt="" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                          AI
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className={cn("rounded-lg p-3 relative text-sm", message.isThinking ? "flex items-center" : "")}>
                        {message.isThinking ? (
                          <div className="flex items-center text-muted-foreground">
                            <span className="thinking-pulse mr-2">is Thinking ...</span>
                            <span className="thinking-pulse" style={{ animationDelay: "0.3s" }}>.</span>
                            <span className="thinking-pulse" style={{ animationDelay: "0.6s" }}>.</span>
                            <span className="thinking-pulse" style={{ animationDelay: "0.9s" }}>.</span>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">
                            {message.role === "assistant" ? (
                              <SimpleMarkdown content={message.content} />
                            ) : (
                              <SimpleMarkdown content={message.content} isUserMessage={true} />
                            )}
                          </div>
                        )}
                      </div>

                      {message.content && !message.isThinking && (
                        <div className="transition-opacity flex items-center gap-2 mt-2 ms-3 text-muted-foreground">
                          <button
                            onClick={() => copyToClipboard(message.content, message.id)}
                            className="text-xs flex items-center gap-1 hover:text-foreground transition-colors relative"
                            title="Copy message"
                          >
                            {copiedMessageId === message.id ? (
                              <>
                                <Check className="h-3 w-3 text-green-500" />
                                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-background border border-border rounded px-2 py-1 text-xs whitespace-nowrap">
                                  Copied!
                                </span>
                              </>
                            ) : (
                              <Copy className="h-4 w-4 hover:scale-110 transition-transform" />
                            )}
                          </button>

                          {message.role === "assistant" && (
                            <button
                              onClick={() => {
                                const userMessage = findPreviousUserMessage(message.id)
                                if (userMessage) {
                                  regenerateResponse(userMessage)
                                }
                              }}
                              className="text-xs flex items-center gap-1 hover:text-foreground transition-colors"
                              disabled={isLoading}
                              title="Regenerate response"
                            >
                              <RefreshCw className="h-4 w-4 hover:scale-110 transition-transform" />
                            </button>
                          )}
                        </div>
                      )}

                      {message.role === "user" && (
                        <div className="flex flex-wrap gap-2 mt-2 overflow-x-auto pb-2 ms-4">
                          {message.attachments?.map((attachment, i) => (
                            <button
                              key={`img-${i}`}
                              onClick={() => setSelectedImage(attachment.url)}
                              className="flex items-center gap-2 p-2 bg-background rounded-lg border border-border hover:bg-muted/50 transition-colors"
                            >
                              <FileText className="h-3.5 w-3.5 text-primary" />
                              <span className="text-xs">Document {i + 1}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t bg-background">
            <div className="max-w-3xl mx-auto p-4">
              {(imagePreviews.length > 0 || pastedCodeSnippets.length > 0) && (
                <div className="mb-3 border border-border rounded-md p-2 bg-background">
                  <div className="flex overflow-x-auto pb-2 gap-2">
                  {imagePreviews.map((preview, i) => (
                      <div key={`img-${i}`} className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden">
                        <img
                          src={preview || "/placeholder.svg"}
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
                      const extension = getFileExtension(snippet.language.id)
                      return (
                        <div
                          key={`code-${index}`}
                          className="flex-shrink-0 w-48 h-16 flex flex-col bg-muted/30 rounded-md border border-border overflow-hidden hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center justify-between bg-muted/50 px-2 py-1 border-b border-border">
                            <div className="flex items-center flex-1 gap-1 select-none">
                              {snippet.language.icon}
                              <span className="text-[0.7rem] font-medium truncate">
                                file{index + 1}.{extension}
                              </span>
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
                            <pre className="text-[0.2rem] pt-1 text-muted-foreground">
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
                      value={data.message}
                      onChange={(e) => setData("message", e.target.value)}
                      placeholder="Type a message..."
                      className="w-full rounded-lg py-3 pl-4 pr-24 resize-none focus-visible:outline-none bg-transparent text-sm"
                      style={{ height: `${textareaHeight}px` }}
                      disabled={isLoading || isExtracting.length > 0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          const form = e.currentTarget.form
                          form?.requestSubmit()
                        } else if (e.key === "Enter" && e.ctrlKey) {
                          e.preventDefault()
                          setData("message", data.message + "\n")
                          setTimeout(adjustTextareaHeight, 0)
                        }
                      }}
                      onPaste={(e) => {
                        const clipboardData = e.clipboardData
                        const pastedText = clipboardData.getData("text")

                        if (isCodeSnippet(pastedText) && pastedCodeSnippets.length < 5) {
                          e.preventDefault()
                          const language = detectLanguage(pastedText)
                          setPastedCodeSnippets((prev) => [...prev, { code: pastedText, language }])
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
                        disabled={imageFiles.length >= 3 || isLoading || isExtracting.length > 0}
                      >
                        <PaperclipIcon className="h-4 w-4" />
                      </Button>

                      <Button
                        type={isLoading ? "button" : "submit"}
                        size="icon"
                        className="h-8 w-8"
                        disabled={
                          isExtracting.length > 0 ||
                          (!isLoading && !data.message.trim() && !imageFiles.length && pastedCodeSnippets.length === 0)
                        }
                        onClick={(e) => {
                          if (isLoading) {
                            e.preventDefault()
                            stopGeneration()
                          }
                        }}
                      >
                        {isLoading ? <Square className="h-2 w-2" /> : <ArrowUp className="h-4 w-4" />}
                      </Button>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageSelect}
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={imageFiles.length >= 3 || isLoading || isExtracting.length > 0}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Press Enter to send, Ctrl+Enter for line break</p>
                </form>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={previewCodeIndex !== null} onOpenChange={(open) => !open && setPreviewCodeIndex(null)}>
        <DialogContent className="max-w-3xl w-full p-4 overflow-hidden">
          {previewCodeIndex !== null && pastedCodeSnippets[previewCodeIndex] && (() => {
            const snippet = pastedCodeSnippets[previewCodeIndex]
            const code = snippet.code
            const language = snippet.language
            const extension = getFileExtension(language.id)
            const sizeKB = calculateSizeInKB(code)
            const lineCount = countLines(code)
            const charCount = code.length

            return (
              <div className="relative w-full">
                <div className="flex items-center mb-3 px-1">
                  <h3 className="text-xs font-medium flex items-center gap-2">
                    {language.icon}
                    <span>file{previewCodeIndex + 1}.{extension}</span>
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pl-4">
                    <span>{sizeKB} KB</span>
                    <span>•</span>
                    <span>{lineCount} lines</span>
                    <span>•</span>
                    <span>{charCount} chars</span>
                  </div>
                </div>
                <div className="rounded-md border border-border overflow-hidden">
                  <div className="bg-muted/50 px-3 py-2 border-b border-border flex items-center justify-between">
                    <div className="flex items-center text-xs">
                      {language.icon}
                      <span className="text-[0.6rem] font-medium ml-2">{language.name}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(code, `code-${previewCodeIndex}`)}
                      className="text-xs flex items-center gap-1 hover:text-foreground transition-colors"
                      title="Copy code"
                    >
                      {copiedMessageId === `code-${previewCodeIndex}` ? (
                        <Check className="h-3.5 w-3.5 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4 hover:opacity-50" />
                      )}
                    </button>
                  </div>
                  <div className="max-h-[calc(70vh-100px)] overflow-auto bg-background p-5">
                    <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-scroll break-words">
                      {code.split("\n").map((line, index) => (
                        <div key={index}>
                          {line.length > 120 ? `${line.slice(0, 60)}...` : line}
                        </div>
                      ))}
                    </pre>
                  </div>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
          {selectedImage && (
            <div className="relative w-full h-[80vh]">
              <img
                src={selectedImage || "/placeholder.svg"}
                alt="Document preview"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppSidebarLayout>
  )
}
