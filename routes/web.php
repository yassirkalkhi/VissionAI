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

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware([
    'auth',
    ValidateSessionWithWorkOS::class,
])->group(function () {

    // Chat routes
    Route::get('/chat/{conversationId?}', [ChatController::class, 'index'])->name('chat.index');
    Route::get('/chat-stream', [ChatController::class, 'stream']);

    // Conversation management routes
    Route::post('/api/conversations', [ConversationController::class, 'create'])->name('conversation.create');
    Route::get('/api/conversations/{id}', [ConversationController::class, 'index'])->name('chat.get');
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
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
