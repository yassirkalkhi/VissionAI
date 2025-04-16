"use client"

import { useState, useCallback, memo } from "react"
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

interface Props {
  quizzes: Quiz[]
  questions: Question[]
  conversations: Conversation[]
}

const EditQuizForm = memo(({ 
  title, 
  description, 
  onTitleChange, 
  onDescriptionChange 
}: { 
  title: string
  description: string
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
}) => (
  <div className="grid gap-4 py-4">
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="edit-title" className="text-right">
        Title
      </Label>
      <Input
        id="edit-title"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="col-span-3"
      />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="edit-description" className="text-right">
        Description
      </Label>
      <Textarea
        id="edit-description"
        value={description}
        maxLength={225}
        onChange={(e) => onDescriptionChange(e.target.value)}
        className="col-span-3 resize-none"
      />
    </div>
  </div>
))

EditQuizForm.displayName = 'EditQuizForm'

export default function Quizzes({ quizzes, questions, conversations }: Props) {
  const [searchQuery, setSearchQuery] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [quizToEdit, setQuizToEdit] = useState<Quiz | null>(null)
  const [expandedQuizzes, setExpandedQuizzes] = useState<Record<number, boolean>>({})

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
      shuffle_questions: quiz.settings?.shuffle_questions || false,
      show_correct_answers: quiz.settings?.show_correct_answers || true,
      allow_retake: quiz.settings?.allow_retake || true,
      question_count: quiz.settings?.question_count || 0,
      is_friendly_quiz: quiz.settings?.is_friendly_quiz || false,
      enable_timer: quiz.settings?.enable_timer || false,
    },
    attempts: quiz.attempts || []
  }))

  const filteredQuizzes = quizzesWithCount.filter((quiz) => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDifficulty = difficultyFilter === "all" || quiz.difficulty === difficultyFilter
    return matchesSearch && matchesDifficulty
  })

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
    if (!seconds) return "No limit"
    const minutes = Math.floor(seconds / 60)
    return `${minutes} min`
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

  const handleTakeQuiz = async (quizId: number) => {
    try {
      router.visit(route('quizzes.take', quizId))
    } catch (error) {
      toast.error('Failed to start quiz. Please try again.')
    }
  }

  const breadcrumbs = [
    { title: "VisionAI", href: "/chat" },
    { title: "Quizzes", href: "/quizzes" },
  ]

  return (
    <AppSidebarLayout breadcrumbs={breadcrumbs} conversations={conversations}>
      <Head title="Quizzes" />

      <div className="container mx-auto p-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Your Quizzes</h1>
              <p className="text-muted-foreground">Manage and take your quizzes</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateQuiz} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Quiz
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search quizzes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Filter by difficulty" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
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
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuizzes.map((quiz) => (
                <Card key={quiz.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
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
                    <CardDescription>{quiz.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4" />
                        <span>{quiz.questions_count} questions</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {getDifficultyIcon(quiz.difficulty)}
                        <span className="capitalize">{quiz.difficulty} difficulty</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartQuiz(quiz)}
                        className="w-full"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Take Quiz
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full"
                      >
                        <Link href={`/quizzes/${quiz.id}/submissions`}>
                          <FileText className="h-4 w-4 mr-1" />
                          Submissions
                        </Link>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b">
                <div className="col-span-5">Title</div>
                <div className="col-span-2 text-center">Questions</div>
                <div className="col-span-2 text-center">Time Limit</div>
                <div className="col-span-1 text-center">Difficulty</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              {filteredQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-muted/50"
                >
                  <div className="col-span-5 font-medium flex items-center gap-2">
                    {getDifficultyIcon(quiz.difficulty)}
                    {quiz.title}
                  </div>
                  <div className="col-span-2 text-center">{quiz.questions_count}</div>
                  <div className="col-span-2 text-center">{formatTimeLimit(quiz.settings?.time_limit)}</div>
                  <div className="col-span-1 text-center">
                    <Badge variant={getDifficultyBadgeVariant(quiz.difficulty)} className="whitespace-nowrap">
                      {quiz.difficulty ? quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1) : "N/A"}
                    </Badge>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditQuiz(quiz)}
                        className="gap-2 ml-auto"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Delete Quiz Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the quiz "{quizToDelete?.title}" and all its questions. This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDeleteQuiz}
                  className="bg-destructive text-white dark:text-white hover:bg-destructive/90"
                >
                  Delete Quiz
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Edit Quiz Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Quiz</DialogTitle>
                <DialogDescription>Make changes to your quiz settings here.</DialogDescription>
              </DialogHeader>
              <EditQuizForm 
                title={editTitle}
                description={editDescription}
                onTitleChange={handleTitleChange}
                onDescriptionChange={handleDescriptionChange}
              />
              <DialogFooter className="flex justify-between">
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
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Quiz
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateQuiz}>Save Changes</Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AppSidebarLayout>
  )
}