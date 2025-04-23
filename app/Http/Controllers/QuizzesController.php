<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Conversation;
use Illuminate\Support\Facades\Auth;
use App\Models\Question;
use thiagoalessio\TesseractOCR\TesseractOCR;
use Smalot\PdfParser\Parser;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use App\Models\QuizAttempt;
use Illuminate\Support\Facades\Http;
use App\Jobs\GenerateQuizJob;
use Illuminate\Support\Facades\DB;

class QuizzesController extends Controller
{
    // functions|tools
    private $functions = [
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
                            ],
                            'required' => ['title', 'description', 'difficulty', 'questions']
                        ]
                    ],
                    'required' => ['quiz']
                ]
            ]
        ]
    ];

    private function save_quiz($quizData)
    {
        set_time_limit(1000);
        try {
            $data = is_string($quizData) ? json_decode($quizData, true) : $quizData;
            
            if (!isset($data['quiz'])) {
                throw new \Exception('Invalid quiz data format');
            }

            $quizContent = $data['quiz'];
            
            // Create the quiz
            $quiz = Quiz::create([
                'title' => $quizContent['title'],
                'description' => $quizContent['description'],
                'user_id' => auth()->id(),
                'difficulty' => $quizContent['difficulty'],
                'settings' => [
                    'time_limit' => 0,
                    'enable_timer' => false,
                    'language' => $quizContent['language'],
                    'layout' => $quizContent['layout'],
                    'question_count' => count($quizContent['questions'])
                ]
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

            return [
                'status' => 'success',
                'message' => 'Quiz saved successfully',
                'quiz' => [
                    'id' => $quiz->id,
                    'title' => $quiz->title
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Error saving quiz:', ['error' => $e->getMessage()]);
            return [
                'status' => 'error',
                'message' => 'Failed to save quiz '
            ];
        }
    }

    public function index()
    {
        $quizzes = Quiz::where('user_id', auth()->id())
            ->withCount('questions')
            ->with(['attempts' => function($query) {
                $query->where('user_id', auth()->id())
                    ->orderBy('created_at', 'desc')
                    ->select(['id', 'quiz_id', 'user_id', 'score', 'time_taken', 'answers', 'created_at']);
            }])
            ->latest()
            ->get()
            ->map(function ($quiz) {
                return [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'description' => $quiz->description,
                    'user_id' => $quiz->user_id,
                    'difficulty' => $quiz->difficulty,
                    'settings' => [
                        'time_limit' => $quiz->settings['time_limit'] ?? null,
                        'enable_timer' => $quiz->settings['enable_timer'] ?? false,
                        'question_count' => $quiz->settings['question_count'] ?? 0,
                        'layout' => $quiz->settings['layout'] ?? 'ltr',
                        'language' => $quiz->settings['language'] ?? 'en'
                    ],
                    'questions_count' => $quiz->questions_count,
                    'attempts' => $quiz->attempts->map(function ($attempt) {
                        return [
                            'id' => $attempt->id,
                            'quiz_id' => $attempt->quiz_id,
                            'user_id' => $attempt->user_id,
                            'score' => $attempt->score,
                            'time_taken' => $attempt->time_taken,
                            'answers' => $attempt->answers,
                            'created_at' => $attempt->created_at->toISOString(),
                        ];
                    })->values()->all(),
                    'created_at' => $quiz->created_at,
                    'updated_at' => $quiz->updated_at,
                ];
            });

        return Inertia::render('Quizzes/Index', [
            'quizzes' => $quizzes,
            'questions' => Question::whereIn('quiz_id', $quizzes->pluck('id'))
                ->select(['id', 'quiz_id', 'question_text', 'options', 'correct_answer'])
                ->get(),
            'conversations' => Conversation::where('user_id', auth()->id())
                ->orderBy('updated_at', 'desc')
                ->get(['id', 'title', 'updated_at'])
        ]);
    }

    public function create()
    {
        set_time_limit(1000);
        $conversations = Conversation::where('user_id', Auth::id())
            ->orderBy('updated_at', 'desc')
            ->get(['id', 'title', 'updated_at']);

        return Inertia::render('Quizzes/Create', [
            'conversations' => $conversations,
        ]);
    }

    public function store(Request $request)
    {
        set_time_limit(1000);
        try {
            ini_set('max_execution_time', 240);
            Log::info('Starting quiz creation', ['request' => $request->all()]);

            $request->validate([
                'extracted_text' => 'required|string|max:50000',
                'question_count' => 'required|integer|min:5|max:15',
                'difficulty' => 'required|in:easy,medium,hard',
                'enable_timer' => 'required|in:0,1',
                'time_limit' => 'required|integer|min:0'
            ]);

            // Process the formatted text
            $extractedText = $request->extracted_text;
            
            // Create initial quiz record
            $quiz = Quiz::create([
                'title' => 'New Quiz',
                'description' => 'Generated from uploaded content',
                'user_id' => auth()->id(),
                'difficulty' => $request->difficulty,
                'settings' => [
                    'time_limit' => (int)$request->time_limit,
                    'enable_timer' => (bool)$request->enable_timer,
                    'question_count' => $request->question_count,
                    'layout' => 'ltr', // Default layout
                    'language' => 'en' // Default language
                ]
            ]);

            // System prompt
            $systemMessage = "You are an expert quiz generator. Create a quiz with the following specifications:
                - Ensure that the question and answer are logical and correct
                - all questions Must have one logic valid answer
                - Difficulty: {$request->difficulty}
                - Number of questions: {$request->question_count}
                - Each question must have exactly 4 options
                - Include a brief explanation for each answer
                - Questions should test understanding of the text
                - Do not include any other text or instructions in the response
                - Do not repeat the same question in the quiz or generate to similar questions
                - IMPORTANT: The text is extracted from multiple documents. Each document is clearly marked with '--- Document X: filename ---'
                - IMPORTANT: Detect the language of the provided text and generate the quiz in the same language
                - For RTL languages (like Arabic), set layout to 'rtl', otherwise set it to 'ltr'
                - Set the language code based on the detected language  'language': 'en' | 'ar' | 'fr' | 'de' | 'it' | 'zh',
                - Return the response in this exact format:
                {
                    'quiz': {
                        'title': 'Quiz Title in detected language',
                        'description': 'Quiz Description in detected language',
                        'difficulty': '{$request->difficulty}',
                        'layout': 'rtl' or 'ltr',
                         'language': 'en' | 'ar' | 'fr' | 'de' | 'it' | 'zh',
                        'questions': [
                            {
                                'question_text': 'Question text in detected language',
                                'options': ['Option 1 in detected language', 'Option 2 in detected language', 'Option 3 in detected language', 'Option 4 in detected language'],
                                'correct_answer': 'Correct option in detected language',
                                'explanation': 'Brief explanation in detected language'
                            }
                        ]
                    }
                }";

            // Call DeepSeek API
            $response = Http::timeout(90)->withHeaders([
                'Authorization' => 'Bearer ' . env('DEEPSEEK_API_KEY'),
                'Content-Type' => 'application/json'
            ])->post(env('DEEPSEEK_API_URL'), [
                'model' => 'deepseek-chat',
                'messages' => [
                    ['role' => 'system', 'content' => $systemMessage],
                    ['role' => 'user', 'content' => "Generate a quiz from this text:\n\n{$extractedText}"]
                ],
                'tools' => $this->functions,
                'tool_choice' => ['type' => 'function', 'function' => ['name' => 'save_quiz']],
                'temperature' => 0.7,
                'max_tokens' => 2000
            ]);

            if (!$response->successful()) {
                Log::error('DeepSeek API error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('Failed to generate quiz: API request failed');
            }

            $result = $response->json();
            Log::info('DeepSeek API response', ['result' => $result]);

            if (!isset($result['choices'][0]['message']['tool_calls'])) {
                Log::error('Invalid API response format', ['result' => $result]);
                throw new \Exception('Invalid API response format');
            }

            foreach ($result['choices'][0]['message']['tool_calls'] as $toolCall) {
                if ($toolCall['function']['name'] === 'save_quiz') {
                    $quizData = json_decode($toolCall['function']['arguments'], true);
                    Log::info('Parsed quiz data', ['quizData' => $quizData]);

                    if (!isset($quizData['quiz'])) {
                        Log::error('Missing quiz data in function call', ['arguments' => $toolCall['function']['arguments']]);
                        throw new \Exception('Invalid quiz data format');
                    }

                    $quizContent = $quizData['quiz'];

                    // Validate quiz content
                    if (!isset($quizContent['questions']) || !is_array($quizContent['questions'])) {
                        Log::error('Invalid questions format', ['quizContent' => $quizContent]);
                        throw new \Exception('Invalid questions format');
                    }

                    // Validate each question
                    foreach ($quizContent['questions'] as $index => $question) {
                        if (!isset($question['question_text']) || 
                            !isset($question['options']) || 
                            !is_array($question['options']) || 
                            count($question['options']) !== 4 || 
                            !isset($question['correct_answer'])) {
                            Log::error('Invalid question format', [
                                'question' => $question,
                                'index' => $index
                            ]);
                            throw new \Exception('Invalid question format at index ' . $index);
                        }
                    }

                    // Update quiz and create questions in a transaction
                    DB::transaction(function () use ($quiz, $quizContent) {
                        $quiz->update([
                            'title' => $quizContent['title'] ?? 'New Quiz',
                            'description' => $quizContent['description'] ?? 'Generated from uploaded content',
                            'settings' => array_merge($quiz->settings, [
                                'layout' => $quizContent['layout'] ?? 'ltr',
                                'language' => $quizContent['language'] ?? 'en'
                            ])
                        ]);

                        $questions = [];
                        foreach ($quizContent['questions'] as $index => $question) {
                            // Ensure options is a valid JSON array
                            $options = is_array($question['options']) ? $question['options'] : [];
                            
                            $questions[] = [
                                'quiz_id' => $quiz->id,
                                'question_text' => $question['question_text'],
                                'question_type' => 'multiple_choice',
                                'options' => json_encode($options), // Convert array to JSON string
                                'correct_answer' => $question['correct_answer'],
                                'explanation' => $question['explanation'] ?? '',
                                'order' => $index + 1,
                                'created_at' => now(),
                                'updated_at' => now()
                            ];
                        }

                        if (empty($questions)) {
                            throw new \Exception('No valid questions generated');
                        }

                        Question::insert($questions);
                    });

                    return response()->json([
                        'success' => true,
                        'message' => 'Quiz created successfully!',
                        'quiz' => [
                            'id' => $quiz->id,
                            'title' => $quiz->title
                        ]
                    ]);
                }
            }

            throw new \Exception('No valid quiz data generated');

        } catch (\Exception $e) {
            Log::error('Failed to create quiz', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create quiz: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $quiz = Quiz::with('questions')->findOrFail($id);
        if ($quiz) {
            return response()->json($quiz);
        } else {
            abort(404);
        }
    }

    public function update(Request $request, $id)
    {
        $quiz = Quiz::findOrFail($id);
        
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000'
        ]);

        $quiz->update([
            'title' => $request->title,
            'description' => $request->description
        ]);

        return redirect()->back()->with('success', 'Quiz updated successfully!');
    }

    public function destroy($id)
    {
        $quiz = Quiz::findOrFail($id);
        $quiz->delete();

        return redirect()->back()->with('success', 'Quiz deleted successfully!');
    }

    public function take($id)
    {
        $quiz = Quiz::with('questions')->findOrFail($id);
        

        
        $quiz->questions = $quiz->questions->map(function ($question) {
            if (is_string($question->options) && !empty($question->options)) {
                try {
                    $decodedOptions = json_decode($question->options, true);
                    $question->options = is_array($decodedOptions) ? $decodedOptions : [];
                    
                    if (empty($question->options)) {
                        Log::warning('Failed to parse question options', [
                            'question_id' => $question->id,
                            'options' => $question->options
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Error parsing question options', [
                        'question_id' => $question->id,
                        'error' => $e->getMessage()
                    ]);
                    $question->options = [];
                }
            }
            else if (!is_array($question->options)) {
                $question->options = [];
            }
            
            return $question;
        });

        Log::info('Processed quiz data:', [
            'quiz_id' => $quiz->id,
            'processed_questions' => $quiz->questions->map(function ($q) {
                return [
                    'id' => $q->id,
                    'has_options' => !empty($q->options),
                    'option_count' => is_array($q->options) ? count($q->options) : 0
                ];
            })
        ]);

       

        return Inertia::render('Quizzes/Take', [
            'quiz' => $quiz,
        ]);
    }

    public function submit(Request $request, $id)
    {
        try {
            DB::beginTransaction();
            
            $quiz = Quiz::with('questions')->findOrFail($id);
            Log::info('Quiz submission request data:', $request->all());
            
            // Validate the request
            $validated = $request->validate([
                'answers' => 'required|array',
                'time_taken' => 'required|integer|min:0',
                'score' => 'required|numeric|min:0|max:100'
            ]);

            // Validate that all questions have been answered
            $questionIds = $quiz->questions->pluck('id')->toArray();
            $answeredQuestionIds = array_keys($validated['answers']);
            $missingQuestions = array_diff($questionIds, $answeredQuestionIds);
            
            if (!empty($missingQuestions)) {
                DB::rollBack();
                return back()->withErrors([
                    'message' => 'All questions must be answered'
                ]);
            }

            // Create quiz attempt
            $attempt = QuizAttempt::create([
                'quiz_id' => $quiz->id,
                'user_id' => auth()->id(),
                'score' => $validated['score'],
                'time_taken' => $validated['time_taken'],
                'answers' => $validated['answers']
            ]);

            DB::commit();

            // Log successful submission
            Log::info('Quiz submission successful', [
                'quiz_id' => $quiz->id,
                'attempt_id' => $attempt->id,
                'user_id' => auth()->id()
            ]);

            return redirect()->route('quizzes.submissions', $quiz->id)
                ->with('success', 'Quiz submitted successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to submit quiz', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            
            return back()->withErrors([
                'message' => 'Failed to submit quiz: ' . $e->getMessage()
            ]);
        }
    }

    public function submissions($id)
    {
        $quiz = Quiz::with(['questions', 'attempts' => function($query) {
            $query->where('user_id', auth()->id())
                  ->orderBy('created_at', 'desc');
        }])->findOrFail($id);

        return Inertia::render('Quizzes/Submissions', [
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description,
                'questions' => $quiz->questions->map(function ($question) {
                    return [
                        'id' => $question->id,
                        'question_text' => $question->question_text,
                        'correct_answer' => $question->correct_answer,
                    ];
                }),
            ],
            'attempts' => $quiz->attempts->map(function ($attempt) {
                return [
                    'id' => $attempt->id,
                    'quiz_id' => $attempt->quiz_id,
                    'user_id' => $attempt->user_id,
                    'score' => $attempt->score,
                    'time_taken' => $attempt->time_taken,
                    'answers' => $attempt->answers,
                    'created_at' => $attempt->created_at->toISOString(),
                ];
            }),
            'conversations' => Conversation::where('user_id', auth()->id())
                ->orderBy('updated_at', 'desc')
                ->get(['id', 'title', 'updated_at'])
        ]);
    }
} 