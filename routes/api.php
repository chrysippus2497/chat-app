<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ConversationController;
use App\Http\Controllers\Api\V1\MessageController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::prefix('v1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Protected routes
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
    // Conversations
    Route::apiResource('conversations', ConversationController::class);
    
    // Additional conversation routes
    Route::post('conversations/{conversation}/read', [ConversationController::class, 'markAsRead']);
    Route::post('conversations/{conversation}/typing', [ConversationController::class, 'typing']);
    
    // Messages (nested under conversations)
    Route::get('conversations/{conversation}/messages', [MessageController::class, 'index']);
    Route::post('conversations/{conversation}/messages', [MessageController::class, 'store']);
    Route::delete('messages/{message}', [MessageController::class, 'destroy']);
});