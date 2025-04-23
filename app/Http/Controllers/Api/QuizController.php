<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\ApiKey;
use App\Models\Question;
use App\Models\Answer;
use Illuminate\Support\Facades\Log;
use thiagoalessio\TesseractOCR\TesseractOCR;
use finfo;


class QuizController extends Controller
{
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
    private function verify($apiKey)
    {
        if (!$apiKey) {
            return response()->json(['message' => 'API key is required'], Response::HTTP_BAD_REQUEST);
        }

        $apiKeyRecord = ApiKey::all()->first(function ($record) use ($apiKey) {
            return \Illuminate\Support\Facades\Hash::check($apiKey, $record->key);
        });
        Log::info('API Key record found: ', ['apiKeyRecord' => $apiKeyRecord]);

        if (!$apiKeyRecord) {
            return response()->json(['message' => 'Invalid API key'], Response::HTTP_UNAUTHORIZED);
        }

        if(!$apiKeyRecord->is_active) {
            return response()->json(['message' => 'Forbidden user'],403);
        }

        $user = User::find($apiKeyRecord->user_id);
        Log::info('User found: ', ['user' => $user]);

        if (!$user) {
            return response()->json(['message' => 'Invalid User'], Response::HTTP_UNAUTHORIZED);
        }
        return $user;
    }

    /**
     * Display a listing of the quizzes for the user associated with the provided API key.
     */
    public function index(Request $request): JsonResponse
    {
        $apiKey = $request->header('X-API-Key');
        $user = $this->verify($apiKey);
        if (!$user || !$user instanceof User) {
            return response()->json(['message' => 'Invalid or unauthorized user'], Response::HTTP_UNAUTHORIZED);
        }

        $quizzes = Quiz::where('user_id', $user->id)
        ->withCount('questions')
        ->with(['attempts' => function($query) use ($user) {
            $query->where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->select(['id', 'quiz_id', 'score', 'time_taken', 'answers', 'created_at']);
        }])
        ->latest()
        ->get();

        return response()->json($quizzes);
    }

