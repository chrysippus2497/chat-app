<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\MessageCollection;
use App\Http\Resources\MessageResource;
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
        abort_unless(
            $conversation->users->contains(Auth::id()),
            403,
            'Unauthorized access to conversation'
        );

        $messages = $conversation->messages()
            ->with('sender:id,name,email,created_at')
            ->oldest('created_at')
            ->paginate(50);

        return new MessageCollection($messages);
    }

    /**
     * Send a message
     */
    public function store(Request $request, Conversation $conversation)
    {
        // Authorization
        abort_unless(
            $conversation->users->contains(Auth::id()),
            403,
            'Unauthorized access to conversation'
        );

        $validated = $request->validate([
            'content' => 'required|string|max:10000'
        ]);

        $message = $conversation->messages()->create([
            'sender_id' => Auth::id(),
            'content' => $validated['content']
        ]);

        // Update conversation timestamp
        $conversation->touch();

        $message->load('sender:id,name,email,created_at');

        return new MessageResource($message);
    }


    /**
     * Get a single message
     */
    public function show(Message $message)
    {
        // Authorization
        abort_unless(
            $message->conversation->users->contains(Auth::id()),
            403,
            'Unauthorized access to message'
        );

        $message->load('sender:id,name,email,created_at');

        return new MessageResource($message);
    }

    /**
     * Update a message (edit)
     */
    public function update(Request $request, Message $message)
    {
        // Only sender can edit
        abort_unless(
            $message->sender_id === Auth::id(),
            403,
            'You can only edit your own messages'
        );

        $validated = $request->validate([
            'content' => 'required|string|max:10000'
        ]);

        $message->update($validated);
        $message->load('sender:id,name,email,created_at');

        return new MessageResource($message);
    }

    /**
     * Delete a message
     */
    public function destroy(Message $message)
    {
        // Only sender can delete
        abort_unless(
            $message->sender_id === Auth::id(),
            403,
            'You can only delete your own messages'
        );

        $message->delete();

        return response()->json([
            'message' => 'Message deleted successfully'
        ], 200);
    }
}