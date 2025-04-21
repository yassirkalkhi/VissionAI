<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\WorkOS\Http\Middleware\ValidateSessionWithWorkOS;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\ImageUploadController;
use App\Http\Controllers\DeepSeekController;
use App\Http\Controllers\QuizzesController;
use App\Http\Controllers\DeepSeekChatController;
use Illuminate\Support\Facades\File;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Route to serve storage files directly (outside auth middleware)
Route::get('/storage/{path}', function ($path) {
    // Check if file exists in public storage
    $filePath = storage_path('app/public/' . $path);
    if (file_exists($filePath)) {
        $mimeType = File::mimeType($filePath);
        return response()->file($filePath, ['Content-Type' => $mimeType]);
    }
    abort(404);
})->where('path', '.*');

Route::middleware([
    'auth',
    ValidateSessionWithWorkOS::class,
])->group(function () {

    // Chat routes
    Route::get('/chat/c/{conversationId}', [ChatController::class, 'viewPublicConversation'])->name('chat.public');
    Route::get('/chat/{conversationId?}', [ChatController::class, 'index'])->name('chat.index');
    Route::get('/chat-stream', [ChatController::class, 'stream']);

    // Conversation management routes
    Route::post('/api/conversations', [ConversationController::class, 'create'])->name('conversation.create');
    Route::get('/api/conversations/{id}', [ConversationController::class, 'index'])->name('chat.get');
    Route::get('/api/conversations', [ConversationController::class, 'list'])->name('conversation.list');
    Route::patch('/api/conversations/{id}', [ConversationController::class, 'update'])->name('chat.update');
    Route::delete('/api/conversations/{id}', [ConversationController::class, 'destroy'])->name('chat.destroy');
    
    // Image upload route
    Route::post('/api/upload-images', [ImageUploadController::class, 'uploadImages'])->name('images.upload');
    
    // Quizzes routes
    Route::get('/quizzes', [QuizzesController::class, 'index'])->name('quizzes.index');
    Route::get('/quizzes/create', [QuizzesController::class, 'create'])->name('quizzes.create');
    Route::post('/quizzes', [QuizzesController::class, 'store'])->name('quizzes.store');
    Route::get('/quizzes/take/{id}', [QuizzesController::class, 'take'])->name('quizzes.take');
    Route::post('/quizzes/{id}/submit', [QuizzesController::class, 'submit'])->name('quizzes.submit');
    Route::get('/quizzes/{id}/submissions', [QuizzesController::class, 'submissions'])->name('quizzes.submissions');
    Route::get('/quizzes/{id}', [QuizzesController::class, 'show'])->name('quizzes.show');
    Route::put('/quizzes/{id}', [QuizzesController::class, 'update'])->name('quizzes.update');
    Route::delete('/quizzes/{id}', [QuizzesController::class, 'destroy'])->name('quizzes.destroy');

    // New route for saving partial responses from the chat
    Route::post('/api/save-partial-response', [ChatController::class, 'savePartialResponse'])->name('chat.save-partial-response');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
