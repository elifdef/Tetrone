<?php

namespace App\Services;

use App\Events\ChatDeletedEvent;
use App\Http\Resources\UserBasicResource;
use App\Models\Chat;
use App\Models\ChatParticipant;
use App\Models\Friendship;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Str;

class ChatService
{
    public function getUserChats(int $userId)
    {
        return Chat::whereHas('participants', fn($q) => $q->where('user_id', $userId))
            ->with([
                'participants' => fn($q) => $q->withTrashed()->where('user_id', '!=', $userId)->with('user'),
                'messages' => fn($q) => $q->latest()->limit(1)
            ])
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($chat)
            {
                $lastMsg = $chat->messages->first();
                $targetParticipant = $chat->participants->first();
                $firstMsg = Message::where('chat_id', $chat->id)->oldest()->first();

                $lastMsgText = '';
                if ($lastMsg)
                {
                    $payload = ChatEncryptionService::decryptPayload($lastMsg->encrypted_payload, $chat->encrypted_dek);
                    $lastMsgText = $payload['text'] ?? (empty($payload['files']) ? 'Post' : 'Media');
                }

                return [
                    'slug' => $chat->slug,
                    'created_at' => $chat->created_at,
                    'initiator_id' => $firstMsg?->sender_id,
                    'updated_at' => $chat->updated_at,
                    'target_user' => ($targetParticipant && $targetParticipant->user)
                        ? (new UserBasicResource($targetParticipant->user))->resolve()
                        : null,
                    'last_message' => $lastMsgText,
                    'last_message_sender_id' => $lastMsg?->sender_id,
                    'unread_count' => 0
                ];
            });
    }

    public function getOrCreatePrivateChat(User $user, int $targetId): array|Chat
    {
        $isBlocked = Friendship::where(fn($q) => $q->where('user_id', $user->id)->where('friend_id', $targetId))
            ->orWhere(fn($q) => $q->where('user_id', $targetId)->where('friend_id', $user->id))
            ->where('status', Friendship::STATUS_BLOCKED)->exists();

        if ($isBlocked)
        {
            return [
                'error' => 'ERR_USER_BLOCKED',
                'message' => 'Cannot create chat due to privacy settings.',
                'status' => 403
            ];
        }

        $chat = Chat::where('type', 'private')
            ->whereHas('participants', fn($q) => $q->withTrashed()->where('user_id', $user->id))
            ->whereHas('participants', fn($q) => $q->withTrashed()->where('user_id', $targetId))
            ->first();

        if ($chat)
        {
            // Якщо я раніше видалив цей чат - відновлюю свою участь
            $myParticipant = $chat->participants()->withTrashed()->where('user_id', $user->id)->first();
            if ($myParticipant && $myParticipant->trashed())
            {
                $myParticipant->restore();
            }

            return $chat;
        }

        // Якщо чату реально ніколи не було - створюємо новий
        $chat = Chat::create([
            'slug' => Str::random(12),
            'type' => 'private',
            'encrypted_dek' => ChatEncryptionService::generateEncryptedChatKey()
        ]);

        ChatParticipant::insert([
            ['chat_id' => $chat->id, 'user_id' => $user->id, 'created_at' => now(), 'updated_at' => now()],
            ['chat_id' => $chat->id, 'user_id' => $targetId, 'created_at' => now(), 'updated_at' => now()],
        ]);

        return $chat;
    }

    public function deleteChat(Chat $chat, User $user, bool $forBoth): void
    {
        if ($forBoth)
        {
            $targetParticipant = $chat->participants()->where('user_id', '!=', $user->id)->first();
            $chat->delete();
            if ($targetParticipant)
            {
                broadcast(new ChatDeletedEvent($chat->slug, $targetParticipant->user_id));
            }
        } else
        {
            $chat->participants()->where('user_id', $user->id)->delete();
        }
    }
}