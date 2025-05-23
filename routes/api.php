<?php

use App\Http\Controllers\Api\QuizController;
use App\Http\Middleware\AuthenticateWithApiKey;
use Illuminate\Support\Facades\Route;


Route::middleware([AuthenticateWithApiKey::class])->group(function () {
    // Quiz routes
    Route::apiResource('quizzes', QuizController::class);
});
