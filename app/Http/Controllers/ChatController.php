<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ChatController extends Controller
{
  
    public function index(Request $request, $conversationId = null)
    {
        if ($conversationId) {
            $conversation = Conversation::findOrFail($conversationId);
            
            if ($conversation->user_id !== Auth::id()) {
                abort(403);
            }

            $messages = $conversation->messages()->orderBy('created_at')->get()->map(function ($message) {
                return [
                    'id' => $message->id,
                    'content' => $message->content,
                    'role' => $message->role,
                    'attachments' => $message->attachments,
                    'created_at' => $message->created_at,
                ];
            });
        } else {
            $conversation = null;
            $messages = [];
        }
        
        $conversations = Conversation::where('user_id', Auth::id())
            ->orderBy('updated_at', 'desc')
            ->get(['id', 'title', 'updated_at']);
        
        if ($conversationId) {
            return Inertia::render('chat', [
                'currentConversation' => $conversation,
                'messages' => $messages,
                'conversations' => $conversations,
            ]);
        } else {
            return Inertia::render('new', [
                'conversations' => $conversations,
            ]);
        }
    }

    public function create(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string',
            'images.*' => 'nullable|string',
        ]);

        $conversation = Conversation::create([
            'user_id' => Auth::id(),
            'title' => strlen($validated['message']) > 30 
                ? substr($validated['message'], 0, 30) . '...' 
                : $validated['message'],
        ]);

        // Create user message
        $userMessage = Message::create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => $validated['message'],
            'attachments' => $request->has('images') ? $this->processAttachments($request->images) : null,
        ]);

        // response
        try {
            $imagePaths = [];
            if ($request->has('images')) {
                foreach ($request->images as $path) {
                    $fullPath = storage_path('app/public/' . $path);
                    if (file_exists($fullPath)) {
                        $imagePaths[] = $fullPath;
                    }
                }
            }

            $response = $this->callDeepSeekApi($validated['message'], $imagePaths);
            
            $aiMessage = Message::create([
                'conversation_id' => $conversation->id,
                'role' => 'assistant',
                'content' => $response,
                'attachments' => null,
            ]);
        } catch (\Exception $e) {
            Log::error('AI API error: ' . $e->getMessage());
            
            $aiMessage = Message::create([
                'conversation_id' => $conversation->id,
                'role' => 'assistant',
                'content' => 'Sorry, I encountered an error processing your request. Please try again later.',
                'attachments' => null,
            ]);
        }

        return response()->json([
            'id' => $conversation->id,
            'title' => $conversation->title,
        ]);
    }

 
    public function sendMessage(Request $request)
    {
        set_time_limit(1000);
        
        $validated = $request->validate([
            'message' => 'nullable|string',
            'images.*' => 'nullable|image|max:10240',
            'conversation_id' => 'required|exists:conversations,id',
        ]);
        
        $conversation = Conversation::findOrFail($validated['conversation_id']);
        
        
        if ($conversation->user_id !== Auth::id()) {
            abort(403);
        }
        

        $imageUrls = [];
        $imagePaths = [];
        
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('chat-images', 'public');
                $fullPath = storage_path('app/public/' . $path);
                $imagePaths[] = $fullPath;
                $imageUrls[] = [
                    'url' => Storage::url($path),
                    'contentType' => $image->getMimeType(),
                ];
            }
        }
        
    
        $userMessage = Message::create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => $validated['message'] ?? '',
            'attachments' => count($imageUrls) > 0 ? $imageUrls : null,
        ]);
        
        $conversation->touch();
        
        if ($conversation->messages()->count() === 1 && !empty($validated['message'])) {
            $title = strlen($validated['message']) > 30 
                ? substr($validated['message'], 0, 30) . '...' 
                : $validated['message'];
            
            $conversation->update(['title' => $title]);
        }
        
        try {
            $response = $this->callDeepSeekApi($validated['message'] ?? '', $imagePaths);
            
            $aiMessage = Message::create([
                'conversation_id' => $conversation->id,
                'role' => 'assistant',
                'content' => $response,
                'attachments' => null,
            ]);
            
            return response()->json([
                'message' => $aiMessage->content,
                'messageId' => $aiMessage->id,
                'success' => true,
            ]);
            
        } catch (\Exception $e) {
            Log::error('Ollama API error: ' . $e->getMessage());
            
            $errorMessage = Message::create([
                'conversation_id' => $conversation->id,
                'role' => 'assistant',
                'content' => 'Sorry, I encountered an error processing your request. Please try again later.',
                'attachments' => null,
            ]);
            
            return response()->json([
                'message' => $errorMessage->content,
                'messageId' => $errorMessage->id,
                'error' => $e->getMessage(),
                'success' => false,
            ], 500);
        }
    }
    

    private function callOllamaLlava(string $message, array $imagePaths): string
    {
        set_time_limit(1000);
        if (!$this->isOllamaAvailable()) {
            Log::warning('Ollama not available, using mock response');
            echo "Ollama is not available. Please check the service.";
        }
        
        $prompt = "You are a helpful assistant that can understand images and text. ";
        
    
        if (!empty($message)) {
            $prompt .= "User message: $message\n";
        }
        
        $payload = [
            'model' => 'llava',
            'prompt' => $prompt,
            'stream' => false,
        ];
        
        if (count($imagePaths) > 0) {
            $images = [];
            foreach ($imagePaths as $path) {
                try {
                    $imageData = base64_encode(file_get_contents($path));
                    $images[] = $imageData;
                } catch (\Exception $e) {
                    Log::error('Error processing image: ' . $e->getMessage());
                }
            }
            
            if (count($images) > 0) {
                $payload['images'] = $images;
            }
        }
        
        try {
            $response = Http::timeout(600000)->post('http://localhost:11434/api/generate', $payload);
            
            if (!$response->successful()) {
                Log::error('Ollama API error: ' . $response->body());
                throw new \Exception('Failed to get response from Ollama: ' . $response->status());
            }
            
            $responseData = $response->json();
            return $responseData['response'] ?? 'No response from AI';
            
        } catch (\Exception $e) {
            Log::error('Ollama API exception: ' . $e->getMessage());
            
            if (str_contains($e->getMessage(), 'Connection refused') || 
                str_contains($e->getMessage(), 'Failed to connect') ||
                str_contains($e->getMessage(), 'timeout')) {
                Log::warning('Connection to Ollama failed, using mock response');
                return $this->getMockResponse($message, count($imagePaths));
            }
            
            throw $e;
        }
    }
 
    private function isOllamaAvailable(): bool
    {
        try {
            $response = Http::timeout(2)->get('http://localhost:11434/api/tags');
            return $response->successful();
        } catch (\Exception $e) {
            Log::info('Ollama availability check failed: ' . $e->getMessage());
            return false;
        }
    }

    private function callDeepSeekApi(string $message, array $imagePaths){
        $payload = [
            "messages" => [
                [
                    "role" => "user",
                    "content" => $message
                ]
            ],
            "model" => "deepseek-r1-distill-llama-70b",
            "stream" => false
        ];

        if (count($imagePaths) > 0) {
            $images = [];
            foreach ($imagePaths as $path) {
                try {
                    $imageData = base64_encode(file_get_contents($path));
                    $images[] = $imageData;
                } catch (\Exception $e) {
                    Log::error('Error processing image: ' . $e->getMessage());
                }
            }
            
            if (count($images) > 0) {
                $payload['messages'][0]['images'] = $images;
            }
        }

        try {
            $response = Http::timeout(600)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . env('GROQ_API_KEY'),
                ])
                ->post(env('GROQ_URL'), $payload);
            
            if (!$response->successful()) {
                Log::error('DeepSeek API error: ' . $response->body());
                throw new \Exception('Failed to get response from DeepSeek: ' . $response->status());
            }
            
            $responseData = $response->json();
            if (isset($responseData['choices']) && is_array($responseData['choices']) && count($responseData['choices']) > 0) {
                return $responseData['choices'][0]['message']['content'] ?? 'No response from AI';
            }
            
            return 'No valid response from DeepSeek API';
            
        } catch (\Exception $e) {
            Log::error('DeepSeek API exception: ' . $e->getMessage());
            throw $e;
        }
    }
    public function stream(Request $request)
    {
        return new \Symfony\Component\HttpFoundation\StreamedResponse(function () use ($request) {
            try {
                set_time_limit(1000);
                $conversation = Conversation::findOrFail($request->conversation_id);
                if (!$conversation) {
                    abort(404);
                }
                if ($conversation->user_id !== Auth::id()) {
                    abort(403);
                }

                //  user message
                $userMessage = Message::create([
                    'conversation_id' => $conversation->id,
                    'role' => 'user',
                    'content' => $request->message,
                    'attachments' => $this->processAttachments($request->images ?? []),
                ]);

                //  assistant message
                $assistantMessage = Message::create([
                    'conversation_id' => $conversation->id,
                    'role' => 'assistant',
                    'content' => '',
                    'is_streaming' => true,
                ]);
                
                //  payload
                $payload = [
                    "messages" => [
                        [
                            "role" => "system",
                            "content" => ""
                        ],
                        [
                            "role" => "user",
                            "content" => $request->message
                        ]
                    ],
                    "model" => "deepseek-r1-distill-llama-70b",
                    "stream" => true
                ];
                
                // Process images
                if (isset($request->images) && count($request->images) > 0) {
                    $images = [];
                    foreach ($request->images as $path) {
                        try {
                            $fullPath = storage_path('app/public/' . $path);
                            $imageData = base64_encode(file_get_contents($fullPath));
                            $images[] = $imageData;
                        } catch (\Exception $e) {
                            Log::error('Error processing image: ' . $e->getMessage());
                        }
                    }
                    if (count($images) > 0) {
                        $payload['messages'][0]['images'] = $images;
                    }
                }
                
                $response = Http::timeout(600)
                    ->withHeaders(['Authorization' => 'Bearer ' . env('GROQ_API_KEY')])
                    ->withOptions(['stream' => true])
                    ->post(env('GROQ_URL'), $payload);
                    
                $body = $response->toPsrResponse()->getBody();
                $contentBuffer = '';
                $buffer = '';
                
                while (!$body->eof()) {
                    $chunk = $body->read(1024);
                    $buffer .= $chunk;
                    
                    // Process complete events
                    while (($pos = strpos($buffer, "\n\n")) !== false) {
                        $event = substr($buffer, 0, $pos);
                        $buffer = substr($buffer, $pos + 2);
                        
                        if (strpos($event, 'data: ') === 0) {
                            $jsonData = trim(substr($event, 6)); 
                            
                            if ($jsonData === '[DONE]') {
                                // Stream is complete
                                break;
                            }
                            
                            try {
                                $data = json_decode($jsonData, true);
                                
                                if (isset($data['choices'][0]['delta']['content'])) {
                                    $contentChunk = $data['choices'][0]['delta']['content'];
                                    $contentBuffer .= $contentChunk;
                                    
                                    echo "data: " . json_encode([
                                        'content' => $contentChunk,
                                        'finished' => false
                                    ]) . "\n\n";
                                    ob_flush();
                                    flush();
                                } 
                                
                                if (isset($data['choices'][0]['finish_reason']) && $data['choices'][0]['finish_reason']) {
                                    // Mark as completed
                                    $assistantMessage->update([
                                        'content' => $contentBuffer,
                                        'is_streaming' => false
                                    ]);
                                    
                                    echo "data: " . json_encode([
                                        'content' => '',
                                        'finished' => true
                                    ]) . "\n\n";
                                    ob_flush();
                                    flush();
                                }
                            } catch (\Exception $e) {
                                Log::error('JSON decode error: ' . $e->getMessage() . ' - Data: ' . $jsonData);
                            }
                        }
                    }
                    
                    if (connection_aborted()) break;
                }
                
                if ($assistantMessage->is_streaming) {
                    $assistantMessage->update([
                        'content' => $contentBuffer,
                        'is_streaming' => false
                    ]);
                    
                    echo "data: " . json_encode([
                        'content' => '',
                        'finished' => true
                    ]) . "\n\n";
                    ob_flush();
                    flush();
                }
                
            } catch (\Exception $e) {
                \Log::error('Stream error: ' . $e->getMessage());
                echo "data: " . json_encode([
                    'content' => "\n\nError: " . $e->getMessage(),
                    'finished' => true
                ]) . "\n\n";
                ob_flush();
                flush();
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    private function processAttachments(array $imagePaths): array
    {
        return array_map(function ($path) {
            return [
                'url' => Storage::url($path),
                'contentType' => Storage::mimeType($path) ?? 'image/jpeg',
            ];
        }, $imagePaths);
    }
    
}

