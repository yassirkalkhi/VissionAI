<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\WorkOS\Http\Middleware\ValidateSessionWithWorkOS;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ConversationController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware([
    'auth',
    ValidateSessionWithWorkOS::class,
])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    Route::get('/chat/{conversationId?}', [ChatController::class, 'index'])->name('chat.index');
    Route::get('/chat-stream', [ChatController::class, 'stream']);
    Route::post('/api/chat', [ChatController::class, 'sendMessage'])->name('chat.send');
    Route::post('/api/conversations', [ChatController::class, 'create'])->name('chat.create');
    Route::patch('/api/conversations/{id}', [ConversationController::class, 'update'])->name('chat.update');
    Route::delete('/api/conversations/{id}', [ConversationController::class, 'destroy'])->name('chat.destroy');
});



require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
