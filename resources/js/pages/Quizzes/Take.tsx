import { useState, useEffect, useRef } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Quiz, Question, type Language } from '@/types/index';
import { translations } from '@/translations';
import { Translations } from '@/translations';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Clock, ClockIcon, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { route } from 'ziggy-js';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuizSettings {
    enable_timer: boolean;
    time_limit: number;
}

interface Props {
    quiz: Quiz & {
        settings?: QuizSettings;
        questions: Array<Question & {
            options: string[];
            correct_answer: string;
        }>;
    };
    conversations: any[];
}

interface FormData {
    answers: Record<number, string>;
    score: number;
    time_taken: number;
    [key: string]: any;
}

export default function Take({ quiz, conversations }: Props) {
    const { t: globalT } = useLanguage();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const timerRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(Date.now());
    const endTimeRef = useRef<number | null>(null);
    const [timeTaken, setTimeTaken] = useState<number>(0);

    const t = translations[quiz.settings?.language || 'en'];


    const form = useForm<FormData>({
        answers: {},
        score: 0,
        time_taken: 0
    });
    if (!quiz || !quiz.id || !quiz.title || !quiz.questions || quiz.questions.length === 0) {
        toast.error(t.unsupportedFormat);
        router.visit(route('quizzes.index'));
        return null;
    }

    useEffect(() => {
        form.setData('answers', selectedAnswers);
        const score = calculateScore();
        form.setData('score', score);
    }, [selectedAnswers]);

    useEffect(() => {
        const interval = setInterval(() => {
            const elapsedTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
            setTimeTaken(elapsedTime);
            form.setData('time_taken', elapsedTime);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (quiz.settings?.enable_timer && quiz.settings?.time_limit) {
            setTimeLeft(quiz.settings.time_limit);
            startTimeRef.current = Date.now();
            endTimeRef.current = startTimeRef.current + (quiz.settings.time_limit * 1000);
            
            const updateTimer = () => {
                const now = Date.now();
                const remaining = Math.ceil((endTimeRef.current! - now) / 1000);
                
                if (remaining <= 0) {
                    setTimeLeft(0);
                    handleTimeEnd();
                    return;
                }
                
                setTimeLeft(remaining);
                timerRef.current = requestAnimationFrame(updateTimer);
            };
            
            timerRef.current = requestAnimationFrame(updateTimer);
            
            return () => {
                if (timerRef.current) {
                    cancelAnimationFrame(timerRef.current);
                }
            };
        }
    }, [quiz.settings?.enable_timer, quiz.settings?.time_limit]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleAnswerSelect = (questionId: number, answer: string) => {
        setSelectedAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleQuestionClick = (questionId: number, answer: string) => {
        handleAnswerSelect(questionId, answer);
    };

    const handleNext = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const calculateScore = () => {
        let correctAnswers = 0;
        quiz.questions.forEach(question => {
            if (selectedAnswers[question.id] === question.correct_answer) {
                correctAnswers++;
            }
        });
        return Math.round((correctAnswers / quiz.questions.length) * 100);
    };

    const handleTimeEnd = () => {
        if (timerRef.current) {
            cancelAnimationFrame(timerRef.current);
        }
        toast.error(t.timeRemaining); 
        setTimeout(() => {
            router.visit(route('quizzes.index'));
        }, 2000);
    };

    const handleSubmit = async () => {
        if (timeLeft === 0) {
            return;
        }

        try {
            setIsSubmitting(true);

            const submitData = {
                answers: selectedAnswers,
                time_taken: quiz.settings?.enable_timer ? quiz.settings.time_limit - (timeLeft || 0) : timeTaken,
                score: calculateScore()
            };

            await axios.post(`/quizzes/${quiz.id}/submit`, submitData);
            toast.success(t.submitted);
            setTimeout(() => {
                router.visit(route('quizzes.index'));
            }, 2000);
        } catch (error) {
            console.error('Failed to submit quiz:', error);
            toast.error(t.incorrect);
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
    const isCurrentQuestionAnswered = !!selectedAnswers[currentQuestion.id];

    const breadcrumbs = [
        { title: "VisionAI", href: "/chat" },
        { title: globalT.quizzes, href: "/quizzes" },
        { title: globalT.startQuiz, href: `/quizzes/take/${quiz.id}` },
    ];

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t.question}: ${quiz.title}`} />
            <div className="container mx-auto p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    <div className={`${quiz.settings?.layout === 'rtl' ? 'text-right' : 'text-left'}`}>
                        <h1 className="text-2xl font-bold">{quiz.title}</h1>
                        <p className="text-muted-foreground">{quiz.description || t.question}</p>
                    </div>

                    {quiz.settings?.enable_timer && timeLeft !== null && (
                        <div className={`flex items-center gap-2 text-sm ${quiz.settings?.layout === 'rtl' ? 'justify-end' : 'justify-start'}`}>
                            <span>{`${t.timeRemaining}: ${formatTime(timeLeft)}`}</span>
                        </div>
                    )}

                    <Progress value={progress} className="h-2" />

                    <Card>
                        <CardHeader>
                            <CardTitle className={quiz.settings?.layout === 'rtl' ? 'text-right' : 'text-left'}>
                                {t.question} {currentQuestionIndex + 1} {t.of} {quiz.questions.length}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <p className={`text-gray-700 dark:text-gray-300 ${quiz.settings?.layout === 'rtl' ? 'text-right' : 'text-left'}`}>
                                    {currentQuestion.question_text}
                                </p>

                                <div className="space-y-3">
                                    {currentQuestion.options.map((option: string, index: number) => (
                                        <div
                                            key={index}
                                            onClick={() => handleQuestionClick(currentQuestion.id, option)}
                                            className={`p-4 rounded-lg cursor-pointer transition-all bg-accent/30 ${quiz.settings?.layout === 'rtl' ? 'text-right' : 'text-left'}`}
                                        >
                                            <div className={`flex items-center ${quiz.settings?.layout === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <input
                                                    type="radio"
                                                    name={`question-${currentQuestion.id}`}
                                                    checked={selectedAnswers[currentQuestion.id] === option}
                                                    onChange={() => handleAnswerSelect(currentQuestion.id, option)}
                                                    className={quiz.settings?.layout === 'rtl' ? 'ml-3' : 'mr-3'}
                                                />
                                                <span className="dark:text-gray-200">{option}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className={`flex ${quiz.settings?.layout === 'rtl' ? 'flex-row-reverse' : 'flex-row'} justify-between mt-6`}>
                                    <Button
                                        variant="outline"
                                        onClick={handlePrevious}
                                        disabled={currentQuestionIndex === 0 || isSubmitting}
                                    >
                                        {t.previous}
                                    </Button>
                                    {currentQuestionIndex < quiz.questions.length - 1 ? (
                                        <Button
                                            onClick={handleNext}
                                            disabled={!isCurrentQuestionAnswered || isSubmitting || timeLeft === 0}

                                        >
                                            {t.next}
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={!isCurrentQuestionAnswered || isSubmitting || timeLeft === 0}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className={`h-4 w-4 animate-spin ${quiz.settings?.layout === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                                                    {t.submit}
                                                </>
                                            ) : (
                                                t.submit
                                            )}
                                        </Button>
                                    )}
                                </div>
                              
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppSidebarLayout>
    );
} 