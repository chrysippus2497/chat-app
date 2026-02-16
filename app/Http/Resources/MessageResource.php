<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'content' => $this->content,
            'sender' => new UserResource($this->whenLoaded('sender')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Future-ready fields
            // 'is_read' => $this->is_read,
            // 'read_at' => $this->read_at?->toISOString(),
            // 'attachments' => AttachmentResource::collection($this->whenLoaded('attachments')),
        ];
    }
}
