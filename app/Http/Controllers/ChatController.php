<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ChatController extends Controller
{
    protected $deepSeekController;

    public function __construct(DeepSeekController $deepSeekController)
    {
        $this->deepSeekController = $deepSeekController;
    }

    /**
     * Display the chat interface
     */
    public function index(Request $request, $conversationId = null)
    {
        if ($conversationId) {
            $conversation = Conversation::findOrFail($conversationId);
            
            if ($conversation->user_id !== Auth::id()) {
                abort(403);
            }

            $messages = $conversation->messages()
                ->orderBy('created_at')
                ->get()
                ->map(function ($message) {
                    return [
                        'id' => $message->id,
                        'content' => $message->content,
                        'role' => $message->role,
                        'attachments' => $message->attachments,
                        'isStreaming' => $message->is_streaming ?? false,
                        'extractedText' => $message->extracted_text,
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

 


    
    /**
     * Stream a response from the AI
     */
    public function stream(Request $request)
    {
        return new StreamedResponse(function () use ($request) {
            try {
                set_time_limit(1000);
                $conversation = Conversation::findOrFail($request->conversation_id);
                
                if ($conversation->user_id !== Auth::id()) {
                    abort(403);
                }

                $attachments = [];
                if (isset($request->images) && is_array($request->images)) {
                    $attachments = $this->processAttachments($request->images);
                }

                $isNewConversation = $conversation->messages()->count() === 1;
                
                
                if (!$isNewConversation) {
                    $userMessage = Message::create([
                        'conversation_id' => $conversation->id,
                        'role' => 'user',
                        'content' => $request->message ?? '',
                        'attachments' => $attachments,
                        'extracted_text' => $request->extracted_text ?? '',
                    ]);
                }

                
                $assistantMessage = Message::create([
                    'conversation_id' => $conversation->id,
                    'role' => 'assistant',
                    'content' => '',
                    'is_streaming' => true,
                ]);
                
                
                $onChunk = function($contentChunk) {
                    echo "data: " . json_encode([
                        'content' => $contentChunk,
                        'finished' => false
                    ]) . "\n\n";
                    ob_flush();
                    flush();
                };
                
                $onComplete = function($contentBuffer) use ($assistantMessage) {
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
                };
                
                
                $this->deepSeekController->callDeepseek($request, $onChunk, $onComplete);
                
            } catch (\Exception $e) {
                Log::error('Stream error: ' . $e->getMessage());
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

    /**
     * Process image attachments
     */
    private function processAttachments(array $imagePaths): array
    {
        return array_map(function ($path) {
            $mimeType = Storage::mimeType($path) ?? 'image/jpeg';
            return [
                'url' => Storage::url($path),
                'contentType' => $mimeType,
            ];
        }, $imagePaths);
    }
    
   
}

