import { useState, useEffect, useRef } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Quiz, Question } from '@/types';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { route } from 'ziggy-js';

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
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(Date.now());
    const [timeTaken, setTimeTaken] = useState<number>(0);

    const form = useForm<FormData>({
        answers: {},
        score: 0,
        time_taken: 0
    });

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
        }
    }, [quiz]);

    useEffect(() => {
        if (quiz.settings?.enable_timer && timeLeft !== null && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev === null || prev <= 1) {
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
            };
        }
    }, [quiz.settings?.enable_timer, timeLeft]);

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

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            setError(null);

            const unansweredQuestions = quiz.questions.filter(question => !selectedAnswers[question.id]);
            if (unansweredQuestions.length > 0) {
                const errorMsg = 'Please answer all questions before submitting';
                setError(errorMsg);
                toast.error(errorMsg);
                return;
            }

            const score = calculateScore();
            
            const submitData = {
                answers: selectedAnswers,
                time_taken: quiz.settings?.enable_timer ? quiz.settings.time_limit - (timeLeft || 0) : timeTaken,
                score
            };

            await axios.post(`/quizzes/${quiz.id}/submit`, submitData);
            toast.success('Quiz submitted successfully!');
            router.visit(route('quizzes.index'));
        } catch (error) {
            const errorMsg = 'Failed to submit quiz. Please try again.';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
    const isCurrentQuestionAnswered = !!selectedAnswers[currentQuestion.id];

    const breadcrumbs = [
        { title: "VisionAI", href: "/chat" },
        { title: "Quizzes", href: "/quizzes" },
        { title: "Take Quiz", href: `/quizzes/take/${quiz.id}` },
    ];

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs} conversations={conversations}>
            <Head title={`Take Quiz: ${quiz.title}`} />

            <div className="container mx-auto p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold">{quiz.title}</h1>
                        <p className="text-muted-foreground">{quiz.description || 'No description available'}</p>
                    </div>

                    {quiz.settings?.enable_timer && timeLeft !== null && (
                        <div className="flex items-center gap-2 text-sm">
                            <span>Time remaining: {formatTime(timeLeft)}</span>
                        </div>
                    )}

                    <Progress value={progress} className="h-2" />

                    <Card>
                        <CardHeader>
                            <CardTitle>Question {currentQuestionIndex + 1} of {quiz.questions.length}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <p className="text-gray-700">{currentQuestion.question_text}</p>

                                <div className="space-y-3">
                                    {currentQuestion.options.map((option: string, index: number) => (
                                        <div
                                            key={index}
                                            onClick={() => handleQuestionClick(currentQuestion.id, option)}
                                            className={`p-4 rounded-lg cursor-pointer transition-all ${
                                                selectedAnswers[currentQuestion.id] === option
                                                    ? 'bg-blue-100 border-2 border-blue-500'
                                                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name={`question-${currentQuestion.id}`}
                                                    checked={selectedAnswers[currentQuestion.id] === option}
                                                    onChange={() => handleAnswerSelect(currentQuestion.id, option)}
                                                    className="mr-3"
                                                />
                                                <span className="text-gray-700">{option}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between mt-6">
                                    <Button
                                        variant="outline"
                                        onClick={handlePrevious}
                                        disabled={currentQuestionIndex === 0 || isSubmitting}
                                    >
                                        Previous
                                    </Button>
                                    {currentQuestionIndex < quiz.questions.length - 1 ? (
                                        <Button
                                            onClick={handleNext}
                                            disabled={!isCurrentQuestionAnswered || isSubmitting}
                                        >
                                            Next
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={!isCurrentQuestionAnswered || isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                'Submit Quiz'
                                            )}
                                        </Button>
                                    )}
                                </div>
                                {error && (
                                    <div className="mt-4 p-4 border border-destructive/50 rounded-md bg-destructive/10">
                                        <p className="text-sm text-destructive">{error}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppSidebarLayout>
    );
} 