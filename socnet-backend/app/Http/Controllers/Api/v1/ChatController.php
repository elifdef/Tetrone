<?php

namespace App\Http\Controllers\Api\v1;

use App\Events\MessagesReadEvent;
use App\Http\Resources\UserBasicResource;
use App\Models\Chat;
use App\Models\ChatParticipant;
use App\Models\Message;
use App\Models\User;
use App\Notifications\NewMessageNotification;
use App\Services\ChatEncryptionService;
use App\Http\Resources\PostResource;
use App\Events\MessageDeletedEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Http\JsonResponse;

class ChatController extends Controller
{
    /**
     * Отримати список усіх чатів користувача
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        $myId = Auth::id();

        $chats = Chat::whereHas('participants', function ($q) use ($myId)
        {
            $q->where('user_id', $myId);
        })
            ->with(['participants' => function ($q) use ($myId)
            {
                $q->where('user_id', '!=', $myId)->with('user');
            }, 'messages' => function ($q)
            {
                $q->latest()->limit(1);
            }])
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($chat)
            {
                $lastMsg = $chat->messages->first();
                $targetParticipant = $chat->participants->first();

                $firstMsg = Message::where('chat_id', $chat->id)->oldest()->first();
                $initiatorId = $firstMsg ? $firstMsg->sender_id : null;

                $lastMsgText = '';
                $lastMsgSenderId = null;

                if ($lastMsg)
                {
                    $lastMsgSenderId = $lastMsg->sender_id;
                    $payload = ChatEncryptionService::decryptPayload($lastMsg->encrypted_payload, $chat->encrypted_dek);
                    $lastMsgText = $payload['text'] ?? (empty($payload['files']) ? 'Post' : 'Media');
                }

                return [
                    'slug' => $chat->slug,
                    'created_at' => $chat->created_at,
                    'initiator_id' => $initiatorId,
                    'updated_at' => $chat->updated_at,
                    'target_user' => (new UserBasicResource($targetParticipant ? $targetParticipant->user : null))->resolve(),
                    'last_message' => $lastMsgText,
                    'last_message_sender_id' => $lastMsgSenderId,
                    'unread_count' => 0
                ];
            });

        return $this->success('CHATS_RETRIEVED', 'Chats retrieved successfully', $chats);
    }

    /**
     * Отримати існуючий або створити новий чат
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getOrCreateChat(Request $request): JsonResponse
    {
        $request->validate(['target_user_id' => 'required|exists:users,id']);
        $myId = Auth::id();
        $targetId = $request->target_user_id;

        $chat = Chat::where('type', 'private')
            ->whereHas('participants', fn($q) => $q->where('user_id', $myId))
            ->whereHas('participants', fn($q) => $q->where('user_id', $targetId))
            ->first();

        if (!$chat)
        {
            $chat = Chat::create([
                'slug' => Str::random(12),
                'type' => 'private',
                'encrypted_dek' => ChatEncryptionService::generateEncryptedChatKey()
            ]);

            ChatParticipant::insert([
                ['chat_id' => $chat->id, 'user_id' => $myId, 'created_at' => now(), 'updated_at' => now()],
                ['chat_id' => $chat->id, 'user_id' => $targetId, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        return $this->success('CHAT_INITIALIZED', 'Chat initialized', ['chat_slug' => $chat->slug]);
    }

    /**
     * Відправити повідомлення
     *
     * @param Request $request
     * @param string $slug
     * @return JsonResponse
     */
    public function sendMessage(Request $request, $slug): JsonResponse
    {
        $request->validate([
            'text' => 'nullable|string|max:65536',
            'shared_post_id' => 'nullable|exists:posts,id',
            'reply_to_id' => 'nullable|exists:messages,id',
            'media' => 'nullable|array|max:10',
            'media.*' => 'file|mimes:jpeg,png,jpg,gif,webp,mp4,mov,webm,mp3,wav,pdf,doc,docx,zip,rar|max:' . config('uploads.max_size', 51200)
        ]);

        if (!$request->text && !$request->hasFile('media') && !$request->shared_post_id)
        {
            return $this->error('ERR_EMPTY_MESSAGE', 'Message cannot be empty', 422);
        }

        $chat = Chat::where('slug', $slug)->firstOrFail();
        $user = $request->user();

        if (!$chat->participants()->where('user_id', $user->id)->exists())
        {
            return $this->error('ERR_FORBIDDEN', 'Forbidden', 403);
        }

        $savedFiles = [];
        if ($request->hasFile('media'))
        {
            foreach ($request->file('media') as $file)
            {
                $filename = Str::random(64) . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs($user->username . '/messages', $filename, 'public');
                $savedFiles[] = $path;
            }
        }

        $payload = [
            'text' => $request->text ?? '',
            'files' => $savedFiles
        ];

        $encryptedPayload = ChatEncryptionService::encryptPayload($payload, $chat->encrypted_dek);

        $message = Message::create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'shared_post_id' => $request->shared_post_id,
            'reply_to_id' => $request->reply_to_id,
            'encrypted_payload' => $encryptedPayload,
            'is_system' => false
        ]);

        $targetParticipant = $chat->participants()->where('user_id', '!=', $user->id)->first();

        if ($targetParticipant)
        {
            $prefs = $targetParticipant->user->getNotificationPreferencesFor($user->id, 'messages');

            if ($prefs['should_notify'])
            {
                $targetParticipant->user->notify(new NewMessageNotification(
                    $user, $message, $chat->slug, $chat->encrypted_dek, $prefs['sound']
                ));
            }
        }

        $chat->touch();

        return $this->success('MESSAGE_SENT', 'Message sent', ['message_id' => $message->id]);
    }

    /**
     * Оновити повідомлення
     *
     * @param Request $request
     * @param string $slug
     * @param int $messageId
     * @return JsonResponse
     */
    public function updateMessage(Request $request, $slug, $messageId): JsonResponse
    {
        $request->validate([
            'text' => 'nullable|string|max:4096',
            'deleted_media' => 'nullable|array',
            'deleted_media.*' => 'string',
            'media' => 'nullable|array|max:10',
            'media.*' => 'file|mimes:jpeg,png,jpg,gif,webp,mp4,mov,webm,mp3,wav,pdf,doc,docx,zip,rar|max:' . config('uploads.max_size', 51200)
        ]);

        $chat = Chat::where('slug', $slug)->firstOrFail();
        $message = Message::where('id', $messageId)->where('chat_id', $chat->id)->firstOrFail();
        $user = $request->user();

        if ($message->sender_id !== $user->id)
        {
            return $this->error('ERR_NOT_YOUR_MESSAGE', 'Not your message', 403);
        }

        $oldPayload = ChatEncryptionService::decryptPayload($message->encrypted_payload, $chat->encrypted_dek);
        $currentFiles = $oldPayload['files'] ?? [];

        if ($request->has('deleted_media'))
        {
            foreach ($request->deleted_media as $fileToDelete)
            {
                if (in_array($fileToDelete, $currentFiles))
                {
                    Storage::disk('public')->delete($fileToDelete);
                    $currentFiles = array_diff($currentFiles, [$fileToDelete]);
                }
            }
            $currentFiles = array_values($currentFiles);
        }

        if ($request->hasFile('media'))
        {
            foreach ($request->file('media') as $file)
            {
                $filename = Str::random(64) . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs($user->username . '/messages', $filename, 'public');
                $currentFiles[] = $path;
            }
        }

        if (empty($request->text) && empty($currentFiles) && !$message->shared_post_id)
        {
            return $this->error('ERR_EMPTY_MESSAGE', 'Message cannot be empty', 422);
        }

        $newPayload = [
            'text' => $request->text ?? '',
            'files' => $currentFiles
        ];

        $message->update([
            'encrypted_payload' => ChatEncryptionService::encryptPayload($newPayload, $chat->encrypted_dek),
            'is_edited' => true
        ]);

        return $this->success('MESSAGE_UPDATED', 'Message updated', ['edited_at' => $message->updated_at]);
    }

    /**
     * Отримати повідомлення чату
     *
     * @param string $slug
     * @return JsonResponse
     */
    public function getMessages($slug): JsonResponse
    {
        $chat = Chat::where('slug', $slug)->firstOrFail();

        if (!$chat->participants()->where('user_id', Auth::id())->exists())
        {
            return $this->error('ERR_FORBIDDEN', 'Forbidden', 403);
        }

        $messages = Message::with(['sharedPost.user', 'sharedPost.attachments', 'repliedMessage.sender'])
            ->where('chat_id', $chat->id)
            ->orderBy('created_at', 'desc')
            ->paginate(30);

        $messages->getCollection()->transform(function ($msg) use ($chat)
        {
            $payload = ChatEncryptionService::decryptPayload($msg->encrypted_payload, $chat->encrypted_dek);

            $fileUrls = [];
            if (!empty($payload['files']))
            {
                foreach ($payload['files'] as $file)
                {
                    $fileUrls[] = [
                        'name' => basename($file),
                        'url' => asset('storage/' . $file)
                    ];
                }
            }

            $replyData = null;
            if ($msg->repliedMessage)
            {
                $replyPayload = ChatEncryptionService::decryptPayload($msg->repliedMessage->encrypted_payload, $chat->encrypted_dek);
                $replyData = [
                    'id' => $msg->repliedMessage->id,
                    'text' => $replyPayload['text'] ?? 'Медіафайл',
                    'sender_name' => current(explode(' ', $msg->repliedMessage->sender->first_name))
                ];
            }

            return [
                'id' => $msg->id,
                'sender_id' => $msg->sender_id,
                'text' => $payload['text'] ?? '',
                'files' => $fileUrls,
                'shared_post' => $msg->shared_post_id ? (new PostResource($msg->sharedPost))->resolve() : null,
                'reply_to' => $replyData,
                'is_pinned' => $msg->is_pinned,
                'created_at' => $msg->created_at,
                'is_edited' => $msg->is_edited,
                'edited_at' => $msg->is_edited ? $msg->updated_at : null,
                'isMine' => $msg->sender_id === Auth::id(),
                'read_at' => $msg->read_at,
            ];
        });

        return $this->success('MESSAGES_RETRIEVED', 'Messages loaded', [
            'data' => $messages->items(),
            'meta' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage()
            ]
        ]);
    }

    /**
     * Видалити повідомлення
     *
     * @param string $slug
     * @param int $messageId
     * @return JsonResponse
     */
    public function destroyMessage($slug, $messageId): JsonResponse
    {
        $chat = Chat::where('slug', $slug)->firstOrFail();
        $message = Message::where('id', $messageId)->where('chat_id', $chat->id)->firstOrFail();

        /** @var User $user */
        $user = Auth::user();

        if ($message->sender_id !== $user->id)
        {
            return $this->error('ERR_NOT_YOUR_MESSAGE', 'Not your message', 403);
        }

        $payload = ChatEncryptionService::decryptPayload($message->encrypted_payload, $chat->encrypted_dek);

        if (!empty($payload['files']))
        {
            foreach ($payload['files'] as $file)
            {
                Storage::disk('public')->delete($file);
            }
        }

        $message->delete();

        $targetParticipant = $chat->participants()->where('user_id', '!=', $user->id)->first();
        if ($targetParticipant)
        {
            broadcast(new MessageDeletedEvent($chat->slug, $messageId, $targetParticipant->user_id));
        }

        return $this->success('MESSAGE_DELETED', 'Message deleted');
    }

    /**
     * Видалити чат
     *
     * @param string $slug
     * @param Request $request
     * @return JsonResponse
     */
    public function destroyChat($slug, Request $request): JsonResponse
    {
        $chat = Chat::where('slug', $slug)->firstOrFail();

        if (!$chat->participants()->where('user_id', Auth::id())->exists())
        {
            return $this->error('ERR_FORBIDDEN', 'Forbidden', 403);
        }

        if ($request->for_both)
        {
            $chat->delete();
        } else
        {
            $chat->participants()->where('user_id', Auth::id())->delete();
        }

        return $this->success('CHAT_DELETED', 'Chat deleted');
    }

    /**
     * Закріпити/Відкріпити повідомлення
     *
     * @param string $slug
     * @param int $messageId
     * @param Request $request
     * @return JsonResponse
     */
    public function togglePinMessage($slug, $messageId, Request $request): JsonResponse
    {
        $chat = Chat::where('slug', $slug)->firstOrFail();
        $message = Message::where('id', $messageId)->where('chat_id', $chat->id)->firstOrFail();
        $user = $request->user();

        if (!$chat->participants()->where('user_id', $user->id)->exists())
        {
            return $this->error('ERR_FORBIDDEN', 'Forbidden', 403);
        }

        $isPinning = !$message->is_pinned;

        if ($isPinning)
        {
            Message::where('chat_id', $chat->id)
                ->where('is_pinned', true)
                ->update(['is_pinned' => false]);
        }

        $message->update(['is_pinned' => $isPinning]);

        return $this->success('MESSAGE_PIN_TOGGLED', 'Message pin status updated', ['is_pinned' => $message->is_pinned]);
    }

    /**
     * Позначити як прочитане
     *
     * @param string $slug
     * @param Request $request
     * @return JsonResponse
     */
    public function markAsRead($slug, Request $request): JsonResponse
    {
        $chat = Chat::where('slug', $slug)->firstOrFail();
        $user = $request->user();

        $updatedCount = Message::where('chat_id', $chat->id)
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        if ($updatedCount > 0)
        {
            $targetParticipant = $chat->participants()->where('user_id', '!=', $user->id)->first();
            if ($targetParticipant)
            {
                broadcast(new MessagesReadEvent($chat->slug, $user->id, $targetParticipant->user_id));
            }
        }

        return $this->success('MARKED_AS_READ', 'Messages marked as read');
    }
}