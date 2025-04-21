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
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from "@/lib/utils"

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
  const { t, language } = useLanguage()
  const isRTL = language === 'ar'
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
      toast.error(t.maxFilesAllowed)
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
      toast.error(`${t.unsupportedFormat}: ${unsupportedFileNames}. ${t.uploadSupportedFormats}`)
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
          processingErrors.push(`${t.noTextExtracted} ${file.name}. ${t.checkReadableText}`)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        let userFriendlyMessage = ''
        
        if (errorMessage.includes('Failed to extract text from PDF')) {
          userFriendlyMessage += t.pdfExtractionFailed
        } else if (errorMessage.includes('Legacy .doc files')) {
          userFriendlyMessage += t.docLegacyNotSupported
        } else if (errorMessage.includes('Failed to extract text from document')) {
          userFriendlyMessage += t.documentExtractionFailed
        } else if (errorMessage.includes('Failed to process image')) {
          userFriendlyMessage += t.imageExtractionFailed
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
  }, [showPreviewDialog, uploadedFiles.length, t])

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
          return `${rejection.file.name} ${t.fileTooLarge}`
        }
        if (rejection.errors[0].code === 'file-invalid-type') {
          return `${rejection.file.name} ${t.fileInvalidType}`
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
      toast.error(t.noContentExtracted)
      setIsLoading(false)
      setIsSubmitting(false)
      return
    }

    if (uploadedFiles.length === 0) {
      toast.error(t.pleaseUploadFile)
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
        toast.success(t.quizCreatedSuccess)
        router.visit(route('quizzes.index'))
      } else {
        const errorMessage = response.data.message || t.failedToCreate
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
          || t.failedToCreate
        
        if (error.response?.status === 422) {
          const validationErrors = error.response.data.errors
          if (validationErrors) {
            toast.error(t.errorCreatingQuiz)
          }
        } else if (error.response?.status === 413) {
          toast.error(t.filesTooLarge)
        } else if (error.response?.status === 401) {
          toast.error(t.notAuthorized)
        } else if (error.response?.status === 500) {
          const serverMessage = error.response?.data?.message || t.serverError
          toast.error(`${t.serverError}: ${serverMessage}`)
        } else if (error.code === 'ECONNABORTED') {
          toast.error(t.requestTimeout)
        } else {
          toast.error(t.unexpectedError)
        }
      } else {
        toast.error(t.unexpectedError)
      }
    } finally {
      setIsLoading(false)
      setIsSubmitting(false)
    }
  }

  const breadcrumbs = [
    { title: "VisionAI", href: "/chat" },
    { title: t.quizzes, href: "/quizzes" },
    { title: t.createQuiz, href: "/quizzes/create" },
  ]

  const calculateTotalTime = () => {
    if (!enableTimer) return 0
    const time = timePerQuestion[difficulty as keyof typeof timePerQuestion]
    return questionCount * time
  }

  const formatTime = (seconds: number) => {
    if (seconds === 0) return t.noLimit
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes} ${t.minutes}`
  }

  return (
    <AppSidebarLayout breadcrumbs={breadcrumbs} >
      <Head title={t.createQuiz} />

      <div className="container mx-auto p-6" style={isRTL ? { direction: 'rtl' } : {}}>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className={isRTL ? 'text-right' : ''}>
            <h1 className="text-2xl font-bold">{t.createNewQuiz}</h1>
            <p className="text-muted-foreground">{t.uploadDocumentsDescription}</p>
          </div>

          <Card>
            <CardHeader className={isRTL ? 'text-right' : ''}>
              <CardTitle>{t.quizSettings}</CardTitle>
              <CardDescription>{t.configurePreferences}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className={isRTL ? 'text-right block' : ''}>{t.questionCount}</Label>
                <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Slider
                    value={[questionCount]}
                    onValueChange={([value]) => setQuestionCount(value)}
                    min={5}
                    max={15}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12 text-center">{questionCount}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className={isRTL ? 'text-right block' : ''}>{t.difficulty}</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className={isRTL ? 'text-right' : ''}>
                    <SelectValue placeholder={t.selectDifficulty} />
                  </SelectTrigger>
                  <SelectContent className={isRTL ? 'text-right' : ''}>
                    <SelectItem value="easy">{t.easy}</SelectItem>
                    <SelectItem value="medium">{t.medium}</SelectItem>
                    <SelectItem value="hard">{t.hard}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                {isRTL ? (
                  <>
                  <Switch
                      checked={enableTimer}
                      onCheckedChange={setEnableTimer}
                    />
                    <Label className={isRTL ? 'text-right' : ''}>{t.timer}</Label>
                    
                  </>
                ) : (
                  <>
                    <Label className={isRTL ? 'text-right' : ''}>{t.timer}</Label>
                    <Switch
                      checked={enableTimer}
                      onCheckedChange={setEnableTimer}
                    />
                  </>
                )}
                </div>
                
                <p className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
                  {enableTimer 
                    ? `${t.timePerQuestion}: ${timePerQuestion[difficulty as keyof typeof timePerQuestion] / 60} ${t.minutes}`
                    : t.quizNoTimeLimit}
                </p>
                
                {enableTimer && (
                  <div className="mt-2 p-2 bg-muted rounded-md">
                    <p className={`text-sm font-medium ${isRTL ? 'text-right' : ''}`}>
                      {t.totalQuizTime}: {formatTime(calculateTotalTime())}
                    </p>
                    <p className={`text-xs text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
                      {t.basedOn} {questionCount} {t.questions} × {timePerQuestion[difficulty as keyof typeof timePerQuestion] / 60} {t.minutesPerQuestion}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={isRTL ? 'text-right' : ''}>
              <CardTitle>{t.uploadContent}</CardTitle>
              <CardDescription>{t.uploadContentDescription}</CardDescription>
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
                      {t.processingFiles}
                    </p>
                  </>
                ) : showPreviewDialog ? (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t.reviewCurrentFile}
                    </p>
                  </>
                ) : uploadedFiles.length >= 5 ? (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t.maxFilesReached}
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {isDragActive
                        ? t.dropFilesHere
                        : t.dropToUpload}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.supportedFormatsExtended}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.maxFileSizeExtended}
                    </p>
                  </>
                )}
              </div>

              {error && (
                <div className="mt-4 p-4 border border-destructive/50 rounded-md bg-destructive/10">
                  <p className={`text-sm text-destructive font-medium mb-1 ${isRTL ? 'text-right' : ''}`}>{t.error}:</p>
                  <pre className={`text-sm text-destructive whitespace-pre-wrap ${isRTL ? 'text-right' : ''}`}>{error}</pre>
                </div>
              )}

              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className={`text-sm font-medium ${isRTL ? 'text-right' : ''}`}>{t.uploadedFiles}</h3>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'justify-between'} p-2 border rounded-md`}
                      >
                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
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

          <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'} gap-2`}>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/quizzes'}
              disabled={isLoading}
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || isSubmitting || uploadedFiles.length === 0}
              className="relative"
            >
              {(isLoading || isSubmitting) ? (
                <>
                  <Loader2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
                  {t.creatingQuiz}
                </>
              ) : (
                t.createQuiz
              )}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] w-full">
          <DialogHeader className={isRTL ? 'text-right' : ''}>
            <DialogTitle>{t.textPreview}</DialogTitle>
            <DialogDescription>
              {t.reviewExtractedText} {currentFile?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="relative flex-1 overflow-hidden">
            <ScrollArea className="h-[50vh] w-full">
              <div className="p-4 border rounded-md">
                <pre className={`whitespace-pre-wrap break-all text-sm ${isRTL ? 'text-right' : ''}`} style={{ maxWidth: 'calc(100% - 2rem)' }}>{previewText}</pre>
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className={isRTL ? 'flex-row-reverse' : ''}>
            <Button
              variant="outline"
              onClick={handleSkipFile}
            >
              {t.skipFile}
            </Button>
            <Button
              onClick={handleConfirmFile}
            >
              {t.confirmFile}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppSidebarLayout>
  )
} 