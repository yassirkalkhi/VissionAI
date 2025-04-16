import { Head } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

interface QuizAttempt {
    id: number;
    quiz_id: number;
    user_id: number;
    score: number;
    time_taken: number;
    answers: Record<number, string>;
    created_at: string;
}

interface Props {
    quiz: {
        id: number;
        title: string;
        description: string;
        questions: any[];
    };
    attempts: QuizAttempt[];
    conversations: any[];
}

export default function Submissions({ quiz, attempts, conversations }: Props) {
    const formatTime = (seconds: number) => {
        if (seconds < 60) {
            return `${seconds}s`;
        }
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes < 60) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
    };

    const calculateCorrectAnswers = (attempt: QuizAttempt) => {
        let correctCount = 0;
        quiz.questions.forEach(question => {
            if (attempt.answers[question.id] === question.correct_answer) {
                correctCount++;
            }
        });
        return correctCount;
    };

    const breadcrumbs = [
        { title: "VisionAI", href: "/chat" },
        { title: "Quizzes", href: "/quizzes" },
        { title: "Submissions", href: `/quizzes/${quiz.id}/submissions` },
    ];

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs} conversations={conversations}>
            <Head title={`${quiz.title} - Submissions`} />

            <div className="container mx-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">{quiz.title} - Submissions</h1>
                        <p className="text-muted-foreground">{quiz.description}</p>
                    </div>

                    {attempts.length === 0 ? (
                        <Card>
                            <CardContent className="p-6">
                                <p className="text-center text-muted-foreground">No submissions yet</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {attempts.map((attempt) => {
                                const correctAnswers = calculateCorrectAnswers(attempt);
                                return (
                                    <Card key={attempt.id}>
                                        <CardHeader>
                                            <CardTitle className="flex items-center justify-between">
                                                <span>Score: {attempt.score}%</span>
                                                <span className="text-sm text-muted-foreground">
                                                    {formatDistanceToNow(new Date(attempt.created_at), { addSuffix: true })}
                                                </span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Time taken:</span>
                                                    <span>{formatTime(attempt.time_taken)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Correct answers:</span>
                                                    <span>{correctAnswers} / {quiz.questions.length}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AppSidebarLayout>
    );
} 