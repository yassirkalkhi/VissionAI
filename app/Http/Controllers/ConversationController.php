<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\Storage;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ConversationController extends Controller
{
    private  function processAttachments(array $imagePaths): array
     {
       return array_map(function ($path) {
           $mimeType = Storage::mimeType($path) ?? 'image/jpeg';
           return [
               'url' => Storage::url($path),
               'contentType' => $mimeType,
           ];
       }, $imagePaths);
   }
   
    
    public function index($id)
    {
        $conversation = Conversation::findOrFail($id);
        
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
        
        return response()->json([
            'id' => $conversation->id,
            'title' => $conversation->title,
            'messages' => $messages,
        ]);
    }
    public function list()
    {
        $conversations = Conversation::where('user_id', auth()->id())
            ->orderBy('updated_at', 'desc')
            ->get();
        return response()->json($conversations);
    }


        
    public function create(Request $request)
    {
        $validated = $request->validate([
            'images.*' => 'nullable|string',
            'extracted_text' => 'nullable|string',
        ]);

        $title = '';
        if (!empty($request->message)) {
            
            $cleanMessage = preg_replace('/```[\s\S]*?```/', '', $request->message);
            $cleanMessage = trim($cleanMessage);
            
            
            $firstLine = strtok($cleanMessage, "\n") ?: $cleanMessage;
            $title = strlen($firstLine) > 50 ? substr($firstLine, 0, 47) . '...' : $firstLine;
        }

        if (empty($title)) {
            $title = 'Chat ' . now()->format('M j, Y g:i A');
        }

        $conversation = Conversation::create([
            'user_id' => Auth::id(),
            'title' => $title,
        ]);

        
        $attachments = [];
        if ($request->has('images')) {
            $attachments = $this->processAttachments($request->images);
        }

        
        $userMessage = Message::create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => $request->message ?? '',
            'attachments' => $attachments,
            'extracted_text' => $validated['extracted_text'] ?? null,
        ]);

        return response()->json([
            'id' => $conversation->id,
            'title' => $conversation->title,
            'message_id' => $userMessage->id,
        ]);
    }
 
    
    public function store(Request $request)
    {
        //
    }

    public function show(string $id)
    {
        //
    }

    
    public function edit(string $id)
    {
        //
    }

    
    public function update(Request $request, $id)
    {
        
        $conversation = Conversation::findOrFail($id);
        
        if ($conversation->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'is_public' => 'sometimes|boolean',
        ]);
        
        $conversation->update($validated);
        
        \Log::info('Conversation updated', [
            'id' => $id,
            'conversation' => $conversation->toArray()
        ]);
        
        return response()->json([
            'success' => true, 
            'conversation' => $conversation
        ]);
    }

    
    public function destroy($id)
    {
        $conversation = Conversation::findOrFail($id);
        
        if ($conversation->user_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }
        
        $conversation->delete();
        
        return response()->json([
            'success' => true,
        ]);
    }
}


