<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Requests\Chat\InitChatRequest;
use App\Http\Requests\Chat\SendMessageRequest;
use App\Http\Requests\Chat\UpdateMessageRequest;
use App\Http\Resources\MessageResource;
use App\Http\Resources\UserBasicResource;
use App\Models\Chat;
use App\Models\Message;
use App\Models\User;
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

    /**
     * Отримати список чатів
     *
     * @group Chats
     * @authenticated
     * @response 200
     */
    public function index(Request $request): JsonResponse
    {
        $chats = $this->chatService->getUserChats($request->user()->id);

        return response()->json([
            'success' => true,
            'code' => 'CHATS_RETRIEVED',
            'data' => $chats // Пагінація обробляється Laravel автоматично
        ], 200);
    }

    /**
     * Ініціалізувати чат
     *
     * @group Chats
     * @authenticated
     * @response 201
     */
    public function getOrCreateChat(InitChatRequest $request): JsonResponse
    {
        $targetUser = User::findOrFail($request->validated('target_user_id'));
        $this->authorize('sendMessage', $targetUser);

        $chat = $this->chatService->getOrCreatePrivateChat($request->user(), $targetUser->id);

        return response()->json([
            'success' => true,
            'code' => 'CHAT_INITIALIZED',
            'data' => ['chat_slug' => $chat->slug]
        ], 201);
    }

    /**
     * Надіслати повідомлення
     *
     * @group Chats
     * @authenticated
     * @response 201
     */
    public function sendMessage(SendMessageRequest $request, Chat $chat): JsonResponse
    {
        $this->authorize('access', $chat);

        $mediaFiles = $request->file('media');
        if ($mediaFiles && !is_array($mediaFiles))
        {
            $mediaFiles = [$mediaFiles];
        }

        $message = $this->messageService->sendMessage(
            $chat,
            $request->user(),
            $request->validated(),
            $mediaFiles
        );

        return response()->json([
            'success' => true,
            'code' => 'MESSAGE_SENT',
            'data' => ['message_id' => $message->id]
        ], 201);
    }

    /**
     * Оновити повідомлення
     *
     * @group Chats
     * @authenticated
     * @response 200
     */
    public function updateMessage(UpdateMessageRequest $request, Chat $chat, Message $message): JsonResponse
    {
        $this->authorize('manageMessage', [$chat, $message]);

        $mediaFiles = $request->file('media');
        if ($mediaFiles && !is_array($mediaFiles))
        {
            $mediaFiles = [$mediaFiles];
        }

        $deletedMedia = $request->input('deleted_media');
        if ($deletedMedia && !is_array($deletedMedia))
        {
            $deletedMedia = [$deletedMedia];
        }

        $updatedMessage = $this->messageService->updateMessage(
            $message,
            $chat,
            $request->validated(),
            $mediaFiles,
            $deletedMedia
        );

        return response()->json([
            'success' => true,
            'code' => 'MESSAGE_UPDATED',
            'data' => ['edited_at' => $updatedMessage->updated_at]
        ], 200);
    }

    /**
     * Отримати повідомлення чату
     *
     * @group Chats
     * @authenticated
     * @response 200
     */
    public function getMessages(Request $request, Chat $chat): JsonResponse
    {
        $this->authorize('access', $chat);

        $targetParticipant = $chat->participants()->where('user_id', '!=', $request->user()->id)->first();
        $messages = $this->messageService->getChatMessages($chat);

        return response()->json([
            'success' => true,
            'code' => 'MESSAGES_RETRIEVED',
            'data' => MessageResource::collection($messages),
            'meta' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage()
            ],
            'chat_info' => [
                'slug' => $chat->slug,
                'target_user' => $targetParticipant ? new UserBasicResource($targetParticipant->user) : null,
            ]
        ], 200);
    }

    /**
     * Видалити повідомлення
     *
     * @group Chats
     * @authenticated
     * @response 204
     */
    public function destroyMessage(Chat $chat, Message $message): JsonResponse
    {
        $this->authorize('manageMessage', [$chat, $message]);

        $this->messageService->deleteMessage($message, $chat);

        return response()->json([
            'success' => true,
            'code' => 'MESSAGE_DELETED'
        ], 200);
    }

    /**
     * Видалити чат
     *
     * @group Chats
     * @authenticated
     * @response 200
     */
    public function destroyChat(Request $request, Chat $chat): JsonResponse
    {
        $this->authorize('access', $chat);

        $this->chatService->deleteChat($chat, $request->user(), $request->boolean('for_both'));

        return response()->json([
            'success' => true,
            'code' => 'CHAT_DELETED'
        ], 200);
    }

    /**
     * Закріпити повідомлення
     *
     * @group Chats
     * @authenticated
     * @response 200
     */
    public function togglePinMessage(Chat $chat, Message $message): JsonResponse
    {
        $this->authorize('access', $chat);

        if (!$message->is_pinned)
        {
            Message::where('chat_id', $chat->id)->where('is_pinned', true)->update(['is_pinned' => false]);
        }

        $message->update(['is_pinned' => !$message->is_pinned]);

        return response()->json([
            'success' => true,
            'code' => 'MESSAGE_PIN_TOGGLED',
            'data' => ['is_pinned' => $message->is_pinned]
        ], 200);
    }

    /**
     * Позначити прочитаним
     *
     * @group Chats
     * @authenticated
     * @response 204
     */
    public function markAsRead(Request $request, Chat $chat): JsonResponse
    {
        $this->authorize('access', $chat);

        $this->messageService->markAsRead($chat, $request->user());

        return response()->json(null, 204);
    }
}