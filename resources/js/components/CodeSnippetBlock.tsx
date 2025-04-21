import { useState } from "react"
import { X, Copy, Check } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface CodeSnippetBlockProps {
  code: string
  index: number
  onRemove: (index: number) => void
}

const calculateSizeInKB = (text: string): number => {
  const bytes = new TextEncoder().encode(text).length
  return Math.round((bytes / 1024) * 10) / 10
}

const countLines = (text: string): number => {
  return text.split("\n").length
}

export function CodeSnippetBlock({ code, index, onRemove }: CodeSnippetBlockProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const extension = "txt"

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy code:", error)
    }
  }

  return (
    <>
      <div className="flex-shrink-0 w-48 h-16 flex flex-col bg-muted/30 rounded-md border border-border overflow-hidden hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between bg-muted/50 px-2 py-1 border-b border-border">
          <div className="flex items-center flex-1 gap-1 select-none">
            <span className="text-[0.7rem] font-medium truncate">
              file{index + 1}.{extension}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-xs text-muted-foreground hover:text-foreground ml-1"
            title="Remove code snippet"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
        <div
          className="flex-1 p-1 overflow-hidden cursor-pointer"
          onClick={() => setIsPreviewOpen(true)}
        >
          <pre className="text-[0.2rem] pt-1 text-muted-foreground">
            {code.substring(0, 100)}
          </pre>
        </div>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl w-full p-4 overflow-hidden">
          <div className="relative w-full">
            <div className="flex items-center mb-3 px-1">
              <h3 className="text-xs font-medium flex items-center gap-2">
                <span>file{index + 1}.{extension}</span>
              </h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground pl-4">
                <span>{calculateSizeInKB(code)} KB</span>
                <span>•</span>
                <span>{countLines(code)} lines</span>
                <span>•</span>
                <span>{code.length} chars</span>
              </div>
            </div>
            <div className="rounded-md border border-border overflow-hidden">
              <div className="bg-muted/50 px-3 py-2 border-b border-border flex items-center justify-between">
                <div className="flex items-center text-xs">
                  <span className="text-[0.6rem] font-medium ml-2">Code</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCode}
                  className="h-6 text-xs flex items-center gap-1 hover:text-foreground transition-colors"
                  title="Copy code"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4 hover:opacity-50" />
                  )}
                </Button>
              </div>
              <div className="max-h-[calc(70vh-100px)] overflow-auto bg-background p-5">
                <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-scroll break-words">
                  {code}
                </pre>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 