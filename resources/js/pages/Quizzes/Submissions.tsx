import { Head } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { XCircleIcon } from 'lucide-react';
import { CheckCircleIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
    const { t } = useLanguage();
    
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
    
    const handleScoreRender = (score: number) => {
        if(score > 90){
            return <span className="flex items-center gap-2 text-green-600">
                <CheckCircleIcon className="w-5 h-5" />{score}%
            </span>
        }
        if(score > 70){
            return <span className="flex items-center gap-2 text-green-400">
                <CheckCircleIcon className="w-5 h-5" />{score}%
            </span>
        }
        if(score > 50){
            return <span className="flex items-center gap-2 text-yellow-500">
                <XCircleIcon className="w-5 h-5" />{score}% 
            </span> 
        }
        if(score < 50){
            return <span className="flex items-center gap-2 text-red-500">
                <XCircleIcon className="w-5 h-5" />{score}%
            </span>
        }
    }


    const breadcrumbs = [
        { title: "VisionAI", href: "/chat" },
        { title: t.quizzes, href: "/quizzes" },
        { title: t.submissions, href: `/quizzes/${quiz.id}/submissions` },
    ];

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs} conversations={conversations}>
            <Head title={`${quiz.title} - ${t.submissions}`} />

            <div className="container mx-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">{quiz.title} - {t.submissions}</h1>
                        <p className="text-muted-foreground">{quiz.description}</p>
                    </div>

                    {attempts.length === 0 ? (
                        <Card>
                            <CardContent className="p-6">
                                <p className="text-center text-muted-foreground">{t.noSubmissions}</p>
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
                                                {handleScoreRender(attempt.score)}
                                                <span className="text-sm text-muted-foreground">
                                                    {formatDistanceToNow(new Date(attempt.created_at), { addSuffix: true })}
                                                </span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">{t.timeTaken}:</span>
                                                    <span>{formatTime(attempt.time_taken)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">{t.correctAnswers}:</span>
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