<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\User;
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
            ->with(['users:id,name', 'messages' => function($query) {
                $query->latest()->limit(1);
            }])
            ->withCount('messages')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($conversations);
    }

    /**
     * Create new conversation (1-on-1 or group)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
            'name' => 'nullable|string|max:255',
            'is_group' => 'boolean'
        ]);

        $userIds = $validated['user_ids'];
        $userIds[] = Auth::id(); // Add current user
        $userIds = array_unique($userIds);

        // Check if 1-on-1 conversation already exists
        if (count($userIds) === 2 && !($validated['is_group'] ?? false)) {
            $existing = Conversation::where('is_group', false)
                ->whereHas('users', function($query) use ($userIds) {
                    $query->whereIn('user_id', $userIds);
                }, '=', 2)
                ->first();

            if ($existing) {
                return response()->json($existing->load('users:id,name'), 200);
            }
        }

        $conversation = DB::transaction(function() use ($validated, $userIds) {
            $conversation = Conversation::create([
                'name' => $validated['name'] ?? null,
                'is_group' => $validated['is_group'] ?? (count($userIds) > 2)
            ]);

            $conversation->users()->attach($userIds);

            return $conversation;
        });

        return response()->json($conversation->load('users:id,name'), 201);
    }

    /**
     * Get single conversation
     */
    public function show(string $id)
    {
        $conversation = Conversation::whereHas('users', function($query) {
                $query->where('user_id', Auth::id());
            })
            ->with('users:id,name')
            ->findOrFail($id);

        return response()->json($conversation);
    }

    /**
     * Update conversation (name, etc.)
     */
    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255'
        ]);

        $conversation = Conversation::whereHas('users', function($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($id);

        $conversation->update($validated);

        return response()->json($conversation);
    }

    /**
     * Leave/delete conversation
     */
    public function destroy(string $id)
    {
        $conversation = Conversation::whereHas('users', function($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($id);

        // Remove user from conversation
        $conversation->users()->detach(Auth::id());

        // Delete conversation if no users left
        if ($conversation->users()->count() === 0) {
            $conversation->delete();
        }

        return response()->noContent();
    }
}