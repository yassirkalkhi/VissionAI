import { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/translations';

interface Props {
    quiz: {
        id: number;
        title: string;
        description: string;
        settings: {
            layout: 'ltr' | 'rtl';
            language: string;
        };
        questions: Array<{
            id: number;
            question_text: string;
            options: string[];
            correct_answer: string;
            explanation: string;
        }>;
    };
    attempt: {
        id: number;
        score: number;
        time_taken: number;
        answers: Record<number, string>;
    };
}

export default function Overview({ quiz, attempt }: Props) {
     const t = translations[quiz.settings?.language || 'en'];
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const userAnswer = attempt.answers[currentQuestion.id];
    const isCorrect = userAnswer === currentQuestion.correct_answer;
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

    const breadcrumbs = [
        { title: 'VisionAI', href: '/chat' },
        { title: t.quizzes, href: '/quizzes' },
        { title: t.overview, href: `/quizzes/${quiz.id}/overview` },
    ];

    const handleNext = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((prev) => prev - 1);
        }
    };

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title={`${quiz.title} - ${t.overview}`} />
            <div className="container mx-auto p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    <div className={`${quiz.settings.layout === 'rtl' ? 'text-right' : 'text-left'}`}>
                        <h1 className="text-2xl font-bold">{quiz.title}</h1>
                        <p className="text-muted-foreground">{quiz.description}</p>
                    </div>

                    <Progress value={progress} className="h-2" />

                    <Card>
                        <CardHeader>
                            <CardTitle className={quiz.settings.layout === 'rtl' ? 'text-right' : 'text-left'}>
                                {t.question} {currentQuestionIndex + 1} {t.of} {quiz.questions.length}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <p
                                    className={` ${
                                        quiz.settings.layout === 'rtl' ? 'text-right' : 'text-left'
                                    } ${isCorrect ? 'text-green-600' : 'text-red-600'}`}
                                >
                                    {currentQuestion.question_text}
                                </p>

                                <div className="space-y-3">
                                    {currentQuestion.options.map((option, index) => (
                                        <div
                                            key={index}
                                            className={`p-4 rounded-lg transition-all ${
                                                option === currentQuestion.correct_answer
                                                    ? 'bg-green-100 dark:bg-green-800'
                                                    : option === userAnswer && !isCorrect
                                                    ? 'bg-red-100 dark:bg-red-800'
                                                    : 'bg-accent/30'
                                            } ${
                                                quiz.settings.layout === 'rtl' ? 'text-right' : 'text-left'
                                            }`}
                                        >
                                            <div
                                                className={`flex items-center ${
                                                    quiz.settings.layout === 'rtl' ? 'flex-row-reverse' : 'flex-row'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`question-${currentQuestion.id}`}
                                                    checked={userAnswer === option}
                                                    disabled
                                                    readOnly
                                                    className={`${
                                                        quiz.settings.layout === 'rtl' ? 'ml-3' : 'mr-3'
                                                    }`}
                                                />
                                                <span className="dark:text-gray-200">{option}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>


                                <div
                                    className={`flex ${
                                        quiz.settings.layout === 'rtl' ? 'flex-row-reverse' : 'flex-row'
                                    } justify-between mt-6`}
                                >
                                    <Button
                                        variant="outline"
                                        onClick={handlePrevious}
                                        disabled={currentQuestionIndex === 0}
                                    >
                                        {t.previous}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleNext}
                                        disabled={currentQuestionIndex === quiz.questions.length - 1}
                                    >
                                        {t.next}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppSidebarLayout>
    );
}