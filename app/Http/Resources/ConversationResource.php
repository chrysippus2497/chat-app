<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Get the other user's name (for 1-on-1 chats)
        $otherUser = $this->users
            ->where('id', '!=', auth()->id())
            ->first();

        return [
            'id' => $this->id,
            'name' => $this->is_group 
                ? $this->name 
                : ($otherUser ? $otherUser->name : 'Unknown'),
            'is_group' => $this->is_group,
            'users' => UserResource::collection($this->whenLoaded('users')),
            'last_message' => $this->whenLoaded('lastMessage', function() {
                return [
                    'body' => $this->lastMessage->content,
                    'created_at' => $this->lastMessage->created_at,
                ];
            }),
            'unread_count' => $this->unread_count ?? 0, // ← Add default value
            'messages_count' => $this->when(
                $this->relationLoaded('messages'),
                fn() => $this->messages->count()
            ),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
