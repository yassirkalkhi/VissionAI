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
   
    /**
     * Display a listing of the resource.
     */
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


    /**
     * Create a new conversation
     */
    public function create(Request $request)
    {
        $validated = $request->validate([
            'images.*' => 'nullable|string',
            'extracted_text' => 'nullable|string',
        ]);

        $title = '';
        if (!empty($request->message)) {
            // Remove code blocks and trim
            $cleanMessage = preg_replace('/```[\s\S]*?```/', '', $request->message);
            $cleanMessage = trim($cleanMessage);
            
            //  first 50 characters
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

        // Process image attachments
        $attachments = [];
        if ($request->has('images')) {
            $attachments = $this->processAttachments($request->images);
        }

        // Create user message
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
 
    /**
     * Store resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the  resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        // Log incoming data for debugging
        \Log::info('Updating conversation', [
            'id' => $id,
            'request' => $request->all()
        ]);
        
        $conversation = Conversation::findOrFail($id);
        
        // Check ownership of conversation
        if ($conversation->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        // Validate request data
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'is_public' => 'sometimes|boolean',
        ]);
        
        // Update conversation
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

    /**
     * Delete a conversation
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
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


