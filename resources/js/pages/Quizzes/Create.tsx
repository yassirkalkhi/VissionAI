"use client"

import { useState, useCallback } from "react"
import { Head, router } from "@inertiajs/react"
import { useDropzone } from "react-dropzone"
import AppSidebarLayout from "@/layouts/app/app-sidebar-layout"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Upload, FileText, Image, X } from "lucide-react"
import { Conversation } from "@/types"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Tesseract from 'tesseract.js'
import axios from "axios"
import { route } from "ziggy-js"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'
import { extractTextFromPDF } from '@/lib/pdf-extractor'
import { extractTextFromDocx } from '@/lib/docx-extractor'
import { GlobalWorkerOptions } from 'pdfjs-dist/build/pdf'
import toast from 'react-hot-toast'

interface Props {
  conversations: Conversation[]
}

interface TimePerQuestion {
  easy: number
  medium: number
  hard: number
}

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString()

export default function CreateQuiz({ conversations }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [questionCount, setQuestionCount] = useState(10)
  const [difficulty, setDifficulty] = useState("medium")
  const [extractedText, setExtractedText] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [enableTimer, setEnableTimer] = useState(true)
  const [timePerQuestion, setTimePerQuestion] = useState<TimePerQuestion>({
    easy: 60,
    medium: 120,
    hard: 180
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewText, setPreviewText] = useState<string>('')
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [pendingText, setPendingText] = useState<string>('')

  const processPDF = async (file: File): Promise<string> => {
    try {
      return await extractTextFromPDF(file)
    } catch (error) {
      throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const processImage = async (file: File): Promise<string> => {
    try {
      const worker = await Tesseract.createWorker('eng')
      const { data: { text } } = await worker.recognize(file)
      await worker.terminate()
      
      if (!text.trim()) {
        throw new Error('No text could be extracted from image')
      }
      
      return text
    } catch (error) {
      throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleConfirmFile = () => {
    if (pendingText && currentFile) {
      const formattedText = `\n\n--- Document ${uploadedFiles.length + 1}: ${currentFile.name} ---\n\n${pendingText}\n\n`;
      setExtractedText(prev => prev + formattedText);
      setUploadedFiles(prev => [...prev, currentFile]);
    }
    setShowPreviewDialog(false);
    setPendingText('');
    setCurrentFile(null);
  };

  const handleSkipFile = () => {
    setShowPreviewDialog(false)
    setPendingText('')
    setCurrentFile(null)
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null)
    setIsProcessing(true)
    setExtractedText('')
    
    if (uploadedFiles.length + acceptedFiles.length > 5) {
      toast.error('Maximum 5 files allowed. Please remove some files before uploading more.')
      setIsProcessing(false)
      return
    }

    const unsupportedFiles = acceptedFiles.filter(file => {
      const isImage = file.type.startsWith('image/')
      const isPdf = file.type === 'application/pdf'
      const isDoc = file.type === 'application/msword'
      const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      return !(isImage || isPdf || isDoc || isDocx)
    })

    if (unsupportedFiles.length > 0) {
      const unsupportedFileNames = unsupportedFiles.map(file => file.name).join(', ')
      toast.error(`Unsupported file format(s): ${unsupportedFileNames}. Please only upload PDF, DOC, DOCX, or image files.`)
      setIsProcessing(false)
      return
    }

    const newFiles = acceptedFiles
    let processingErrors: string[] = []
    
    for (const file of newFiles) {
      try {
        let text = ''
        
        if (file.type === 'application/pdf') {
          text = await processPDF(file)
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                   file.type === 'application/msword') {
          text = await extractTextFromDocx(file)
        } else if (file.type.startsWith('image/')) {
          text = await processImage(file)
        }
        
        if (text.trim()) {
          setCurrentFile(file)
          setPreviewText(text)
          setPendingText(text)
          setShowPreviewDialog(true)
          
          await new Promise<void>(resolve => {
            const checkDialog = setInterval(() => {
              if (!showPreviewDialog) {
                clearInterval(checkDialog)
                resolve()
              }
            }, 100)
          })
        } else {
          processingErrors.push(`No text could be extracted from ${file.name}. Please make sure the file contains readable text.`)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        let userFriendlyMessage = ''
        
        if (errorMessage.includes('Failed to extract text from PDF')) {
          userFriendlyMessage += 'Could not read text from this PDF. Please make sure it contains selectable text and is not a scanned document.'
        } else if (errorMessage.includes('Legacy .doc files')) {
          userFriendlyMessage += 'Please save your .doc file as .docx and try again.'
        } else if (errorMessage.includes('Failed to extract text from document')) {
          userFriendlyMessage += 'Could not read text from this document. Please make sure it is not corrupted or password protected.'
        } else if (errorMessage.includes('Failed to process image')) {
          userFriendlyMessage += 'Could not extract text from this image. Please make sure it contains clear, readable text.'
        } else {
          userFriendlyMessage += errorMessage
        }
        
        processingErrors.push(userFriendlyMessage)
      }
    }

    if (processingErrors.length > 0) {
      toast.error(processingErrors.join('\n'))
    }
    
    setIsProcessing(false)
  }, [showPreviewDialog, uploadedFiles.length])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 5,
    maxSize: 10485760,
    disabled: isProcessing || showPreviewDialog || uploadedFiles.length >= 5,
    onDropRejected: (rejections) => {
      const errors = rejections.map(rejection => {
        if (rejection.errors[0].code === 'file-too-large') {
          return `${rejection.file.name} is too large. Maximum size is 10MB.`
        }
        if (rejection.errors[0].code === 'file-invalid-type') {
          return `${rejection.file.name} is not a supported file type.`
        }
        return `${rejection.file.name}: ${rejection.errors[0].message}`
      })
      toast.error(errors.join('\n'))
    }
  })

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setIsSubmitting(true)

    if (!extractedText.trim()) {
      toast.error('No content has been extracted from the files. Please upload and process at least one file.')
      setIsLoading(false)
      setIsSubmitting(false)
      return
    }

    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one file.')
      setIsLoading(false)
      setIsSubmitting(false)
      return
    }

    try {
      const formData = new FormData()

      const formattedExtractedText = extractedText
        .split('--- Document')
        .filter(part => part.trim())
        .map(part => {
          const [header, ...content] = part.split('\n')
          return `--- Document${header}\n${content.join('\n').trim()}`
        })
        .join('\n\n')

      formData.append('extracted_text', formattedExtractedText)
      formData.append('question_count', questionCount.toString())
      formData.append('difficulty', difficulty)
      formData.append('enable_timer', enableTimer ? '1' : '0')
      
      const timeLimit = enableTimer ? calculateTotalTime() : 0
      formData.append('time_limit', timeLimit.toString())
      
      const response = await axios.post('/quizzes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        timeout: 300000,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!)
        }
      })

      if (response.data.success) {
        toast.success('Quiz created successfully!')
        router.visit(route('quizzes.index'))
      } else {
        const errorMessage = response.data.message || 'Failed to create quiz'
        toast.error(errorMessage)
        if (response.data.errors) {
          Object.values(response.data.errors).forEach((error: any) => {
            toast.error(error[0])
          })
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message 
          || error.message 
          || 'Failed to create quiz'
        
        if (error.response?.status === 422) {
          const validationErrors = error.response.data.errors
          if (validationErrors) {
            toast.error('Error creating quiz. Please try again.')
          }
        } else if (error.response?.status === 413) {
          toast.error('The uploaded files are too large. Please reduce the file size and try again.')
        } else if (error.response?.status === 401) {
          toast.error('You are not authorized to create quizzes. Please log in and try again.')
        } else if (error.response?.status === 500) {
          const serverMessage = error.response?.data?.message || 'Internal server error occurred'
          toast.error(`Server Error: ${serverMessage}`)
        } else if (error.code === 'ECONNABORTED') {
          toast.error('The request timed out. Please try again.')
        } else {
          toast.error('An unexpected error occurred. Please try again.')
        }
      } else {
        toast.error('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
      setIsSubmitting(false)
    }
  }

  const breadcrumbs = [
    { title: "VisionAI", href: "/chat" },
    { title: "Quizzes", href: "/quizzes" },
    { title: "Create Quiz", href: "/quizzes/create" },
  ]

  const calculateTotalTime = () => {
    if (!enableTimer) return 0
    const time = timePerQuestion[difficulty as keyof typeof timePerQuestion]
    return questionCount * time
  }

  const formatTime = (seconds: number) => {
    if (seconds === 0) return 'No time limit'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes} minutes`
  }

  return (
    <AppSidebarLayout breadcrumbs={breadcrumbs} conversations={conversations}>
      <Head title="Create Quiz" />

      <div className="container mx-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Create New Quiz</h1>
            <p className="text-muted-foreground">Upload documents or images to generate an AI-powered quiz</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quiz Settings</CardTitle>
              <CardDescription>Configure your quiz preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Number of Questions</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[questionCount]}
                    onValueChange={([value]) => setQuestionCount(value)}
                    min={5}
                    max={15}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12">{questionCount}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Difficulty Level</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Timer</Label>
                  <div className="col-span-3">
                    <div className="flex items-center justify-between">
                      <span>Enable Timer</span>
                      <Switch
                        checked={enableTimer}
                        onCheckedChange={setEnableTimer}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {enableTimer 
                    ? `Time per question: ${timePerQuestion[difficulty as keyof typeof timePerQuestion] / 60} minutes`
                    : 'Quiz will have no time limit'}
                </p>
                {enableTimer && (
                  <div className="mt-2 p-2 bg-muted rounded-md">
                    <p className="text-sm font-medium">Total Quiz Time: {formatTime(calculateTotalTime())}</p>
                    <p className="text-xs text-muted-foreground">
                      Based on {questionCount} questions × {timePerQuestion[difficulty as keyof typeof timePerQuestion] / 60} minutes per question
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upload Content</CardTitle>
              <CardDescription>Upload PDFs or images to generate quiz questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : isProcessing || showPreviewDialog || uploadedFiles.length >= 5
                    ? 'border-muted-foreground/25 bg-muted cursor-not-allowed opacity-60'
                    : 'border-muted-foreground/25 cursor-pointer'
                }`}
              >
                <input {...getInputProps()} disabled={uploadedFiles.length >= 5} />
                {isProcessing ? (
                  <>
                    <Loader2 className="mx-auto h-12 w-12 text-muted-foreground animate-spin" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Processing files... Please wait
                    </p>
                  </>
                ) : showPreviewDialog ? (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Please review the current file before uploading more
                    </p>
                  </>
                ) : uploadedFiles.length >= 5 ? (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Maximum number of files (5) reached. Remove files to upload more.
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {isDragActive
                        ? "Drop the files here"
                        : "Drag & drop files here, or click to select files"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supported formats: PDF, DOCX (recommended), DOC (legacy), PNG, JPG, JPEG, GIF
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum file size: 10MB
                    </p>
                  </>
                )}
              </div>

              {error && (
                <div className="mt-4 p-4 border border-destructive/50 rounded-md bg-destructive/10">
                  <p className="text-sm text-destructive font-medium mb-1">Error:</p>
                  <pre className="text-sm text-destructive whitespace-pre-wrap">{error}</pre>
                </div>
              )}

              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="text-sm font-medium">Uploaded Files</h3>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          {file.type.startsWith('image/') ? (
                            <Image className="h-4 w-4 text-muted-foreground" />
                          ) : file.type === 'application/pdf' ? (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm">{file.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/quizzes'}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || isSubmitting || uploadedFiles.length === 0}
              className="relative"
            >
              {(isLoading || isSubmitting) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Quiz...
                </>
              ) : (
                'Create Quiz'
              )}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] w-full">
          <DialogHeader>
            <DialogTitle>Extracted Text Preview</DialogTitle>
            <DialogDescription>
              Review the extracted text from {currentFile?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="relative flex-1 overflow-hidden">
            <ScrollArea className="h-[50vh] w-full">
              <div className="p-4 border rounded-md">
                <pre className="whitespace-pre-wrap break-all text-sm" style={{ maxWidth: 'calc(100% - 2rem)' }}>{previewText}</pre>
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleSkipFile}
            >
              Skip File
            </Button>
            <Button
              onClick={handleConfirmFile}
            >
              Confirm & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppSidebarLayout>
  )
} 