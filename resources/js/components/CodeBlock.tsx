import { useState } from "react"
import { Copy, Check, ChevronDown, ChevronUp, Code } from "lucide-react"
import { cn } from "@/lib/utils"

interface CodeBlockProps {
  code: string
  language: string
  icon?: React.ReactNode
}

export function CodeBlock({ code, language, icon }: CodeBlockProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const trimmedCode = code.trim()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(trimmedCode)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = trimmedCode
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
      document.body.removeChild(textArea)
    }
  }

  return (
    <div className="my-4 rounded-md border border-border bg-muted/20">
      <div className="flex items-center justify-between bg-muted/40 px-3 py-1.5 border-b border-border">
        <div className="flex items-center gap-1.5">
          {icon || <Code className="h-3 w-3" />}
          <span className="text-[0.7rem] font-medium">{language}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="text-xs flex items-center gap-1 hover:text-foreground transition-colors"
            title="Copy code"
          >
            {isCopied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-xs flex items-center gap-1 hover:text-foreground transition-colors"
            title={isCollapsed ? "Expand code" : "Collapse code"}
          >
            {isCollapsed ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      <div 
        className={cn(
          "transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden",
          isCollapsed ? "max-h-0 opacity-0" : "opacity-100"
        )}
      >
        <div className="p-4">
          <pre className="text-sm font-mono whitespace-pre-wrap break-words overflow-x-auto">
            {trimmedCode}</pre>
        </div>
      </div>
    </div>
  )
} 











