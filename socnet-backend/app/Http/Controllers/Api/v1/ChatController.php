<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Requests\Chat\SendMessageRequest;
use App\Http\Requests\Chat\UpdateMessageRequest;
use App\Http\Resources\MessageResource;
use App\Http\Resources\UserBasicResource;
use App\Models\Chat;
use App\Models\Message;
use App\Services\ChatService;
use App\Services\MessageService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ChatController extends Controller
{
    public function __construct(
        protected ChatService    $chatService,
        protected MessageService $messageService
    )
    {
    }

    public function index(Request $request): JsonResponse
    {
        $chats = $this->chatService->getUserChats($request->user()->id);
        return $this->success('CHATS_RETRIEVED', 'Chats retrieved successfully', $chats);
    }

    public function getOrCreateChat(Request $request): JsonResponse
    {
        $request->validate(['target_user_id' => 'required|exists:users,id']);

        $chat = $this->chatService->getOrCreatePrivateChat($request->user(), $request->target_user_id);

        if (is_array($chat) && isset($chat['error']))
        {
            return $this->error($chat['error'], $chat['message'], $chat['status']);
        }

        return $this->success('CHAT_INITIALIZED', 'Chat initialized', ['chat_slug' => $chat->slug]);
    }

    public function sendMessage(SendMessageRequest $request, string $slug): JsonResponse
    {
        $chat = Chat::where('slug', $slug)->firstOrFail();

        if (!$chat->participants()->where('user_id', $request->user()->id)->exists())
        {
            return $this->error('ERR_FORBIDDEN', 'Forbidden', 403);
        }

        $result = $this->messageService->sendMessage($chat, $request->user(), $request->validated(), $request->file('media'));

        if (is_array($result) && isset($result['error']))
        {
            return $this->error($result['error'], $result['message'], $result['status']);
        }

        return $this->success('MESSAGE_SENT', 'Message sent', ['message_id' => $result->id]);
    }

    public function updateMessage(UpdateMessageRequest $request, string $slug, int $messageId): JsonResponse
    {
        $chat = Chat::where('slug', $slug)->firstOrFail();
        $message = Message::where('id', $messageId)->where('chat_id', $chat->id)->firstOrFail();

        if ($message->sender_id !== $request->user()->id)
        {
            return $this->error('ERR_NOT_YOUR_MESSAGE', 'Not your message', 403);
        }

        $result = $this->messageService->updateMessage($message, $chat, $request->validated(), $request->file('media'), $request->input('deleted_media'));

        if (is_array($result) && isset($result['error']))
        {
            return $this->error($result['error'], $result['message'], $result['status']);
        }

        return $this->success('MESSAGE_UPDATED', 'Message updated', ['edited_at' => $result->updated_at]);
    }

    public function getMessages(Request $request, string $slug): JsonResponse
    {
        $chat = Chat::where('slug', $slug)->firstOrFail();

        if (!$chat->participants()->where('user_id', $request->user()->id)->exists())
        {
            return $this->error('ERR_FORBIDDEN', 'Forbidden', 403);
        }

        $targetParticipant = $chat->participants()->where('user_id', '!=', $request->user()->id)->first();

        $messages = Message::with(['chat', 'sharedPost.user', 'sharedPost.attachments', 'repliedMessage.sender'])
            ->where('chat_id', $chat->id)
            ->orderBy('created_at', 'desc')
            ->paginate(30);

        return $this->success('MESSAGES_RETRIEVED', 'Messages loaded', [
            'data' => MessageResource::collection($messages)->resolve(),
            'meta' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage()
            ],
            'chat_info' => [
                'slug' => $chat->slug,
                'target_user' => $targetParticipant ? (new UserBasicResource($targetParticipant->user))->resolve() : null,
            ]
        ]);
    }

    public function destroyMessage(Request $request, string $slug, int $messageId): JsonResponse
    {
        $chat = Chat::where('slug', $slug)->firstOrFail();
        $message = Message::where('id', $messageId)->where('chat_id', $chat->id)->firstOrFail();

        if ($message->sender_id !== $request->user()->id)
        {
            return $this->error('ERR_NOT_YOUR_MESSAGE', 'Not your message', 403);
        }

        $this->messageService->deleteMessage($message, $chat);

        return $this->success('MESSAGE_DELETED', 'Message deleted');
    }

    public function destroyChat(Request $request, string $slug): JsonResponse
    {
        $chat = Chat::where('slug', $slug)->firstOrFail();

        if (!$chat->participants()->where('user_id', $request->user()->id)->exists())
        {
            return $this->error('ERR_FORBIDDEN', 'Forbidden', 403);
        }

        $this->chatService->deleteChat($chat, $request->user(), $request->boolean('for_both'));

        return $this->success('CHAT_DELETED', 'Chat deleted');
    }

    public function togglePinMessage(Request $request, string $slug, int $messageId): JsonResponse
    {
        $chat = Chat::where('slug', $slug)->firstOrFail();
        $message = Message::where('id', $messageId)->where('chat_id', $chat->id)->firstOrFail();

        if (!$chat->participants()->where('user_id', $request->user()->id)->exists())
        {
            return $this->error('ERR_FORBIDDEN', 'Forbidden', 403);
        }

        if (!$message->is_pinned)
        {
            Message::where('chat_id', $chat->id)->where('is_pinned', true)->update(['is_pinned' => false]);
        }

        $message->update(['is_pinned' => !$message->is_pinned]);

        return $this->success('MESSAGE_PIN_TOGGLED', 'Message pin status updated', ['is_pinned' => $message->is_pinned]);
    }

    public function markAsRead(Request $request, string $slug): JsonResponse
    {
        $chat = Chat::where('slug', $slug)->firstOrFail();
        $this->messageService->markAsRead($chat, $request->user());

        return $this->success('MARKED_AS_READ', 'Messages marked as read');
    }
}