<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Conversation;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use App\Models\Quiz;
use App\Models\Question;

class DeepSeekController extends Controller
{
    /**
     * Define available functions/tools that the AI can use
     * Each function has a name, description, and parameters
     */
    private $functions = [
        [
            'type' => 'function',
            'function' => [
                'name' => 'save_quiz', 
                'description' => 'You MUST use this function to save the quiz you generated on the system . When asked to generate a quiz, first generate the quiz content  (do not show it in chat just a little summary).  After saving, respond with a message mentioning the quiz title and asking if they would like to modify it or create another quiz. The quiz data must be in this format: {"quiz":{"title":"Quiz Title","questions":[{"question":"Question text","options":["Option 1","Option 2","Option 3","Option 4"],"correct_answer":"Correct answer"}]}}',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'quiz' => [
                            'type' => 'object',
                            'properties' => [
                                'title' => ['type' => 'string'],
                                'questions' => ['type' => 'array']
                            ],
                            'required' => ['title', 'questions']
                        ]
                    ],
                    'required' => ['quiz']
                ]
            ]
        ],
     
       
    ];

    /**
     * Save a quiz to the server
     * This function stores the quiz data in the database
     * 
     * @param string $quiz The quiz data in JSON format
     * @return string JSON encoded response
     */
    public function save_quiz($quiz)
    {
        try {
            // Check if quiz data is empty
            if (empty($quiz)) {
                throw new \Exception('Quiz data is empty');
            }

            // Decode the quiz data
            $quizData = json_decode($quiz, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \Exception('Invalid quiz data format');
            }

            // Handle nested quiz structure
            if (isset($quizData['quiz'])) {
                $quizData = $quizData['quiz'];
            }

            // Validate quiz data
            if (empty($quizData) || !isset($quizData['title']) || !isset($quizData['questions']) || empty($quizData['questions'])) {
                throw new \Exception('Invalid quiz data: missing required fields');
            }

            // Get the authenticated user
            $user = auth()->user();
            if (!$user) {
                throw new \Exception('User not authenticated');
            }

            // Create the quiz
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

            // Create questions
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

            // Return a success response that the AI can understand
            return json_encode([
                'status' => 'success',
                'message' => 'The quiz has been successfully saved!',
                'quiz' => [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'question_count' => count($quizData['questions'])
                ]
            ]);
            
        } catch (\Exception $e) {
            return json_encode([
                'status' => 'error',
                'message' => 'The system encountered an error while saving the quiz return an apology message to the user and tell him to try again',
            ]);
        }
    }

    /**
     * Main method to handle DeepSeek API calls
     * This method:
     * 1. Prepares the conversation history
     * 2. Makes the API call
     * 3. Handles streaming responses
     * 4. Processes tool calls
     * 5. Returns the final response
     * 
     * @param Request $request The HTTP request
     * @param callable $onChunk Callback for streaming chunks
     * @param callable $onComplete Callback for completion
     * @return string The final response
     */
        public function callDeepseek(Request $request, callable $onChunk, callable $onComplete)
    {
        set_time_limit(1000);

        $extractedText = $request->extracted_text ?? '';
        $hasExtractedText = !empty($extractedText);
        $userMessage = $request->message ?? 'Please analyze this document';

        $systemPrompt = "You ARE VisionAI Assistant that can help generate responses, The user may have uploaded an images, and the text has been extracted from it. The extracted text is provided in a separate message. If the user asks about the text in the image, refer to the extracted text in your response and give him a short summary about what in that image  and ask him if he want to  generate a quiz about it . When asked to generate a quiz: Generate the quiz  (do not display it just say to him that the quiz generated if you want to save it), Save the quiz when the user indicates they want to save it  When saving, use the save_quiz function with the quiz data in this format: {\"quiz\":{\"title\":\"Quiz Title\",\"questions\":[{\"question\":\"Question text\",\"options\":[\"Option 1\",\"Option 2\",\"Option 3\",\"Option 4\"],\"correct_answer\":\"Correct answer\"}]}}, 5) After saving, confirm with the quiz title and ask if they want to modify it or create another quiz.";
        $messages = [
            [
                'role' => 'system',
                'content' => $systemPrompt
            ]
        ];

        if ($request->has('conversation_id')) {
            $conversation = Conversation::find($request->conversation_id);
            if ($conversation) {
                $historyMessages = $conversation->messages()
                    ->orderBy('created_at')
                    ->get();

                foreach ($historyMessages as $historyMessage) {
                    $messageContent = $historyMessage->content;

                    if ($historyMessage->role === 'user' && !empty($historyMessage->extracted_text)) {
                        $messages[] = [
                            "role" => "user",
                            "content" => $messageContent
                        ];

                        $messages[] = [
                            "role" => "user",
                            "content" => "Here is the text extracted from the image:\n" . $historyMessage->extracted_text
                        ];
                    } else {
                        $messages[] = [
                            "role" => $historyMessage->role,
                            "content" => $messageContent
                        ];
                    }
                }
            }
        }

        // Add the current user message
        $messages[] = [
            'role' => 'user',
            'content' => $userMessage
        ];

        // Add extracted text if present
        if ($hasExtractedText) {
            $messages[] = [
                'role' => 'user',
                'content' => "Here is the text extracted from the images:\n" . $extractedText
            ];
        }

        try {
            // Make the API call with streaming enabled
            $response = Http::timeout(600)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . env('DEEPSEEK_API_KEY'),
                    'Content-Type' => 'application/json',
                    'Accept' => 'text/event-stream'
                ])
                ->withOptions(['stream' => true])
                ->post(env('DEEPSEEK_API_URL'), [
                    'model' => 'deepseek-chat',
                    'messages' => $messages,
                    'tools' => $this->functions,
                    'tool_choice' => 'auto',
                    'temperature' => 0.7,
                    'stream' => true,
                ]);

            // Check if the API call was successful
            if (!$response->successful()) {

                throw new \Exception('API request failed: ' . $response->status());
            }

            // Get the response body for streaming
            $body = $response->toPsrResponse()->getBody();
            $contentBuffer = '';
            $buffer = '';
            $toolCalls = [];
            $currentToolCall = null;

            // Process the streaming response
            while (!$body->eof()) {
                try {
                    // Read a chunk of data
                    $chunk = $body->read(1024);
                    if (empty($chunk)) {
                        continue;
                    }
                    $buffer .= $chunk;

                    // Process complete events in the buffer
                    while (($pos = strpos($buffer, "\n\n")) !== false) {
                        $event = substr($buffer, 0, $pos);
                        $buffer = substr($buffer, $pos + 2);

                        // Process data events
                        if (strpos($event, 'data: ') === 0) {
                            $jsonData = trim(substr($event, 6));

                            if ($jsonData === '[DONE]') {
                                break;
                            }

                            try {
                                // Parse the JSON data
                                $data = json_decode($jsonData, true);
                                if (json_last_error() !== JSON_ERROR_NONE) {
                                    continue;
                                }

                                // Handle content chunks
                                if (isset($data['choices'][0]['delta']['content'])) {
                                    $contentChunk = $data['choices'][0]['delta']['content'];
                                    if (!empty($contentChunk)) {
                                        $contentBuffer .= $contentChunk;
                                        $onChunk($contentChunk);
                                    }
                                }

                                // Handle tool calls
                                if (isset($data['choices'][0]['delta']['tool_calls'])) {
                                    foreach ($data['choices'][0]['delta']['tool_calls'] as $toolCall) {
                                        if (isset($toolCall['id'])) {
                                            $currentToolCall = [
                                                'id' => $toolCall['id'],
                                                'type' => $toolCall['type'] ?? null,
                                                'function' => [
                                                    'name' => $toolCall['function']['name'] ?? null,
                                                    'arguments' => $toolCall['function']['arguments'] ?? ''
                                                ]
                                            ];
                                            $toolCalls[$toolCall['id']] = $currentToolCall;
                                        } elseif ($currentToolCall) {
                                            if (isset($toolCall['function']['arguments'])) {
                                                $toolCalls[$currentToolCall['id']]['function']['arguments'] .= $toolCall['function']['arguments'];
                                            }
                                            if (isset($toolCall['function']['name']) && empty($toolCalls[$currentToolCall['id']]['function']['name'])) {
                                                $toolCalls[$currentToolCall['id']]['function']['name'] = $toolCall['function']['name'];
                                            }
                                        }
                                    }
                                }
                            }catch (\Exception $e) {
                                Log::error('Error processing chunk data', [
                                    'error' => $e->getMessage(),
                                    'data' => $jsonData
                                ]);
                                continue;
                            }
                        }
                    }
                } catch (\Exception $e) {
                    Log::error('Error reading from stream', ['error' => $e->getMessage()]);
                    break;
                }
            }

            // Process any tool calls that were made
            if (!empty($toolCalls)) {
                foreach ($toolCalls as $toolCall) {
                    if (isset($toolCall['function']['name'])) {
                        try {
                                // Call the appropriate function based on the tool name
                                switch ($toolCall['function']['name']) {    
                                    case 'save_quiz':
                                        if(isset($toolCall['function']['arguments'])) {
                                            $arguments = json_decode($toolCall['function']['arguments'], true);
                                            if (json_last_error() === JSON_ERROR_NONE) {
                                                $result = $this->save_quiz($toolCall['function']['arguments']);
                                                $resultData = json_decode($result, true);
                                                
                                                if ($resultData['status'] === 'success') {
                                                    // Add the tool call and result to the conversation
                                                    $messages[] = [
                                                        'role' => 'assistant',
                                                        'content' => null,
                                                        'tool_calls' => [$toolCall]
                                                    ];
                                                    
                                                    $messages[] = [
                                                        'role' => 'tool',
                                                        'tool_call_id' => $toolCall['id'],
                                                        'content' => $result
                                                    ];

                                                    // Send immediate confirmation
                                                    $quizTitle = $arguments['quiz']['title'] ?? 'Quiz';
                                                    $successMessage = "The quiz titled **\"{$quizTitle}\"** has been successfully saved! Let me know if you'd like to modify it or create another quiz.";
                                                    $onChunk($successMessage);
                                                    $onComplete($successMessage);
                                                    return $successMessage;
                                                } else {
                                                    $errorMessage = "I apologize, but there was an error saving the quiz. Please try again.";
                                                    $onChunk($errorMessage);
                                                    $onComplete($errorMessage);
                                                    return $errorMessage;
                                                }
                                            }
                                        } else {
                                            // If quiz data is empty, return an error message
                                            $errorMessage = "I apologize, but I couldn't generate a valid quiz from the document. Would you like me to try again with different questions?";
                                            $onChunk($errorMessage);
                                            $onComplete($errorMessage);
                                            return $errorMessage;
                                        }
                                        break;
                                
                                if ($result) {
                                    // Add the tool call and result to the conversation
                                $messages[] = [
                                    'role' => 'assistant',
                                    'content' => null,
                                        'tool_calls' => [$toolCall]
                                ];
                                
                                $messages[] = [
                                    'role' => 'tool',
                                    'tool_call_id' => $toolCall['id'],
                                    'content' => $result
                                ];

                                    Log::info('Sending follow-up request', ['messages' => $messages]);

                                    // Make a follow-up request with the tool result
                                $followUpResponse = Http::timeout(600)
                                    ->withHeaders([
                                        'Authorization' => 'Bearer ' . env('DEEPSEEK_API_KEY'),
                                        'Content-Type' => 'application/json',
                                        'Accept' => 'text/event-stream'
                                    ])
                                    ->withOptions(['stream' => true])
                                        ->post(env('DEEPSEEK_API_URL'), [
                                            'model' => 'deepseek-chat',
                                            'messages' => $messages,
                                            'temperature' => 0.7,
                                            'max_tokens' => 2000,
                                            'stream' => true,
                                        ]);

                                if (!$followUpResponse->successful()) {
                                        Log::error('Follow-up request failed', [
                                            'status' => $followUpResponse->status(),
                                            'body' => $followUpResponse->body()
                                        ]);
                                    throw new \Exception('Follow-up request failed: ' . $followUpResponse->status());
                                }

                                    // Process the follow-up response
                                $followUpBody = $followUpResponse->toPsrResponse()->getBody();
                                $followUpBuffer = '';
                                $followUpContent = '';

                                while (!$followUpBody->eof()) {
                                        try {
                                    $chunk = $followUpBody->read(1024);
                                    $followUpBuffer .= $chunk;

                                    while (($pos = strpos($followUpBuffer, "\n\n")) !== false) {
                                        $event = substr($followUpBuffer, 0, $pos);
                                        $followUpBuffer = substr($followUpBuffer, $pos + 2);

                                        if (strpos($event, 'data: ') === 0) {
                                            $jsonData = trim(substr($event, 6));

                                            if ($jsonData === '[DONE]') {
                                                break;
                                            }

                                            try {
                                                $data = json_decode($jsonData, true);
                                                if (json_last_error() === JSON_ERROR_NONE && 
                                                    isset($data['choices'][0]['delta']['content'])) {
                                                    $contentChunk = $data['choices'][0]['delta']['content'];
                                                    if (!empty($contentChunk)) {
                                                        $followUpContent .= $contentChunk;
                                                        $onChunk($contentChunk);
                                                    }
                                                }
                                            } catch (\Exception $e) {
                                                        Log::error('Error processing follow-up chunk data', [
                                                            'error' => $e->getMessage(),
                                                            'data' => $jsonData
                                                        ]);
                                                    }
                                                }
                                            }
                                        } catch (\Exception $e) {
                                            Log::error('Error reading from follow-up stream', ['error' => $e->getMessage()]);
                                            break;
                                        }
                                    }

                                    // Return the combined content
                                if (!empty($followUpContent)) {
                                    $onComplete($contentBuffer . "\n\n" . $followUpContent);
                                    return $contentBuffer . "\n\n" . $followUpContent;
                                } else {
                                    $onChunk("\n\n" . $result);
                                    $onComplete($contentBuffer . "\n\n" . $result);
                                    return $contentBuffer . "\n\n" . $result;
                                    }
                                }
                            }
                        } catch (\Exception $e) {
                            Log::error('Failed to process tool call', [
                                'error' => $e->getMessage(),
                                'toolCall' => $toolCall
                            ]);
                        }
                    }
                }
            }

            // If we have content but no tool calls, return it
            if (!empty($contentBuffer)) {
                $onComplete($contentBuffer);
                return $contentBuffer;
            }

            // Log if no content or tool calls were processed
            Log::error('No content or tool calls processed', [
                'messages' => $messages,
                'tool_calls' => $toolCalls
            ]);

            // Return default error message
            $defaultMessage = "I apologize, but I couldn't process your request. Please try again";
            $onComplete($defaultMessage);
            return $defaultMessage;

        } catch (\Exception $e) {
            // Log any errors that occur during the process
            Log::error('Error in callDeepseek', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            $errorMessage = "I apologize, but there was an error processing your request. Please try again.";
            $onComplete($errorMessage);
            return $errorMessage;
        }
    }
}