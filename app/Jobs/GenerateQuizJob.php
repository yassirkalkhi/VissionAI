<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Quiz;
use App\Models\Question;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GenerateQuizJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $quizId;
    protected $extractedText;
    protected $questionCount;
    protected $difficulty;
    protected $userId;

    public function __construct($quizId, $extractedText, $questionCount, $difficulty, $userId)
    {
        $this->quizId = $quizId;
        $this->extractedText = $extractedText;
        $this->questionCount = $questionCount;
        $this->difficulty = $difficulty;
        $this->userId = $userId;
    }

    public function handle()
    {
        try {
            $quiz = Quiz::findOrFail($this->quizId);
            
            // Prepare the system message for DeepSeek
            $systemMessage = "You are an expert quiz generator. Generate a quiz based on the provided text. 
                The quiz should be of {$this->difficulty} difficulty level. Create questions that test understanding 
                and comprehension. Each question should have 4 options with one correct answer and an explanation.";

            // Call DeepSeek API
            $response = Http::timeout(120)->withHeaders([
                'Authorization' => 'Bearer ' . env('DEEPSEEK_API_KEY'),
                'Content-Type' => 'application/json'
            ])->post(env('DEEPSEEK_API_URL'), [
                'model' => 'deepseek-chat',
                'messages' => [
                    ['role' => 'system', 'content' => $systemMessage],
                    ['role' => 'user', 'content' => "Generate a quiz with {$this->questionCount} questions from this text:\n\n{$this->extractedText}"]
                ],
                'tools' => [
                    [
                        'type' => 'function',
                        'function' => [
                            'name' => 'save_quiz',
                            'description' => 'Save a generated quiz with its questions and answers',
                            'parameters' => [
                                'type' => 'object',
                                'properties' => [
                                    'quiz' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'title' => ['type' => 'string'],
                                            'description' => ['type' => 'string'],
                                            'difficulty' => ['type' => 'string', 'enum' => ['easy', 'medium', 'hard']],
                                            'questions' => [
                                                'type' => 'array',
                                                'items' => [
                                                    'type' => 'object',
                                                    'properties' => [
                                                        'question_text' => ['type' => 'string'],
                                                        'options' => ['type' => 'array', 'items' => ['type' => 'string']],
                                                        'correct_answer' => ['type' => 'string'],
                                                        'explanation' => ['type' => 'string']
                                                    ]
                                                ]
                                            ]
                                        ]
                                    ]
                                ]
                            ]
                        ]
                    ]
                ],
                'tool_choice' => 'auto',
                'temperature' => 0.7
            ]);

            if (!$response->successful()) {
                throw new \Exception('Failed to generate quiz: ' . $response->body());
            }

            $result = $response->json();
            
            if (isset($result['choices'][0]['message']['tool_calls'])) {
                foreach ($result['choices'][0]['message']['tool_calls'] as $toolCall) {
                    if ($toolCall['function']['name'] === 'save_quiz') {
                        $quizData = json_decode($toolCall['function']['arguments'], true);
                        
                        if (isset($quizData['quiz'])) {
                            $quizContent = $quizData['quiz'];
                            
                            // Update the quiz
                            $quiz->update([
                                'title' => $quizContent['title'],
                                'description' => $quizContent['description'],
                                'status' => 'completed'
                            ]);

                            // Create questions
                            foreach ($quizContent['questions'] as $index => $question) {
                                Question::create([
                                    'quiz_id' => $quiz->id,
                                    'question_text' => $question['question_text'],
                                    'question_type' => 'multiple_choice',
                                    'options' => $question['options'],
                                    'correct_answer' => $question['correct_answer'],
                                    'explanation' => $question['explanation'],
                                    'order' => $index + 1
                                ]);
                            }
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to generate quiz in job', [
                'error' => $e->getMessage(),
                'quiz_id' => $this->quizId
            ]);
            
            // Update quiz status to failed
            $quiz->update(['status' => 'failed']);
        }
    }
} 