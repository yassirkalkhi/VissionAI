<?php

use App\Http\Controllers\Api\QuizController;
use App\Http\Middleware\AuthenticateWithApiKey;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware([AuthenticateWithApiKey::class])->group(function () {
    // Quiz routes
    Route::apiResource('quizzes', QuizController::class);
});
Route::get('/text', [QuizController::class, 'getContent']);