<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

// Breeze default routes (keep these)
Route::get('/', function () {
    return view('welcome');
});

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::get('/chat', function () {
    // Create API token for React to use
    $user = auth()->user();
    $token = $user->createToken('chat-token')->plainTextToken;
    
    return view('chat', [
        'token' => $token
    ]);
})->middleware(['auth'])->name('chat');

require __DIR__.'/auth.php';