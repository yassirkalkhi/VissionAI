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
import { CodeBlock } from "@/components/CodeBlock"
import { translations } from "@/translations"
import { useLanguage } from "@/contexts/LanguageContext"

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
  margin: 1em 0;
  max-width: 100%;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-all;
}

.markdown-content code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.2em 0.4em;
  border-radius: 0.3em;
  font-size: 0.9em;
  word-break: break-all;
  word-wrap: break-word;
}

.markdown-content pre code {
  background-color: transparent;
  padding: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-all;
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

.code-block-container {
  max-width: 100%;
  overflow-x: auto;
  margin: 1em 0;
}

.code-block-content {
  min-width: 100%;
  overflow-x: auto;
}

@media (max-width: 640px) {
  .code-block-content pre {
    font-size: 0.8em;
  }
}
`

const calculateSizeInKB = (text: string): number => {
  const bytes = new TextEncoder().encode(text).length
  return Math.round((bytes / 1024) * 10) / 10
}

const countLines = (text: string): number => {
  return text.split("\n").length
}

const getFileExtension = () => "txt"

const generateUniqueId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

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
  const [collapsedCodeBlocks, setCollapsedCodeBlocks] = useState<Set<string>>(new Set())
  const [pastedCodeSnippets, setPastedCodeSnippets] = useState<{ code: string }[]>([])
  const [previewCodeIndex, setPreviewCodeIndex] = useState<number | null>(null)
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  const eventSourceRef = useRef<EventSource | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messageRef = useRef<string>("")
  const assistantMessageId = useRef<string | number>(Date.now())
  const [canSubmit, setCanSubmit] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { setData, reset } = useForm({
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
    // Only scroll on initial load
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
    }
  }, []) // Empty dependency array means this only runs once on mount

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    return () => eventSourceRef.current?.close()
  }, [])

  const copyToClipboard = async (text: string, messageId: string | number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      setTimeout(() => {
        setCopiedMessageId(null)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const stopGeneration = () => {
    if (eventSourceRef.current) {
      console.log("Stopping message generation");
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      
      setIsLoading(false);
      setIsSubmitting(false);
      
      const currentAssistantMessage = messages.find((msg) => msg.id === assistantMessageId.current);
      if (currentAssistantMessage && currentConversation) {
        // Save the partial response to the server
        axios.post("/api/save-partial-response", {
          conversation_id: currentConversation.id,
          content: currentAssistantMessage.content,
          role: "assistant",
          is_partial: true,
        })
        .then(response => {
          console.log("Partial response saved:", response.data);
        })
        .catch(error => {
          console.error("Error saving partial response:", error);
        });
      }
      
      // Mark the message as no longer streaming
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId.current 
            ? { 
                ...msg, 
                isStreaming: false, 
                isThinking: false,
                content: msg.content + "\n\n[Generation stopped]" 
              } 
            : msg
        )
      );
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
    if ((pendingMessage !== null) && currentConversation) {
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

      // Only proceed if we have either a message or images
      if (pendingMessage || pendingImages.length > 0) {
        // Create temporary assistant message for streaming
        const tempAssistantMessage: Message = {
          id: generateUniqueId('assistant'),
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
          message: pendingMessage || "",
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
            setIsSubmitting(false);
          
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
    }
  }, [currentConversation])

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    
    console.log("Files selected:", e.target.files.length);
    
    // Filter out non-image files AND restrict to supported formats (jpeg, png, jpg, gif)
    const supportedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    const selectedFiles = Array.from(e.target.files).filter(file => 
      supportedFormats.includes(file.type.toLowerCase())
    );
    
    console.log("Filtered supported files:", selectedFiles.length);
    
    if (selectedFiles.length === 0) return;
    
    // Calculate how many more files we can add (maximum of 3 total)
    const currentFilesCount = imageFiles.length;
    const remainingSlots = Math.max(0, 3 - currentFilesCount);
    const filesToAdd = selectedFiles.slice(0, remainingSlots);
    
    console.log(`Can add ${remainingSlots} more files, adding ${filesToAdd.length} files`);
    
    if (filesToAdd.length === 0) return;
    
    // Update the files array
    const updatedFiles = [...imageFiles, ...filesToAdd];
    console.log("Updated files array:", updatedFiles.length);
    
    setImageFiles(updatedFiles);
    setData("images", updatedFiles);
    setExtractedText(""); // Reset extracted text before processing new images
    
    // Process each new file for preview and text extraction
    filesToAdd.forEach((file, index) => {
      console.log(`Processing file ${index}: ${file.name}`);
      
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const result = e.target?.result;
        if (result) {
          console.log(`Adding preview for file ${index}: ${file.name}`);
          setImagePreviews(prev => [...prev, result as string]);
          
          // Use the actual index in the combined array for extraction tracking
          const extractionIndex = currentFilesCount + index;
          setIsExtracting(prev => [...prev, extractionIndex]);

          extractTextFromImage(file)
            .then((text) => {
              console.log(`Extracted text from ${file.name}:`, text ? "yes" : "no");
              if (text) {
                setExtractedText(prev => (prev ? prev + "\n\n" : "") + text);
              }
              setIsExtracting(prev => prev.filter(idx => idx !== extractionIndex));
            })
            .catch((error) => {
              console.error(`Error extracting text from ${file.name}:`, error);
              setIsExtracting(prev => prev.filter(idx => idx !== extractionIndex));
            });
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Reset file input to allow selecting the same file again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
    console.log(`Removing image at index ${index}`);
    console.log(`Before removal: imageFiles=${imageFiles.length}, imagePreviews=${imagePreviews.length}`);
    
    // Update the files array
    const updatedFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(updatedFiles);
    setData("images", updatedFiles);
    
    // Update the previews array
    setImagePreviews((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      console.log(`After removal: updated previews length=${updated.length}`);
      return updated;
    });
    
    // Clear extracted text when removing images
    if (updatedFiles.length === 0) {
      setExtractedText("");
    }
  };

  // Check if message can be submitted
  useEffect(() => {
    let hasText = false;
    if (textareaRef.current && textareaRef.current.value) {
      hasText = textareaRef.current.value.trim().length > 0;
    }
    const hasImages = imageFiles.length > 0;
    const notLoading = !isLoading && isExtracting.length === 0;
    
    setCanSubmit((hasText || hasImages) && notLoading);
  }, [imageFiles, isLoading, isExtracting]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Prevent multiple submissions
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const messageContent = textareaRef.current?.value?.trim() || ""
    if (!messageContent && imageFiles.length === 0) {
      setIsSubmitting(false);
      return;
    }

    let uploadedImages: Array<{ path: string; url: string; name: string; contentType?: string }> = []
    try {
      if (imageFiles.length > 0) {
        // Verify again that all files are valid supported images
        const supportedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
        const validImages = imageFiles.filter(file => supportedFormats.includes(file.type.toLowerCase()));
        
        if (validImages.length > 0) {
          const formData = new FormData()
          validImages.forEach((file) => formData.append("images[]", file))
          
          try {
            const response = await axios.post("/api/upload-images", formData)
            uploadedImages = response.data.images
          } catch (error) {
            // Silently handle upload errors - don't show to user
            console.error("Image upload failed:", error)
            // Continue with text-only message
          }
        }
      }
    } catch (error) {
      // Silently handle any other errors
      console.error("Image processing error:", error)
      // Continue with text-only message
    }

    let finalMessageContent = messageContent
    if (pastedCodeSnippets.length > 0) {
      finalMessageContent +=
        "\n\n" +
        pastedCodeSnippets.map((snippet) => `\`\`\`\n${snippet.code}\n\`\`\``).join("\n\n")
    }

    const uniqueUserId = generateUniqueId('user');
    const tempUserMessage: Message = {
      id: uniqueUserId,
      content: finalMessageContent,
      role: "user",
      attachments: uploadedImages.map((img) => ({
        url: img.url,
        contentType: img.contentType || "image/jpeg",
      })),
    }

    setMessages((prev) => [...prev, tempUserMessage])

    const uniqueAssistantId = generateUniqueId('assistant');
    const tempAssistantMessage: Message = {
      id: uniqueAssistantId,
      content: "",
      role: "assistant",
      isStreaming: true,
      isThinking: true,
    }

    assistantMessageId.current = tempAssistantMessage.id
    setMessages((prev) => [...prev, tempAssistantMessage])
    setIsLoading(true)
    setIsSubmitting(true); // Prevent other submissions while regenerating

    try {
      const params = new URLSearchParams({
        message: finalMessageContent,
        conversation_id: currentConversation?.id.toString() || "0",
      })
      
      if (extractedText) {
        params.append("extracted_text", extractedText)
      }
      
      uploadedImages.forEach((img) => params.append("images[]", img.path))

      eventSourceRef.current?.close()
      const eventSource = new EventSource(`/chat-stream?${params.toString()}`)
      eventSourceRef.current = eventSource

      eventSource.onmessage = (event) => {
        const { content, finished } = JSON.parse(event.data)

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

        if (finished) {
          eventSource.close()
          setIsLoading(false)
          setIsSubmitting(false);
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
            .get(`/api/conversations/${currentConversation?.id}`)
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
        setIsSubmitting(false);
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

      // Clear the textarea using the ref instead of state
      if (textareaRef.current) {
        textareaRef.current.value = ""
        messageRef.current = ""
      }
      
      reset("message")
      setImageFiles([])
      setImagePreviews([])
      setExtractedText("")
      setPastedCodeSnippets([]) // Also clear any pasted code snippets
      setCanSubmit(false) // Reset submit button state
      if (fileInputRef.current) fileInputRef.current.value = ""

      if (textareaRef.current) {
        textareaRef.current.style.height = "40px"
        setTextareaHeight(40)
      }
    } catch (error) {
      console.error("Error starting stream:", error)
      setIsLoading(false)
      setIsSubmitting(false);
      setMessages((prev) => [
        ...prev.filter((msg) => msg.id !== assistantMessageId.current),
        {
          id: generateUniqueId('error'),
          content: "Sorry, there was an error processing your request.",
          role: "assistant",
        },
      ])
    }
    
    // Reset submission state after a delay
    setTimeout(() => {
      setIsSubmitting(false);
    }, 1000);
  }

  const toggleCodeBlock = (blockId: string) => {
    setCollapsedCodeBlocks((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(blockId)) {
        newSet.delete(blockId)
      } else {
        newSet.add(blockId)
      }
      return newSet
    })
  }

  const formatCodeBlocks = (text: string) => {
    const parts = text.split(/(```[\s\S]*?)(?:```|$)/g)

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const match = part.match(/```(\w*)\n?([\s\S]*?)(?:```|$)/)
        if (match) {
          const [_, lang, code] = match
          const language = lang.trim() || 'code'
          const langInfo = getLangInfo(language)
          return (
            <CodeBlock
              key={`code-${index}-${Date.now()}`}
              code={code}
              language={langInfo.name}
              icon={langInfo.icon}
            />
          )
        }
      }

      // Process regular text with proper spacing
      const textContent = part.trim()
      if (!textContent) return null

      return (
        <div key={index} className={`prose dark:prose-invert max-w-none`}>
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
              code: ({ children }) => (
                <code className="bg-muted/20 px-1 py-0.5 rounded text-sm">{children}</code>
              ),
              pre: ({ children }) => <pre className="overflow-x-auto">{children}</pre>,
              ul: ({ children }) => <ul className={`list-disc mb-2`}>{children}</ul>,
              ol: ({ children }) => <ol className={`list-decimal  mb-2`}>{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              h1: ({ children }) => <h1 className="text-2xl font-bold mb-1 mt-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xl font-bold mb-1 mt-2">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg font-bold mb-1 mt-2">{children}</h3>,
              blockquote: ({ children }) => (
                <blockquote className={`border-l-4 border-border  italic my-4`}>{children}</blockquote>
              ),
            }}
          >
            {textContent}
          </ReactMarkdown>
        </div>
      )
    }).filter(Boolean)
  }

  const SimpleMarkdown = ({ content, isUserMessage = false }: { content: string; isUserMessage?: boolean }) => {
    if (!content) return null;

    return (
      <div className={cn("space-y-4", isUserMessage ? "whitespace-pre-wrap" : "",)}>
        {formatCodeBlocks(content)}
      </div>
    );
  };

  useEffect(() => {
    const styleElement = document.createElement("style")
    styleElement.textContent = animationStyles
    document.head.appendChild(styleElement)
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  const getLangInfo = (lang: string) => {
    const langMap: Record<string, { name: string; icon: React.ReactNode }> = {
      php: { name: "Laravel", icon: <img src='/icons/laravel.png' width={15} alt="Laravel icon" /> },
      jsx: { name: "React", icon: <span className="text-sky-500">⚛️</span> },
      typescript: { name: "TypeScript", icon: <img src='/icons/typescript.png' width={15} alt="TypeScript icon" /> },
      ts: { name: "TypeScript", icon: <img src='/icons/typescript.png' width={15} alt="TypeScript icon" /> },
      javascript: { name: "JavaScript", icon: <img src='/icons/js.png' width={15} alt="JavaScript icon" /> },
      js: { name: "JavaScript", icon: <img src='/icons/js.png' width={15} alt="JavaScript icon" /> },
      python: { name: "Python", icon: <img src='/icons/python.png' width={15} alt="Python icon" /> },
      py: { name: "Python", icon: <img src='/icons/python.png' width={15} alt="Python icon" /> },
      java: { name: "Java", icon: <img src='/icons/java.png' width={15} alt="Java icon" /> },
      cpp: { name: "C++", icon: <img src='/icons/cplusplus.png' width={15} alt="C++ icon" /> },
      c: { name: "C", icon: <img src='/icons/cplusplus.png' width={15} alt="C/C++ icon" /> },
      sql: { name: "SQL", icon: <img src='/icons/mysql.png' width={15} alt="SQL icon" /> },
      html: { name: "HTML", icon: <img src='/icons/html.png' width={15} alt="HTML icon" /> },
      css: { name: "CSS", icon: <img src='/icons/css-3.png' width={15} alt="CSS icon" /> },
      go: { name: "Go", icon: <img src='/icons/go.png' width={15} alt="Go icon" /> },
      // Remove unused icons and use text alternatives for missing ones
      blade: { name: "Laravel", icon: <span className="text-red-500">🔪</span> },
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

  const isCodeSnippet = (text: string): boolean => {
    return text.split("\n").length > 1 || text.length > 80
  }

  const regenerateResponse = async (userMessage: string) => {
    if (isLoading || isSubmitting) return

    const uniqueAssistantId = generateUniqueId('assistant');
    const tempAssistantMessage: Message = {
      id: uniqueAssistantId,
      content: "",
      role: "assistant",
      isStreaming: true,
      isThinking: true,
    }

    assistantMessageId.current = tempAssistantMessage.id
    setMessages((prev) => [...prev, tempAssistantMessage])
    setIsLoading(true)
    setIsSubmitting(true); // Prevent other submissions while regenerating

    try {
      const params = new URLSearchParams({
        message: userMessage,
        conversation_id: currentConversation?.id.toString() || "0",
      })

      eventSourceRef.current?.close()
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
              : msg
          )
        )

        if (finished) {
          eventSource.close()
          setIsLoading(false)
          
          axios
            .get(`/api/conversations/${currentConversation?.id}`)
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
        setIsSubmitting(false);
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
    } catch (error) {
      console.error("Error starting stream:", error)
      setIsLoading(false)
      setIsSubmitting(false);
      setMessages((prev) => [
        ...prev.filter((msg) => msg.id !== assistantMessageId.current),
        {
          id: generateUniqueId('error'),
          content: "Sorry, there was an error processing your request.",
          role: "assistant",
        },
      ])
    }
    
    // Reset submission state after a delay
    setTimeout(() => {
      setIsSubmitting(false);
    }, 1000);
  }

  return (
    <AppSidebarLayout breadcrumbs={breadcrumbs}>
      <Head title="DeepSeek Chat" />
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-3xl mx-auto space-y-5">
              {isLoadingChats ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`flex items-start gap-2`}>
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <div className="space-y-12 flex-1">
                        <Skeleton className="h-30 w-full" />
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
                        <div className="h-8 w-8 rounded-md bg-linear-150 from-[#00bba2] to-pink-300 text-primary-foreground flex items-center justify-center text-xs font-medium">
                        </div>
                      )}
                    </div>

                    <div className="flex-1 ml-3">
                    <div className={cn("rounded-lg p-3 relative text-sm", message.isThinking ? "flex items-center" : "")}>
                        {message.isThinking ? (
                           <div className="flex items-center text-muted-foreground">
                           <span className="thinking-pulse mr-2">{t.thinking || "Thinking"}</span>
                           <span className="thinking-pulse" style={{ animationDelay: "0.3s" }}>.</span>
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
                                  {t.copied}
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
                            >
                              <RefreshCw className="h-4 w-4 hover:scale-110 transition-transform" />
                            </button>
                          )}
                        </div>
                      )}

                      {message.role === "user" && message.attachments && message.attachments.length > 0 && (
                        <div className={`flex flex-wrap gap-2 mt-2 overflow-x-auto pb-2 ${isRTL ? 'justify-end mr-4' : 'ms-4'}`}>
                          {message.attachments?.map((attachment, i) => (
                            <button
                              key={`img-${i}`}
                              onClick={() => {
                                // Try to fix URL if needed
                                let imgUrl = attachment.url;
                                if (imgUrl.includes('/storage/')) {
                                  const pathPart = imgUrl.split('/storage/')[1];
                                  imgUrl = window.location.origin + '/storage/' + pathPart;
                                }
                                setSelectedImage(imgUrl);
                              }}
                              className={`flex items-center gap-2 p-2 bg-background rounded-lg border border-border hover:bg-muted/50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
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
                  <div className={`flex overflow-x-auto pb-2 gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {imagePreviews.length > 0 && (
                      <>
                        {imagePreviews.map((preview, i) => (
                          <div key={`img-${i}`} className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border border-border">
                            <img
                              src={preview || "/placeholder.svg"}
                              alt={`Preview ${i}`}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                console.error(`Failed to load image preview ${i}`);
                                // Try fallback to direct access if using storage URL failed
                                const currentSrc = e.currentTarget.src;
                                if (currentSrc.includes('/storage/')) {
                                  const pathPart = currentSrc.split('/storage/')[1];
                                  e.currentTarget.src = window.location.origin + '/storage/' + pathPart;
                                } else {
                                  e.currentTarget.src = "/placeholder.svg";
                                }
                              }}
                            />
                            {isExtracting.includes(i) && (
                              <div className="absolute inset-0 flex items-center justify-center bg-background/70 dark:bg-background/70">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} bg-black/70 rounded-full p-0.5`}
                              title="Remove image"
                            >
                              <X className="h-3 w-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </>
                    )}

                    {pastedCodeSnippets.map((snippet, index) => {
                      const extension = getFileExtension()
                      return (
                        <div
                          key={`code-${index}`}
                          className={`flex-shrink-0 w-48 h-16 flex flex-col bg-muted/30 rounded-md border border-border overflow-hidden hover:shadow-sm transition-shadow`}
                        >
                          <div className={`flex items-center justify-between bg-muted/50 px-2 py-1 border-b border-border ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <div className="flex items-center flex-1 gap-1 select-none">
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
                              className={`text-xs text-muted-foreground hover:text-foreground ${isRTL ? 'mr-1' : 'ml-1'}`}
                              title="Remove code snippet"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <div
                            className="flex-1 p-1 overflow-hidden cursor-pointer"
                            onClick={() => setPreviewCodeIndex(index)}
                          >
                            <pre className={`text-[0.2rem] pt-1 text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
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
                  <div className={`relative flex-1 flex items-start rounded-lg border border-input bg-background focus-within:ring-1 focus-within:ring-ring ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <textarea
                      ref={textareaRef}
                      placeholder={t.typeMessage}
                      className={`w-full rounded-lg py-3 ${isRTL ? 'pl-24 pr-4 text-right' : 'pl-4 pr-24'} resize-none focus-visible:outline-none bg-transparent text-sm overflow-hidden`}
                      style={{ height: `${textareaHeight}px` }}
                      disabled={isLoading || isExtracting.length > 0}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        messageRef.current = target.value;
                        // Update canSubmit state when textarea content changes
                        setCanSubmit(
                          (target.value?.trim()?.length > 0 || imageFiles.length > 0) && 
                          !isLoading && 
                          isExtracting.length === 0
                        );
                        adjustTextareaHeight();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          // Only submit if the form can be submitted
                          if (canSubmit) {
                            const form = e.currentTarget.form;
                            form?.requestSubmit();
                          }
                        } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault();
                          if (textareaRef.current) {
                            const cursorPos = textareaRef.current.selectionStart;
                            const value = textareaRef.current.value || "";
                            const newValue = value.substring(0, cursorPos) + "\n" + value.substring(cursorPos);
                            textareaRef.current.value = newValue;
                            
                            // Set the cursor position after the inserted newline
                            setTimeout(() => {
                              if (textareaRef.current) {
                                textareaRef.current.selectionStart = cursorPos + 1;
                                textareaRef.current.selectionEnd = cursorPos + 1;
                                messageRef.current = textareaRef.current.value;
                                // Update canSubmit state
                                setCanSubmit(
                                  (textareaRef.current.value?.trim()?.length > 0 || imageFiles.length > 0) && 
                                  !isLoading && 
                                  isExtracting.length === 0
                                );
                                adjustTextareaHeight();
                              }
                            }, 0);
                          }
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
                      dir={isRTL ? "rtl" : "ltr"}
                    />

                    <div className={`absolute ${isRTL ? 'left-2' : 'right-2'} top-2 flex items-center gap-2`}>
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
                        disabled={isLoading ? false : !canSubmit || isSubmitting}
                        onClick={(e) => {
                          if (isLoading) {
                            e.preventDefault()
                            stopGeneration()
                          }
                        }}
                      >
                        {isLoading ? <Square className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                      </Button>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageSelect}
                      accept="image/jpeg,image/png,image/jpg,image/gif"
                      multiple
                      className="hidden"
                      disabled={imageFiles.length >= 3 || isLoading || isExtracting.length > 0}
                    />
                  </div>
                  <p className={`text-xs text-muted-foreground mt-2 ${isRTL ? 'text-right' : ''}`}>{t.pressEnterToSend + " , " + t.pressCtrlEnterNewLine}</p>
                </form> 
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
          {selectedImage && (
            <div className="relative w-full h-[80vh]">
              <img
                src={selectedImage || "/placeholder.svg"}
                alt="Document preview"
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error("Failed to load modal image");
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
              <button 
                onClick={() => setSelectedImage(null)}
                className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} p-2 bg-background/80 rounded-full hover:bg-background transition-colors`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={previewCodeIndex !== null} onOpenChange={(open) => !open && setPreviewCodeIndex(null)}>
        <DialogContent className="max-w-3xl w-full p-4 overflow-hidden">
          {previewCodeIndex !== null && pastedCodeSnippets[previewCodeIndex] && (() => {
            const snippet = pastedCodeSnippets[previewCodeIndex]
            const code = snippet.code
            const sizeKB = calculateSizeInKB(code)
            const lineCount = countLines(code)
            const charCount = code.length

            return (
              <div className="relative w-full">
                <div className={`flex items-center mb-3 px-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <h3 className="text-xs font-medium flex items-center gap-2">
                    <span>file{previewCodeIndex + 1}.txt</span>
                  </h3>
                  <div className={`flex items-center gap-3 text-xs text-muted-foreground ${isRTL ? 'pr-4' : 'pl-4'}`}>
                    <span>{sizeKB} KB</span>
                    <span>•</span>
                    <span>{lineCount} lines</span>
                    <span>•</span>
                    <span>{charCount} chars</span>
                  </div>
                </div>
                <div className="rounded-md border border-border overflow-hidden">
                  <div className={`bg-muted/50 px-3 py-2 border-b border-border flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="flex items-center text-xs">
                      <span className={`text-[0.6rem] font-medium ${isRTL ? 'mr-2' : 'ml-2'}`}>Code</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(code, `code-${previewCodeIndex}`)}
                      className="text-xs flex items-center gap-1 hover:text-foreground transition-colors"
                      title={t.copyCode}
                    >
                      {copiedMessageId === `code-${previewCodeIndex}` ? (
                        <Check className="h-3.5 w-3.5 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4 hover:opacity-50" />
                      )}
                    </button>
                  </div>
                  <div className={`max-h-[calc(70vh-100px)] overflow-auto bg-background p-5 ${isRTL ? 'text-right' : ''}`}>
                    <pre className={`text-xs font-mono whitespace-pre-wrap overflow-x-scroll break-words ${isRTL ? 'direction-ltr' : ''}`} dir="ltr">
                      {code}
                    </pre>
                  </div>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </AppSidebarLayout>
  )
}
