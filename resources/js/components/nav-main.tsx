import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
  } from "@/components/ui/sidebar"
  import type { Conversation } from "@/types"
  import { Link, usePage } from "@inertiajs/react"
  import { format, isToday, isYesterday, subDays, parseISO } from "date-fns"
  import { Button } from "@/components/ui/button"
  import { MoreHorizontal, Pencil, Share2, Trash2, Copy, Check, Loader2 } from "lucide-react"
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
  } from "@/components/ui/dialog"
  import { Input } from "@/components/ui/input"
  import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { Switch } from "@/components/ui/switch"
import { useLanguage } from "@/contexts/LanguageContext"
import { Label } from "@/components/ui/label"
  
  interface NavMainProps {
    conversations?: Conversation[]
  }
  
  export function NavMain({ conversations: initialConversations = [] }: NavMainProps) {
    const page = usePage()
    const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editTitle, setEditTitle] = useState("")
    const [shareModalOpen, setShareModalOpen] = useState(false)
    const [shareUrl, setShareUrl] = useState("")
    const [copied, setCopied] = useState(false)
    const [renameModalOpen, setRenameModalOpen] = useState(false)
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const { t, language } = useLanguage()
    const [isPublic, setIsPublic] = useState(false)
    const [isTogglingVisibility, setIsTogglingVisibility] = useState(false)
    const isRTL = language === 'ar'

    
    useEffect(() => {
      setConversations(initialConversations)
    }, [initialConversations])
    if(!conversations) return null;
    const todayConversations = conversations.filter((conv) => isToday(parseISO(conv.updated_at)))
  
    const yesterdayConversations = conversations.filter((conv) => isYesterday(parseISO(conv.updated_at)))
  
    const last7DaysConversations = conversations.filter((conv) => {
      const date = parseISO(conv.updated_at)
      const sevenDaysAgo = subDays(new Date(), 7)
      return !isToday(date) && !isYesterday(date) && date > sevenDaysAgo
    })
  
    const last30DaysConversations = conversations.filter((conv) => {
      const date = parseISO(conv.updated_at)
      const thirtyDaysAgo = subDays(new Date(), 30)
      const sevenDaysAgo = subDays(new Date(), 7)
      return date <= sevenDaysAgo && date > thirtyDaysAgo
    })
  
    const olderConversations = conversations.filter((conv) => {
      const date = parseISO(conv.updated_at)
      const thirtyDaysAgo = subDays(new Date(), 30)
      return date <= thirtyDaysAgo
    })

    const handleRename = (conversation: Conversation) => {
      setSelectedConversation(conversation)
      setEditTitle(conversation.title || "New Conversation")
      setRenameModalOpen(true)
    }

    const handleSaveRename = async () => {
      if (!selectedConversation || !editTitle.trim()) return
      
      try {
        const response = await fetch(`/api/conversations/${selectedConversation.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
          },
          body: JSON.stringify({ title: editTitle.trim() })
        })

        if (response.ok) {
          setConversations(prevConversations =>
            prevConversations.map(conv =>
              conv.id === selectedConversation.id
                ? { ...conv, title: editTitle.trim() }
                : conv
            )
          )
          setRenameModalOpen(false)
          setSelectedConversation(null)
          setEditTitle("")
        } else {
            toast.error('Failed to rename conversation')
        }
      } catch (error) {
        toast.error('Error renaming conversation')
      }
    }

    const handleDelete = async () => {
      if (!selectedConversation) return
      
      try {
        const response = await fetch(`/api/conversations/${selectedConversation.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
          }
        })

        if (response.ok) {
          setConversations(prevConversations =>
            prevConversations.filter(conv => conv.id !== selectedConversation.id)
          )
          setDeleteModalOpen(false)
          setSelectedConversation(null)
        } else {
          toast.error('Failed to delete conversation')
        }
      } catch (error) {
        toast.error('Error deleting conversation')
      }
    }

    const handleShare = (conversation: Conversation) => {
      const url = `${window.location.origin}/chat/c/${conversation.id}`
      setShareUrl(url)
      setIsPublic(conversation.is_public || false)
      setSelectedConversation(conversation)
      setShareModalOpen(true)
    }

    const handleCopyLink = async () => {
      try {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        toast.error('Error copying to clipboard')
      }
    }

    const toggleVisibility = async () => {
      if (!selectedConversation) return;
      
      setIsTogglingVisibility(true);
      
      try {
        const newValue = !isPublic;
        const response = await fetch(`/api/conversations/${selectedConversation.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
          },
          body: JSON.stringify({ is_public: newValue })
        });
        
        if (response.ok) {
          const data = await response.json();
          
          setIsPublic(newValue);
          setConversations(prevConversations =>
            prevConversations.map(conv =>
              conv.id === selectedConversation.id
                ? { ...conv, is_public: newValue }
                : conv
            )
          );
          
          toast.success(newValue ? t.madePublic : t.madePrivate);
        } else {
          const errorData = await response.text();
          console.error('Error response:', errorData);
          toast.error(t.visibilityChangeError);
        }
      } catch (error) {
        console.error('Exception:', error);
        toast.error(t.error);
      } finally {
        setIsTogglingVisibility(false);
      }
    };

    const renderConversationItem = (conversation: Conversation) => (
      <SidebarMenuItem key={conversation.id}>
        <div className="flex items-center justify-between w-full group">
          <SidebarMenuButton asChild className="flex-1">
            <Link href={`/chat/${conversation.id}`} className={`flex flex-col items-start py-2 ${isRTL ? 'text-right' : ''}`}>
              <span className="font-medium text-sm text-muted-foreground">{conversation.title || "New Conversation"}</span>
              <span className="text-xs text-muted-foreground/70 truncate">
                {format(parseISO(conversation.updated_at), "h:mm a")}
              </span>
            </Link>
          </SidebarMenuButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.preventDefault()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? "start" : "end"}>
              <DropdownMenuItem onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleRename(conversation)
              }} className={isRTL ? 'flex-row-reverse' : ''}>
                <Pencil className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t.rename}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleShare(conversation)
              }} className={isRTL ? 'flex-row-reverse' : ''}>
                <Share2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t.share}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setSelectedConversation(conversation)
                  setDeleteModalOpen(true)
                }}
                className={`text-destructive ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarMenuItem>
    )
  
    return (
      <>
        {todayConversations.length > 0 && (
          <SidebarGroup className="px-2 py-0 pt-4">
            <SidebarGroupLabel className={isRTL ? 'text-right' : ''}>{t.recentConversations}</SidebarGroupLabel>
            <SidebarMenu>
              {todayConversations.map(renderConversationItem)}
            </SidebarMenu>
          </SidebarGroup>
        )}
  
        {yesterdayConversations.length > 0 && (
          <SidebarGroup className="px-2 py-0 pt-4">
            <SidebarGroupLabel className={isRTL ? 'text-right' : ''}>{t.yesterday}</SidebarGroupLabel>
            <SidebarMenu>
              {yesterdayConversations.map(renderConversationItem)}
            </SidebarMenu>
          </SidebarGroup>
        )}
  
        {last7DaysConversations.length > 0 && (
          <SidebarGroup className="px-2 py-0 pt-4">
            <SidebarGroupLabel className={isRTL ? 'text-right' : ''}>{t.last7Days}</SidebarGroupLabel>
            <SidebarMenu>
              {last7DaysConversations.map(renderConversationItem)}
            </SidebarMenu>
          </SidebarGroup>
        )}
  
        {last30DaysConversations.length > 0 && (
          <SidebarGroup className="px-2 py-0 pt-4">
            <SidebarGroupLabel className={isRTL ? 'text-right' : ''}>{t.last30Days}</SidebarGroupLabel>
            <SidebarMenu>
              {last30DaysConversations.map(renderConversationItem)}
            </SidebarMenu>
          </SidebarGroup>
        )}
  
        {olderConversations.length > 0 && (
          <SidebarGroup className="px-2 py-0 pt-4">
            <SidebarGroupLabel className={isRTL ? 'text-right' : ''}>{t.older}</SidebarGroupLabel>
            <SidebarMenu>
              {olderConversations.map(renderConversationItem)}
            </SidebarMenu>
          </SidebarGroup>
        )}
  
        {conversations.length === 0 && (
          <div className={`px-4 py-8 text-center text-sm text-muted-foreground ${isRTL ? 'text-right' : ''}`}>{t.noConversationsYet}</div>
        )}

        <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
          <DialogContent className={isRTL ? 'rtl' : ''}>
            <DialogHeader>
              <DialogTitle className={isRTL ? 'text-right' : ''}>{t.shareConversation}</DialogTitle>
            </DialogHeader>
            
            <div className={`flex items-center py-2 ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-2'}`}>
              <Switch
                id="public-mode"
                checked={isPublic}
                onCheckedChange={toggleVisibility}
                disabled={isTogglingVisibility}
              />
              <Label htmlFor="public-mode" className={`cursor-pointer flex items-center ${isRTL ? 'mr-2' : 'ml-2'}`}>
                {t.makePublic}
                {isTogglingVisibility && (
                  <div className={`animate-spin h-4 w-4 ${isRTL ? 'mr-2' : 'ml-2'}`}>
                    <Loader2 className="h-4 w-4" />
                  </div>
                )}
              </Label>
            </div>
            
            {isPublic ? (
              <div className="space-y-2">
                <p className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : ''}`}>{t.publicConversationNote}</p>
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-2'}`}>
                  <div className="grid flex-1 gap-2">
                    <div className={`bg-muted p-2 rounded-md text-sm break-all ${isRTL ? 'text-right' : ''}`}>
                      {shareUrl}
                    </div>
                  </div>
                  <Button size="icon" onClick={handleCopyLink}>
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <p className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : ''}`}>{t.privateConversationNote}</p>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={renameModalOpen} onOpenChange={setRenameModalOpen}>
          <DialogContent className={isRTL ? 'rtl' : ''}>
            <DialogHeader>
              <DialogTitle className={isRTL ? 'text-right' : ''}>{t.renameConversation}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder={t.enterConversationName}
                className={`w-full ${isRTL ? 'text-right' : ''}`}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSaveRename()
                  }
                }}
              />
            </div>
            <DialogFooter className={isRTL ? 'flex-row-reverse' : ''}>
              <Button variant="outline" onClick={() => setRenameModalOpen(false)}>
                {t.cancel}
              </Button>
              <Button onClick={handleSaveRename}>
                {t.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent className={isRTL ? 'rtl' : ''}>
            <DialogHeader>
              <DialogTitle className={isRTL ? 'text-right' : ''}>{t.deleteConversation}</DialogTitle>
              <DialogDescription className={isRTL ? 'text-right' : ''}>
                {t.deleteConversationConfirm}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className={isRTL ? 'flex-row-reverse' : ''}>
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                {t.cancel}
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                {t.delete}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }
  
  