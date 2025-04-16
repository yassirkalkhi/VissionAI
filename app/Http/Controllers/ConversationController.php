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

    /**
     * Create a new conversation
     */
    public function create(Request $request)
    {
        $validated = $request->validate([
            'images.*' => 'nullable|string',
            'extracted_text' => 'nullable|string',
        ]);

        $conversation = Conversation::create([
            'user_id' => Auth::id(),
            'title' => strlen($request->message) > 30 
                ? substr($request->message, 0, 30) . '...' 
                : 'New Conversation',
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
     * Store a newly created resource in storage.
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
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update a conversation's title
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $conversation = Conversation::findOrFail($id);
        
        if ($conversation->user_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }
        
        $validated = $request->validate([
            'title' => 'required|string|max:255',
        ]);
        
        $conversation->update([
            'title' => $validated['title'],
        ]);
        
        return response()->json([
            'success' => true,
            'conversation' => $conversation,
        ],200);
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
        
        // Soft delete the conversation (this will automatically set the deleted_at timestamp)
        $conversation->delete();
        
        return response()->json([
            'success' => true,
        ]);
    }
}


