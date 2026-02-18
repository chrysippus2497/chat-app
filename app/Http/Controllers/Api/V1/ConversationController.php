<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConversationCollection;
use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ConversationController extends Controller
{
    /**
     * Get all user's conversations
     */
    public function index()
    {
        $conversations = Auth::user()->conversations()
            ->with([
                'users:id,name,email,created_at',
                'lastMessage.sender:id,name,email,created_at'
            ])
            ->withCount('messages')
            ->latest('updated_at')
            ->paginate(20);

        return new ConversationCollection($conversations);
    }

    /**
     * Create new conversation with duplicate prevention
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'required|exists:users,id|distinct',
            'name' => 'nullable|string|max:255',
            'is_group' => 'boolean'
        ]);

        // Prepare user IDs
        $userIds = array_unique([...$validated['user_ids'], Auth::id()]);
        $isGroup = $validated['is_group'] ?? (count($userIds) > 2);

        // Check for existing 1-on-1 conversation
        if (!$isGroup && count($userIds) === 2) {
            $existing = Conversation::where('is_group', false)
                ->whereHas('users', function($query) use ($userIds) {
                    $query->whereIn('user_id', $userIds);
                }, '=', 2)
                ->with(['users:id,name,email,created_at'])
                ->first();

            if ($existing) {
                return new ConversationResource($existing);
            }
        }

        // Create new conversation in transaction
        $conversation = DB::transaction(function() use ($validated, $userIds, $isGroup) {
            $conversation = Conversation::create([
                'name' => $validated['name'] ?? null,
                'is_group' => $isGroup
            ]);

            $conversation->users()->attach($userIds);

            return $conversation->load('users:id,name,email,created_at');
        });

        return new ConversationResource($conversation);
    }

    /**
     * Get single conversation
     */
    public function show(string $id)
    {
        $conversation = Auth::user()->conversations()
            ->with([
                'users:id,name,email,created_at',
                'lastMessage.sender:id,name,email,created_at'
            ])
            ->findOrFail($id);

        return new ConversationResource($conversation);
    }

    /**
     * Update conversation (name, etc.)
     */
    public function update(Request $request, string $id)
    {
        $conversation = Auth::user()->conversations()->findOrFail($id);

        $validated = $request->validate([
            'name' => 'nullable|string|max:255'
        ]);

        $conversation->update($validated);
        $conversation->load('users:id,name,email,created_at');

        return new ConversationResource($conversation);
    }

    /**
     * Leave/delete conversation
     */
    public function destroy(string $id)
    {
        $conversation = Auth::user()->conversations()->findOrFail($id);

        DB::transaction(function() use ($conversation) {
            // Remove current user
            $conversation->users()->detach(Auth::id());

            // Delete conversation if empty
            if ($conversation->users()->count() === 0) {
                $conversation->delete();
            }
        });

        return response()->json([
            'message' => 'Successfully left conversation'
        ], 200);
    }

     /**
     * Mark conversation messages as read
     */
    public function markAsRead(string $id)
    {
        $conversation = Auth::user()->conversations()->findOrFail($id);

        // If you have a read tracking system, implement it here
        // For now, just return success
        
        return response()->json([
            'message' => 'Marked as read'
        ], 200);
    }

    /**
     * Update typing status
     */
    public function typing(Request $request, string $id)
    {
        $conversation = Auth::user()->conversations()->findOrFail($id);

        $request->validate([
            'typing' => 'required|boolean'
        ]);

        // This would broadcast typing status in real-time
        // For now, just return success
        
        return response()->json([
            'message' => 'Typing status updated',
            'typing' => $request->typing
        ], 200);
    }
}