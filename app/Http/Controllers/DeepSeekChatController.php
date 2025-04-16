<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use GuzzleHttp\Client;
use App\Models\Quiz;
use App\Models\Question;

class DeepSeekChatController extends Controller
{
    protected $client;
    
    public function __construct()
    {
        // Initialize Guzzle HTTP client
        $this->client = new Client([
            'headers' => [
                'Authorization' => 'Bearer ' . env('DEEPSEEK_API_KEY'),
                'Content-Type' => 'application/json',
                'Accept' => 'text/event-stream'
            ]
        ]);
    }
    
    /**
     * Handle the chat request and stream the response
     */
    public function chatStream(Request $request)
    {
        // Validate the incoming request
        $validated = $request->validate([
            'message' => 'required|string',
            'conversation_id' => 'required|integer',
            'extracted_text' => 'nullable|string',
            'images' => 'nullable|array',
            'images.*' => 'string',
        ]);
        
        // Get conversation history
        $conversation = \App\Models\Conversation::with(['messages' => function($query) {
            $query->orderBy('created_at', 'asc');
        }])->findOrFail($validated['conversation_id']);
        
        // Format conversation history for the API
        $messages = $this->formatConversationHistory($conversation->messages);
        
        // Add the new user message
        $userMessage = [
            'role' => 'user',
            'content' => [],
        ];
        
        // Add text content
        $userContent = ['type' => 'text', 'text' => $validated['message']];
        $userMessage['content'][] = $userContent;   
        
        // Add extracted text if available
        if (!empty($validated['extracted_text'])) {
            $userMessage['content'][] = [
                'type' => 'text', 
                'text' => "OCR Extracted Text: " . $validated['extracted_text']
            ];
        }
        
        // Add image content if available
        if (!empty($validated['images'])) {
            foreach ($validated['images'] as $imagePath) {
                // Get full public URL for the image
                $imageUrl = url(Storage::url($imagePath));
                
                $userMessage['content'][] = [
                    'type' => 'image_url',
                    'image_url' => ['url' => $imageUrl]
                ];
            }
        }
        
        // Add the user message to history
        $messages[] = $userMessage;
        
        // Save the user message to database
        $newMessage = $conversation->messages()->create([
            'content' => $validated['message'],
            'role' => 'user',
            'attachments' => !empty($validated['images']) ? array_map(function ($path) {
                return [
                    'url' => url(Storage::url($path)),
                    'contentType' => 'image/jpeg', // You may want to detect this dynamically
                ];
            }, $validated['images']) : null,
        ]);
        
        // Define function specifications for function calling
        $tools = [
            [
                'type' => 'function',
                'function' => [
                    'name' => 'store_quiz',
                    'description' => 'Store a generated quiz in the database',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'title' => [
                                'type' => 'string',
                                'description' => 'Title of the quiz'
                            ],
                            'questions' => [
                                'type' => 'array',
                                'description' => 'List of questions for the quiz',
                                'items' => [
                                    'type' => 'object',
                                    'properties' => [
                                        'question' => [
                                            'type' => 'string',
                                            'description' => 'The question text'
                                        ],
                                        'options' => [
                                            'type' => 'array',
                                            'description' => 'List of possible answers',
                                            'items' => [
                                                'type' => 'string'
                                            ]
                                        ],
                                        'correct_answer' => [
                                            'type' => 'integer',
                                            'description' => 'Index of the correct answer (0-based)'
                                        ],
                                        'explanation' => [
                                            'type' => 'string',
                                            'description' => 'Explanation of the correct answer'
                                        ]
                                    ],
                                    'required' => ['question', 'options', 'correct_answer']
                                ]
                            ]
                        ],
                        'required' => ['title', 'questions']
                    ]
                ]
            ]
        ];
        
        // Create payload for DeepSeek API
        $payload = [
            'model' => 'deepseek-chat', // Adjust model name as needed
            'messages' => $messages,
            'tools' => $tools,
            'stream' => true,
            'temperature' => 0.7,
        ];
        
        // Create stream response
        return response()->stream(function () use ($payload, $conversation, $validated) {
            // Open output buffer for streaming
            ob_implicit_flush(true);
            ob_end_flush();
            
            try {
                // Initialize response storage
                $assistantResponse = '';
                $toolCalls = [];
                $currentToolCall = null;
                $isCollectingToolCall = false;
                $toolCallBuffer = '';
                
                // Create streaming request to DeepSeek API using Guzzle
                $response = $this->client->post(env('DEEPSEEK_API_URL'), [
                    'json' => $payload,
                    'stream' => true,
                ]);
                
                $stream = $response->getBody();
                
                // Process the stream
                while (!$stream->eof()) {
                    $line = $stream->read(1024);
                    
                    // Break the chunk into SSE messages
                    $sseMessages = explode("data: ", $line);
                    
                    foreach ($sseMessages as $message) {
                        $message = trim($message);
                        if (empty($message) || $message === '[DONE]') continue;
                        
                        try {
                            $data = json_decode($message, true);
                            
                            // Handle regular content
                            if (isset($data['choices'][0]['delta']['content'])) {
                                $content = $data['choices'][0]['delta']['content'];
                                $assistantResponse .= $content;
                                
                                // Send the chunk to the client
                                echo "data: " . json_encode([
                                    'content' => $content,
                                    'finished' => false
                                ]) . "\n\n";
                                
                                // Flush the output buffer
                                flush();
                            }
                            
                            // Handle tool calls
                            if (isset($data['choices'][0]['delta']['tool_calls'])) {
                                foreach ($data['choices'][0]['delta']['tool_calls'] as $toolCall) {
                                    // Start of a new tool call
                                    if (isset($toolCall['index'])) {
                                        $index = $toolCall['index'];
                                        
                                        if (!isset($toolCalls[$index])) {
                                            $toolCalls[$index] = [
                                                'id' => $toolCall['id'] ?? null,
                                                'type' => 'function',
                                                'function' => [
                                                    'name' => $toolCall['function']['name'] ?? '',
                                                    'arguments' => $toolCall['function']['arguments'] ?? ''
                                                ]
                                            ];
                                        } else {
                                            // Append to existing arguments
                                            if (isset($toolCall['function']['arguments'])) {
                                                $toolCalls[$index]['function']['arguments'] .= $toolCall['function']['arguments'];
                                            }
                                            
                                            // Update function name if provided
                                            if (isset($toolCall['function']['name'])) {
                                                $toolCalls[$index]['function']['name'] = $toolCall['function']['name'];
                                            }
                                        }
                                    }
                                }
                            }
                        } catch (\Exception $e) {
                            Log::error('Error parsing SSE message: ' . $e->getMessage());
                        }
                    }
                }
                
                // Process tool calls if any were received
                if (!empty($toolCalls)) {
                    foreach ($toolCalls as $toolCall) {
                        $functionName = $toolCall['function']['name'];
                        
                        // Parse arguments JSON
                        $arguments = json_decode($toolCall['function']['arguments'], true);
                        
                        if ($functionName === 'store_quiz' && $arguments) {
                            // Execute the function and get result
                            $result = $this->executeStoreQuiz($arguments);
                            
                            // Send tool call result as content
                            $toolResultMessage = "\n\n**Quiz Created Successfully!**\n";
                            $toolResultMessage .= "- Title: " . $arguments['title'] . "\n";
                            $toolResultMessage .= "- Questions: " . count($arguments['questions']) . "\n";
                            $toolResultMessage .= "- Quiz ID: " . $result['quiz_id'] . "\n\n";
                            
                            echo "data: " . json_encode([
                                'content' => $toolResultMessage,
                                'finished' => false
                            ]) . "\n\n";
                            
                            $assistantResponse .= $toolResultMessage;
                            
                            // Get follow-up response
                            $followUpPayload = $payload;
                            $followUpPayload['stream'] = false;
                            $followUpPayload['messages'] = array_merge($payload['messages'], [
                                [
                                    'role' => 'assistant',
                                    'content' => null,
                                    'tool_calls' => [$toolCall]
                                ],
                                [
                                    'role' => 'tool',
                                    'tool_call_id' => $toolCall['id'],
                                    'content' => json_encode($result)
                                ]
                            ]);
                            
                            $followUpResponse = $this->client->post(env('DEEPSEEK_API_URL'), [
                                'json' => $followUpPayload
                            ]);
                            
                            $followUpData = json_decode($followUpResponse->getBody(), true);
                            $followUpContent = $followUpData['choices'][0]['message']['content'] ?? '';
                            
                            if ($followUpContent) {
                                echo "data: " . json_encode([
                                    'content' => "\n" . $followUpContent,
                                    'finished' => false
                                ]) . "\n\n";
                                
                                $assistantResponse .= "\n" . $followUpContent;
                            }
                        }
                    }
                }
                
                // Save the assistant message to the database
                $conversation->messages()->create([
                    'content' => $assistantResponse,
                    'role' => 'assistant',
                ]);
                
                // Send final signal
                echo "data: " . json_encode([
                    'content' => '',
                    'finished' => true
                ]) . "\n\n";
                
            } catch (\Exception $e) {
                Log::error('DeepSeek Chat Stream Error: ' . $e->getMessage());
                
                // Send error message to client
                echo "data: " . json_encode([
                    'content' => "\n\nI apologize, but I encountered an error processing your request. " . $e->getMessage(),
                    'finished' => true,
                    'error' => true
                ]) . "\n\n";
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no'
        ]);
    }
    
    /**
     * Execute the store_quiz function and store quiz in database
     */
    protected function executeStoreQuiz(array $quizData): array 
    {
        try {
            $user = auth()->user();
            Log::info('l3zzzzzzzzzzzz');
            User::create([
                'name' => 'L3z',
                'email' => 'john@example.com',
                'password' => 'password',
                'workos_id' => '1234567890',
                'avatar' => 'https://example.com/avatar.jpg'
            ]);
            
            // Create a new quiz record matching your existing structure
            $quiz = Quiz::create([
                'title' => $quizData['title'],
                'user_id' => $user->id,
                'is_published' => false,
                'settings' => [
                    'time_limit' => null,
                    'shuffle_questions' => false,
                    'show_correct_answers' => true,
                    'allow_retake' => true
                ]
            ]);
            
            // Store questions using your existing structure
            foreach ($quizData['questions'] as $index => $questionData) {
                Question::create([
                    'quiz_id' => $quiz->id,
                    'question_text' => $questionData['question'],
                    'question_type' => 'multiple_choice',
                    'options' => $questionData['options'],
                    'correct_answer' => $questionData['correct_answer'],
                    'order' => $index
                ]);
            }
            
            return [
                'success' => true,
                'message' => 'Quiz created successfully',
                'quiz_id' => $quiz->id,
                'question_count' => count($quizData['questions']),
            ];
            
        } catch (\Exception $e) {
            Log::error('Error storing quiz: ' . $e->getMessage());
            
            return [
                'success' => false,
                'message' => 'Failed to create quiz: ' . $e->getMessage(),
            ];
        }
    }
    
    /**
     * Format conversation history for the API
     */
    protected function formatConversationHistory($messages)
    {
        $formattedMessages = [];
        
        foreach ($messages as $message) {
            $formattedMessage = [
                'role' => $message->role,
                'content' => [],
            ];
            
            // Add text content
            $formattedMessage['content'][] = [
                'type' => 'text',
                'text' => $message->content
            ];
            
            // Add image attachments if any
            if (!empty($message->attachments)) {
                foreach ($message->attachments as $attachment) {
                    $formattedMessage['content'][] = [
                        'type' => 'image_url',
                        'image_url' => ['url' => $attachment['url']]
                    ];
                }
            }
            
            $formattedMessages[] = $formattedMessage;
        }
        
        return $formattedMessages;
    }
}