<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Conversation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MessageController extends Controller
{
    /**
     * Get all messages for a conversation
     */
    public function index(Conversation $conversation)
    {
        // Check if user is part of the conversation
        if (!$conversation->users->contains(auth()->id())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $messages = $conversation->messages()
            ->with('sender:id,name')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($messages);
    }

    /**
     * Send a message
     */
    public function store(Request $request, Conversation $conversation)
    {
        // Check if user is part of the conversation
        if (!$conversation->users->contains(auth()->id())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string'
        ]);

        $message = $conversation->messages()->create([
            'sender_id' => auth()->id(),  // Changed from user_id
            'content' => $validated['content']
        ]);

        $message->load('sender:id,name');  // Changed from user

        return response()->json($message, 201);
    }

    /**
     * Get a single message
     */
    public function show(string $id)
    {
        $message = Message::with('sender:id,name')
            ->whereHas('conversation.users', function($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($id);

        return response()->json($message);
    }

    /**
     * Update a message (edit)
     */
    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'content' => 'required|string|max:5000'
        ]);

        $message = Message::where('sender_id', Auth::id())
            ->findOrFail($id);

        $message->update($validated);

        return response()->json($message);
    }

    /**
     * Delete a message
     */
    public function destroy(string $id)
    {
        $message = Message::where('sender_id', Auth::id())
            ->findOrFail($id);

        $message->delete();

        return response()->noContent();
    }
}