    /**
     * Store a newly created quiz in storage.
     */
    public function store(Request $request): JsonResponse
    {
        set_time_limit(1000);
        try {
            ini_set('max_execution_time', 240);
            Log::info('Starting quiz creation', ['request' => $request->all()]);

            $validated = $request->validate([
                'files' => 'required|array',
                'file.*' => 'string',
                'user_message' => 'required|string|max:1000',
                'question_count' => 'required|integer|min:5|max:15',
                'difficulty' => 'required|in:easy,medium,hard',
                'enable_timer' => 'required|in:0,1',
                'time_limit' => 'required|integer|min:0'
            ]);

            $apiKey = $request->header('X-API-Key');
            $user = $this->verify($apiKey);
            if (!$user || !$user instanceof User) {
                return response()->json(['message' => 'Invalid or unauthorized user'], Response::HTTP_UNAUTHORIZED);
            }



            $extractedText = '';
            forEach($validated['files'] as $file) {
                $extractedText .= "\n" . $this->getContent($file)->getData()->text;

            }
            Log::info('Extracted text from images', ['text' => $extractedText]);
            
            $systemMessage = "You are an expert quiz generator. Create a quiz based on these instructions:
            - User instructions: {$validated['user_message']}
            - Source text: {$extractedText}
            - Difficulty: {$validated['difficulty']}
            - Number of questions: {$validated['question_count']}
            - Format requirements:
                * Strictly return ONLY valid JSON without markdown
                * Ensure each question has 4 options
                * Include answer explanations
                 - Return the response in this exact format:
                {
                    'quiz': {
                        'title': 'Quiz Title in detected language',
                        'description': 'Quiz Description in detected language',
                        'difficulty': '{$validated['difficulty']}',
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

            $response = Http::timeout(90)->withHeaders([
                'Authorization' => 'Bearer ' . env('DEEPSEEK_API_KEY'),
                'Content-Type' => 'application/json'
            ])->post(env('DEEPSEEK_API_URL'), [
                'model' => 'deepseek-chat',
                'messages' => [
                    ['role' => 'system', 'content' => $systemMessage],
                    ['role' => 'user', 'content' => "Generate a quiz from this text:\n\n{$extractedText}"]
                ],
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

             // Extract the quiz data from the content field
             $content = preg_replace('/```json|```/','', $result['choices'][0]['message']['content']);
             $quizData = json_decode(trim($content), true);
             
             if (json_last_error() !== JSON_ERROR_NONE || !isset($quizData['quiz'])) {
                 Log::error('Invalid quiz structure', [
                     'content' => $content,
                     'error' => json_last_error_msg()
                 ]);
                 throw new \Exception('Invalid quiz data structure from API');
             }

            // Decode the JSON-like string in the content field
            $quizContent = $quizData['quiz'];
            $requiredKeys = ['title', 'description', 'difficulty', 'questions'];
            foreach ($requiredKeys as $key) {
                if (!isset($quizContent[$key])) {
                    throw new \Exception("Missing required quiz field: $key");
                }
            }
            
            // Validate questions
            foreach ($quizContent['questions'] as $index => $q) {
                if (!isset($q['question_text'], $q['options'], $q['correct_answer'])) {
                    throw new \Exception("Question $index missing required fields");
                }
                if (count($q['options']) !== 4) {
                    throw new \Exception("Question $index must have 4 options");
                }
            }


            $quiz = null;
            DB::transaction(function () use (&$quiz, $quizContent, $validated, $user) {
                $quiz = Quiz::create([
                    'title' => $quizContent['title'] ?? 'New Quiz',
                    'description' => $quizContent['description'] ?? 'Generated from uploaded content',
                    'user_id' => $user->id,
                    'difficulty' => $validated['difficulty'],
                    'settings' => [
                        'time_limit' => (int)$validated['time_limit'],
                        'enable_timer' => (bool)$validated['enable_timer'],
                        'question_count' => $validated['question_count'],
                        'layout' => $quizContent['layout'] ?? 'ltr',
                        'language' => $quizContent['language'] ?? 'en'
                    ]
                ]);

                $questions = [];
                foreach ($quizContent['questions'] as $index => $question) {
                    try {
                        $questions[] = [
                            'quiz_id' => $quiz->id,
                            'question_text' => $question['question_text'],
                            'question_type' => 'multiple_choice',
                            'options' => json_encode($question['options']),
                            'correct_answer' => $question['correct_answer'],
                            'explanation' => $question['explanation'] ?? '',
                            'order' => $index + 1,
                            'created_at' => now(),
                            'updated_at' => now()
                        ];
                    } catch (\Exception $e) {
                        Log::error("Skipping invalid question $index", [
                            'error' => $e->getMessage(),
                            'question' => $question
                        ]);
                    }
                }
                
                if (count($questions) < $validated['question_count']) {
                    throw new \Exception("Insufficient valid questions generated");
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
    
    public function getContent($file): JsonResponse
    {

        $input = $file;
        $tmpPrefix = tempnam(sys_get_temp_dir(), 'ocr_');

        try {
            // Determine source: data URI, URL, or raw base64
            if (preg_match('/^data:image\/(\w+);base64,/', $input, $match)) {
                // Strictly decode base64 data URI
                $base64Data = substr($input, strpos($input, ',') + 1);
                $data = base64_decode($base64Data, true);
                if ($data === false) {
                    throw new \Exception('Invalid base64 encoding in data URI');
                }
                $mime = finfo_buffer(finfo_open(FILEINFO_MIME_TYPE), $data);
                if (strpos($mime, 'image/') !== 0) {
                    throw new \Exception('Data URI did not contain valid image data, got: ' . $mime);
                }
                $ext = strtolower($match[1]);

            } elseif (filter_var($input, FILTER_VALIDATE_URL)) {
                // Fetch image from URL
                $headers = @get_headers($input, 1);
                $contentType = $headers['Content-Type'] ?? '';
                if (is_array($contentType)) {
                    $contentType = end($contentType);
                }
                if (strpos($contentType, 'image/') !== 0) {
                    throw new \Exception('URL did not return an image, got Content-Type: ' . $contentType);
                }
                $data = @file_get_contents($input);
                if ($data === false) {
                    throw new \Exception('Failed to download image from URL');
                }
                $mime = finfo_buffer(finfo_open(FILEINFO_MIME_TYPE), $data);
                if (strpos($mime, 'image/') !== 0) {
                    throw new \Exception('Downloaded file is not a valid image, got: ' . $mime);
                }
                $ext = explode('/', $mime)[1] ?? 'png';

            } elseif (preg_match('/^data:application\/pdf;base64,/', $input)) {
                // Handle base64 encoded PDF
                $base64Data = substr($input, strpos($input, ',') + 1);
                $data = base64_decode($base64Data, true);
                if ($data === false) {
                    throw new \Exception('Invalid base64 encoding in PDF data');
                }
                $mime = finfo_buffer(finfo_open(FILEINFO_MIME_TYPE), $data);
                if ($mime !== 'application/pdf') {
                    throw new \Exception('Base64 data is not a valid PDF, got: ' . $mime);
                }
                $ext = 'pdf';

                // Save PDF to temp file
                $filePath = "{$tmpPrefix}.{$ext}";
                if (file_put_contents($filePath, $data) === false) {
                    throw new \Exception('Failed to write PDF data to temporary file');
                }

                // Parse PDF content
                $parser = new \Smalot\PdfParser\Parser();
                $pdf = $parser->parseFile($filePath);
                $text = $pdf->getText();

                if (trim($text) === '') {
                    throw new \Exception('No text recognized in the PDF');
                }

                return response()->json([
                    'success' => true,
                    'text' => trim($text),
                ]);

            } else {
                // Raw base64 string
                $data = base64_decode($input, true);
                if ($data === false) {
                    throw new \Exception('Invalid base64 string');
                }
                $mime = finfo_buffer(finfo_open(FILEINFO_MIME_TYPE), $data);
                if (strpos($mime, 'image/') !== 0) {
                    throw new \Exception('Invalid base64 data: expected image but got ' . $mime);
                }
                $ext = explode('/', $mime)[1] ?? 'png';
            }

            // Save to temp file
            $filePath = "{$tmpPrefix}.{$ext}";
            if (file_put_contents($filePath, $data) === false) {
                throw new \Exception('Failed to write image data to temporary file');
            }

            // Run OCR
            $text = (new TesseractOCR($filePath))
            ->executable('C:\\Program Files\\Tesseract-OCR\\tesseract.exe')
            ->run();

            if (trim($text) === '') {
                throw new \Exception('No text recognized in the image');
            }

            return response()->json([
                'success' => true,
                'text' => trim($text),
            ]);

        } catch (\Throwable $e) {
            // Return structured error message
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'OCR processing failed',
            ], 422);

        } finally {
            // Cleanup files
            if (isset($filePath) && file_exists($filePath)) {
                unlink($filePath);
            }
            if (file_exists($tmpPrefix)) {
                unlink($tmpPrefix);
            }
        }
    }

    
    /**
     * Display the specified quiz.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $apiKey = $request->header('X-API-Key');
        $user = $this->verify($apiKey);
        if (!$user || !$user instanceof User) {
            return response()->json(['message' => 'Invalid or unauthorized user'], Response::HTTP_UNAUTHORIZED);
        }

        $quiz = Quiz::where('id', $id)
            ->where('user_id', $user->id)
            ->withCount('questions')
            ->with(['questions', 'attempts' => function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orderBy('created_at', 'desc')
                    ->select(['id', 'quiz_id', 'score', 'time_taken', 'answers', 'created_at']);
            }])
            ->first();

        if (!$quiz) {
            return response()->json(['message' => 'Quiz not found'], Response::HTTP_NOT_FOUND);
        }

        return response()->json($quiz);
    }

    /**
     * Update the specified quiz in storage.
     */
    public function update(Request $request, Quiz $quiz): JsonResponse
    {
        $apiKey = $request->header('X-API-Key');
        $user = $this->verify($apiKey);
        if (!$user || !$user instanceof User) {
            return response()->json(['message' => 'Invalid or unauthorized user'], Response::HTTP_UNAUTHORIZED);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'difficulty' => 'nullable|in:easy,medium,hard',
            'settings' => 'nullable|array',
        ]);

        $quiz->update($validated);

        return response()->json($quiz);
    }

    /**
     * Remove the specified quiz from storage.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $apiKey = $request->header('X-API-Key');
        $user = $this->verify($apiKey);
        if (!$user || !$user instanceof User) {
            return response()->json(['message' => 'Invalid or unauthorized user'], Response::HTTP_UNAUTHORIZED);
        }

        $quiz = Quiz::where('id', $id)->where('user_id', $user->id)->first();

        if (!$quiz) {
            return response()->json(['message' => 'Quiz not found'], Response::HTTP_NOT_FOUND);
        }

        $quiz->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}