import { useState, useCallback, memo, useMemo, useEffect } from "react"
import { Head, Link } from "@inertiajs/react"
import { router } from "@inertiajs/react"
import AppSidebarLayout from "@/layouts/app/app-sidebar-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FileText,
  Play,
  Filter,
  Plus,
  Search,
  Trash2,
  Edit,
  List,
  Grid,
  GraduationCap,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Conversation, Question, Quiz } from "@/types"
import { toast } from 'react-hot-toast'
import { useLanguage } from '@/contexts/LanguageContext'
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination"

interface Props {
  quizzes: Quiz[]
  questions: Question[]
  conversations: Conversation[]
}

const EditQuizForm = memo(({ 
  title, 
  description, 
  onTitleChange, 
  onDescriptionChange,
  t,
  isRTL
}: { 
  title: string
  description: string
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  t: any
  isRTL?: boolean
}) => (
  <div className="grid gap-4 py-4">
    <div className={`grid grid-cols-4 items-center gap-4 ${isRTL ? 'text-right' : ''}`}>
      <Label htmlFor="edit-title" className={`${isRTL ? 'text-right col-start-4 col-end-5' : 'text-right'}`}>
        {t.title}
      </Label>
      <Input
        id="edit-title"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className={`${isRTL ? 'col-start-1 col-end-4 text-right' : 'col-span-3'}`}
      />
    </div>
    <div className={`grid grid-cols-4 items-center gap-4 ${isRTL ? 'text-right' : ''}`}>
      <Label htmlFor="edit-description" className={`${isRTL ? 'text-right col-start-4 col-end-5' : 'text-right'}`}>
        {t.description}
      </Label>
      <Textarea
        id="edit-description"
        value={description}
        maxLength={225}
        onChange={(e) => onDescriptionChange(e.target.value)}
        className={`${isRTL ? 'col-start-1 col-end-4 text-right' : 'col-span-3'} resize-none`}
      />
    </div>
  </div>
))

EditQuizForm.displayName = 'EditQuizForm'

