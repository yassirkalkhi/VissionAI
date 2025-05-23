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
use App\Http\Controllers\StreamResponseController;

class ChatController extends Controller
{
    protected $streamResponseController;

    public function __construct(StreamResponseController $streamResponseController)
    {
        $this->streamResponseController = $streamResponseController;
    }

    
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
                
                
                $this->streamResponseController->stream($request, $onChunk, $onComplete);
                
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

    
    private function processAttachments(array $imagePaths): array
    {
        return array_map(function ($path) {
            $mimeType = Storage::mimeType($path) ?? 'image/jpeg';
            $appUrl = config('app.url');
            
            
            if (strpos($appUrl, ':8000') === false) {
                $appUrl = rtrim($appUrl, '/') . ':8000';
            }
            
            return [
                'url' => $appUrl . '/storage/' . $path,
                'contentType' => $mimeType,
            ];
        }, $imagePaths);
    }
    

    public function savePartialResponse(Request $request)
    {
        try {
            
            $validated = $request->validate([
                'conversation_id' => 'required|integer',
                'content' => 'required|string',
                'role' => 'required|string|in:assistant',
                'is_partial' => 'required|boolean'
            ]);

            
            $conversation = Conversation::findOrFail($validated['conversation_id']);
            
            if ($conversation->user_id !== Auth::id()) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            
            $message = Message::where('conversation_id', $conversation->id)
                ->where('role', 'assistant')
                ->where('is_streaming', true)
                ->latest()
                ->first();

            
            if ($message) {
                $message->update([
                    'content' => $validated['content'] . "\n\n[Generation stopped by user]",
                    'is_streaming' => false
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Partial response saved successfully'
                ]);
            } else {
                
                Message::create([
                    'conversation_id' => $conversation->id,
                    'role' => 'assistant',
                    'content' => $validated['content'] . "\n\n[Generation stopped by user]",
                    'is_streaming' => false
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'New message created with partial response'
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error saving partial response: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to save partial response: ' . $e->getMessage()
            ], 500);
        }
    }


    public function viewPublicConversation($conversationId)
    {
        $conversation = Conversation::findOrFail($conversationId);
        
        
        if (!$conversation->is_public) {
            abort(403, 'This conversation is not public');
        }
        
        $messages = $conversation->messages()
            ->orderBy('created_at')
            ->get()
            ->map(function ($message) {
                return [
                    'id' => $message->id,
                    'content' => $message->content,
                    'role' => $message->role,
                    'attachments' => $message->attachments ? json_decode($message->attachments) : [],
                    'created_at' => $message->created_at,
                ];
            });
        
        return Inertia::render('PublicConversation', [
            'conversation' => $conversation,
            'messages' => $messages,
        ]);
    }
}

