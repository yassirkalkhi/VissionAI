import React, { useState, useEffect } from "react";
import { Head, usePage } from "@inertiajs/react";
import AppSidebarLayout from "@/layouts/app/app-sidebar-layout";
import { Message, Conversation } from "@/types";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { EyeIcon, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { CodeBlock } from "@/components/CodeBlock";

interface Props {
  conversation: {
    id: number;
    title: string;
  };
  messages: Message[];
}

export default function PublicConversation({ conversation, messages }: Props) {
  const { t, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  
  const breadcrumbs = [
    { title: "VisionAI", href: "/chat" },
    { title: conversation.title, href: `/chat/c/${conversation.id}` },
  ];

  const isRTL = language === 'ar';

  // Format code blocks - similar to the function in chat.tsx
  const formatCodeBlocks = (text: string) => {
    const parts = text.split(/(```[\s\S]*?)(?:```|$)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const match = part.match(/```(\w*)\n?([\s\S]*?)(?:```|$)/);
        if (match) {
          const [_, lang, code] = match;
          const language = lang.trim() || 'code';
          return (
            <CodeBlock
              key={`code-${index}-${Date.now()}`}
              code={code}
              language={language}
            />
          );
        }
      }

      // Process regular text with proper spacing
      const textContent = part.trim();
      if (!textContent) return null;

      return (
        <div key={index} className="prose dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
              code: ({ children }) => (
                <code className="bg-muted/20 px-1 py-0.5 rounded text-sm">{children}</code>
              ),
              pre: ({ children }) => <pre className="overflow-x-auto">{children}</pre>,
              ul: ({ children }) => <ul className="list-disc mb-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal mb-2">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              h1: ({ children }) => <h1 className="text-2xl font-bold mb-1 mt-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xl font-bold mb-1 mt-2">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg font-bold mb-1 mt-2">{children}</h3>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-border italic my-4">{children}</blockquote>
              ),
            }}
          >
            {textContent}
          </ReactMarkdown>
        </div>
      );
    }).filter(Boolean);
  };

  const SimpleMarkdown = ({ content, isUserMessage = false }: { content: string; isUserMessage?: boolean }) => {
    if (!content) return null;

    return (
      <div className={cn("space-y-4", isUserMessage ? "whitespace-pre-wrap" : "")}>
        {formatCodeBlocks(content)}
      </div>
    );
  };

  return (
    <AppSidebarLayout breadcrumbs={breadcrumbs}>
      <Head title={conversation.title || "View Conversation"} />
      
      <div className="flex h-[calc(100vh-8rem)] flex-col">
    
        
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-3xl mx-auto space-y-5">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <div key={message.id} className="flex items-start mt-10 group">
                    <div className="flex-shrink-0">
                      {message.role === "user" ? (
                        <div className="h-8 w-8 overflow-hidden rounded-md bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-medium">U</span>
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-md bg-linear-150 from-[#00bba2] to-pink-300 text-primary-foreground flex items-center justify-center text-xs font-medium">
                          A
                        </div>
                      )}
                    </div>

                    <div className="flex-1 ml-3">
                      <div className="rounded-lg p-3 relative text-sm">
                        <div className="whitespace-pre-wrap">
                          {message.role === "assistant" ? (
                            <SimpleMarkdown content={message.content} />
                          ) : (
                            <SimpleMarkdown content={message.content} isUserMessage={true} />
                          )}
                        </div>
                      </div>

                      {message.role === "user" && message.attachments && message.attachments.length > 0 && (
                        <div className={`flex flex-wrap gap-2 mt-2 overflow-x-auto pb-2 ${isRTL ? 'justify-end mr-4' : 'ms-4'}`}>
                          {message.attachments?.map((_, i) => (
                            <button
                              key={`img-${i}`}
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
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">{t.noConversationFound}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppSidebarLayout>
  );
} 