export default function Quizzes({ quizzes, questions, conversations }: Props) {
  const { t, language } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [quizToEdit, setQuizToEdit] = useState<Quiz | null>(null)
  const isRTL = language === 'ar'
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(9) // Default for grid view
  const [totalPages, setTotalPages] = useState(1)

  const questionsByQuiz = questions.reduce(
    (acc, question) => {
      if (!acc[question.quiz_id]) {
        acc[question.quiz_id] = []
      }
      acc[question.quiz_id].push(question)
      return acc
    },
    {} as Record<number, Question[]>
  )

  const quizzesWithCount = quizzes.map((quiz) => ({
    ...quiz,
    questions_count: questionsByQuiz[quiz.id]?.length || 0,
    difficulty: quiz.difficulty || "medium",
    settings: {
      time_limit: quiz.settings?.time_limit || null,
      question_count: quiz.settings?.question_count || 0,
      enable_timer: quiz.settings?.enable_timer || false,
      layout: quiz.settings?.layout || 'ltr',
      language: quiz.settings?.language || 'en'
    },
    attempts: quiz.attempts || []
  }))

  const filteredQuizzes = useMemo(() => {
    return quizzesWithCount.filter((quiz) => {
      const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesDifficulty = difficultyFilter === "all" || quiz.difficulty === difficultyFilter
      return matchesSearch && matchesDifficulty
    })
  }, [quizzesWithCount, searchQuery, difficultyFilter])

  useEffect(() => {
    const newTotalPages = Math.max(1, Math.ceil(filteredQuizzes.length / itemsPerPage))
    setTotalPages(newTotalPages)
    
    // Reset to page 1 if current page becomes invalid
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(1)
    }
  }, [filteredQuizzes, itemsPerPage])

  useEffect(() => {
    // Recalculate total pages whenever filtered quizzes or items per page change
    const newTotalPages = Math.max(1, Math.ceil(filteredQuizzes.length / itemsPerPage));
    setTotalPages(newTotalPages);

    // Reset to page 1 if the current page exceeds the new total pages
    if (currentPage > newTotalPages) {
      setCurrentPage(1);
    }
  }, [filteredQuizzes, itemsPerPage]);

  const paginatedQuizzes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    
    return filteredQuizzes.slice(startIndex, endIndex)
  }, [filteredQuizzes, currentPage, itemsPerPage])

  useEffect(() => {
    setItemsPerPage(viewMode === "grid" ? 9 : 10) // More items in list view
  }, [viewMode])

  const handlePageChange = (page: number) => {
    // Ensure the page is within valid bounds
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);

      // Scroll to the top of the quiz list for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5; // Maximum number of visible page links

    // Always show the first page
    items.push(
      <PaginationItem key="page-1">
        <PaginationLink
          isActive={currentPage === 1}
          onClick={() => handlePageChange(1)}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Calculate the range of pages to display
    let startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 2);

    // Adjust the range if near the end
    if (endPage - startPage < maxVisiblePages - 2) {
      startPage = Math.max(2, endPage - (maxVisiblePages - 2));
    }

    // Add ellipsis if there are hidden pages before the start
    if (startPage > 2) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Add the range of pages
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={`page-${i}`}>
          <PaginationLink
            isActive={currentPage === i}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Add ellipsis if there are hidden pages after the end
    if (endPage < totalPages - 1) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Always show the last page if there are multiple pages
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={`page-${totalPages}`}>
          <PaginationLink
            isActive={currentPage === totalPages}
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  const handleStartQuiz = (quiz: Quiz) => {
    router.visit(route('quizzes.take', quiz.id))
  }

  const handleCreateQuiz = () => {
    router.visit('/quizzes/create')
  }

  const handleEditQuiz = (quiz: Quiz) => {
    setQuizToEdit(quiz)
    setEditTitle(quiz.title)
    setEditDescription(quiz.description || "")
    setEditDialogOpen(true)
  }

  const handleTitleChange = useCallback((value: string) => {
    setEditTitle(value)
  }, [])

  const handleDescriptionChange = useCallback((value: string) => {
    setEditDescription(value)
  }, [])

  const handleUpdateQuiz = () => {
    if (!quizToEdit) return

    router.put(
      route("quizzes.update", { id: quizToEdit.id }),
      {
        title: editTitle,
        description: editDescription,
      },
      {
        onSuccess: () => {
          setEditDialogOpen(false)
          router.reload()
        },
      }
    )
  }

  const handleDeleteQuiz = (quiz: Quiz) => {
    setQuizToDelete(quiz)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteQuiz = () => {
    if (quizToDelete) {
      router.delete(route("quizzes.destroy", { id: quizToDelete.id }), {
        onSuccess: () => {
          setDeleteDialogOpen(false)
          setQuizToDelete(null)
        },
      })
    }
  }

  const formatTimeLimit = (seconds: number | null) => {
    if (!seconds) return t.noLimit
    const minutes = Math.floor(seconds / 60)
    return `${minutes} ${t.minutes}`
  }

  const getDifficultyIcon = (difficulty?: string) => {
    switch (difficulty) {
      case "easy":
        return <GraduationCap className="h-4 w-4 text-green-500" />
      case "medium":
        return <GraduationCap className="h-4 w-4" />
      case "hard":
        return <GraduationCap className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getDifficultyBadgeVariant = (difficulty?: string) => {
    switch (difficulty) {
      case "easy":
        return "success"
      case "medium":
        return "secondary"
      case "hard":
        return "danger"
      default:
        return "secondary"
    } 
  }

  const getDifficultyTranslated = (difficulty?: string) => {
    switch (difficulty) {
      case "easy":
        return t.easy
      case "medium":
        return t.medium
      case "hard":
        return t.hard
      default:
        return difficulty
    }
  }

  const handleTakeQuiz = async (quizId: number) => {
    try {
      router.visit(route('quizzes.take', quizId))
    } catch (error) {
      toast.error(t.tryAgain)
    }
  }

  const breadcrumbs = [
    { title: "VisionAI", href: "/chat" },
    { title: t.quizzes, href: "/quizzes" },
  ]

  return (
    <AppSidebarLayout breadcrumbs={breadcrumbs} >
      <Head title={t.quizzes} />

      <div className={`container mx-auto p-6 ${isRTL ? 'rtl-layout' : ''}`} style={isRTL ? {direction: 'rtl'} : {}}>
        <div className="flex flex-col gap-6">
          <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isRTL ? '' : ''}`}>
            <div className={isRTL ? 'text-right w-full' : ''}>
              <h1 className="text-2xl font-bold">{t.yourQuizzes}</h1>
              <p className="text-muted-foreground">{t.manageQuizzes}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateQuiz} className={`gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Plus className="h-4 w-4" />
                {t.createQuiz}
              </Button>
            </div>
          </div>

          <div className={`flex flex-col md:flex-row gap-4 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
            <div className="relative flex-1">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground`} />
              <Input
                placeholder={`${t.search} ${t.quizzes.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={isRTL ? 'pr-10 text-right' : 'pl-10'}
              />
            </div>
            <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="flex border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  className={viewMode === "grid" ? "bg-muted" : ""}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={viewMode === "list" ? "bg-muted" : ""}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-[180px]">
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder={`${t.filterBy} ${t.difficulty.toLowerCase()}`} />
                  </div>
                </SelectTrigger>
                <SelectContent className={isRTL ? 'text-right' : ''}>
                  <SelectItem value="all">{t.allDifficulties}</SelectItem>
                  <SelectItem value="easy">{t.easy}</SelectItem>
                  <SelectItem value="medium">{t.medium}</SelectItem>
                  <SelectItem value="hard">{t.hard}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedQuizzes.map((quiz) => (
                <Card key={quiz.id} className={`flex flex-col ${isRTL ? 'text-right' : ''}`}>
                  <CardHeader>
                    <CardTitle className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span>{quiz.title}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditQuiz(quiz)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                    <CardDescription className={isRTL ? 'text-right' : ''}>{quiz.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="space-y-4">
                      <div className={`flex items-center gap-2 text-sm ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                        <FileText className="h-4 w-4" />
                        <span>{quiz.questions_count} {t.questionCount.toLowerCase()}</span>
                      </div>
                      <div className={`flex items-center gap-2 text-sm ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                        {getDifficultyIcon(quiz.difficulty)}
                        <span className="capitalize">{getDifficultyTranslated(quiz.difficulty)} {t.difficulty.toLowerCase()}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartQuiz(quiz)}
                        className={`w-full ${isRTL ? 'flex-row-reverse' : ''}`}
                      >
                        <Play className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                        {t.startQuiz}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full"
                      >
                        <Link href={`/quizzes/${quiz.id}/submissions`} className={isRTL ? 'flex flex-row-reverse items-center justify-center' : ''}>
                          <FileText className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                          {t.submissions}
                        </Link>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <div className={`grid grid-cols-12 gap-4 p-4 font-medium border-b ${isRTL ? 'text-right dir-rtl' : ''}`}>
                <div className={`col-span-5 ${isRTL ? 'order-1' : ''}`}>{t.title}</div>
                <div className={`col-span-2 text-center ${isRTL ? 'order-2' : ''}`}>{t.questionCount}</div>
                <div className={`col-span-2 text-center ${isRTL ? 'order-3' : ''}`}>{t.timeLimit}</div>
                <div className={`col-span-2 ${isRTL ? 'text-left order-4' : 'text-right'}`}>{t.actions}</div>
              </div>
              {paginatedQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className={`grid grid-cols-12 gap-4 p-4 border-b hover:bg-muted/50 ${isRTL ? 'text-right dir-rtl' : ''}`}
                >
                  <div className={`col-span-5 font-medium flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end order-1' : ''}`}>
                    {getDifficultyIcon(quiz.difficulty)}
                    {quiz.title}
                  </div>
                  <div className={`col-span-2 text-center ${isRTL ? 'order-2' : ''}`}>{quiz.questions_count}</div>
                  <div className={`col-span-2 text-center ${isRTL ? 'order-3' : ''}`}>{formatTimeLimit(quiz.settings?.time_limit)}</div>
                  <div className={`col-span-2 flex ${isRTL ? 'justify-start order-4' : 'justify-end'} gap-2`}>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditQuiz(quiz)}
                        className={`gap-2 ${isRTL ? 'mr-auto' : 'ml-auto'}`}
                      >
                        <Edit className="h-3 w-3" />
                        {t.edit}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Delete Quiz Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent className={isRTL ? 'rtl' : ''}>
              <AlertDialogHeader>
                <AlertDialogTitle className={isRTL ? 'text-right' : ''}>{t.deleteQuiz}</AlertDialogTitle>
                <AlertDialogDescription className={isRTL ? 'text-right' : ''}>
                  {t.confirmDelete}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className={isRTL ? 'flex-row-reverse' : ''}>
                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDeleteQuiz}
                  className="bg-destructive text-white dark:text-white hover:bg-destructive/90"
                >
                  {t.delete}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Edit Quiz Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className={isRTL ? 'rtl' : ''}>
              <DialogHeader>
                <DialogTitle className={isRTL ? 'text-right' : ''}>{t.editQuiz}</DialogTitle>
                <DialogDescription className={isRTL ? 'text-right' : ''}>{t.editQuizDescription}</DialogDescription>
              </DialogHeader>
              <EditQuizForm 
                title={editTitle}
                description={editDescription}
                onTitleChange={handleTitleChange}
                onDescriptionChange={handleDescriptionChange}
                t={t}
                isRTL={isRTL}
              />
              <DialogFooter className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Button 
                  variant="outline" 
                  className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    setEditDialogOpen(false)
                    if (quizToEdit) {
                      handleDeleteQuiz(quizToEdit)
                    }
                  }}
                >
                  <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t.deleteQuiz}
                </Button>
                <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    {t.cancel}
                  </Button>
                  <Button onClick={handleUpdateQuiz}>{t.save}</Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add pagination at the bottom */}
          {filteredQuizzes.length > 0 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent className={isRTL ? 'flex-row-reverse' : ''}>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={`cursor-pointer ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      aria-disabled={currentPage === 1}
                    >
                      {t.previous} {/* Use the translated word for "Previous" */}
                    </PaginationPrevious>
                  </PaginationItem>
                  
                  {renderPaginationItems()}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={`cursor-pointer ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                      aria-disabled={currentPage === totalPages}
                      content="d"
                    >
                      {t.next} {/* Use the translated word for "Next" */}
                    </PaginationNext>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              
              <div className="text-center text-sm text-muted-foreground mt-2">
                {t.showing} {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, filteredQuizzes.length)} {t.of} {filteredQuizzes.length} {t.quizzes.toLowerCase()}
              </div>
            </div>
          )}

          {filteredQuizzes.length === 0 && (
            <div className="text-center p-12 border rounded-lg bg-muted/10">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-4" />
              <h3 className="text-lg font-medium mb-2">{t.noQuizzesFound}</h3>
              <p className="text-muted-foreground">{t.tryDifferentSearch}</p>
            </div>
          )}
        </div>
      </div>
    </AppSidebarLayout>
  )
}