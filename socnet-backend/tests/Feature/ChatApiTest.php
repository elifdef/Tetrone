<?php

namespace Tests\Feature;

use App\Models\Chat;
use App\Models\Message;
use App\Models\User;
use App\Models\Friendship;
use App\Services\ChatService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class ChatApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    private function blockUser(User $blocker, User $blocked): void
    {
        Friendship::create([
            'user_id' => $blocker->id,
            'friend_id' => $blocked->id,
            'status' => Friendship::STATUS_BLOCKED
        ]);
    }

    private function createChatBetween(User $u1, User $u2): Chat
    {
        // Використовуємо сервіс, щоб правильно згенерувалися ключі шифрування
        return app(ChatService::class)->getOrCreatePrivateChat($u1, $u2->id);
    }

    // ==========================================
    // 📂 1. СПИСОК ЧАТІВ ТА ІНІЦІАЛІЗАЦІЯ
    // ==========================================

    #[TestDox('1. Анонімний юзер отримує 401')]
    public function test_guest_gets_401(): void
    {
        $this->getJson('/api/v1/chat')->assertStatus(401);
    }

    #[TestDox('2. Юзер може отримати список своїх чатів')]
    public function test_user_can_get_own_chats(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $this->createChatBetween($me, $friend);

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/chat');
        $response->assertStatus(200)->assertJsonPath('code', 'CHATS_RETRIEVED');
    }

    #[TestDox('3. Ініціалізація нового чату повертає CHAT_INITIALIZED')]
    public function test_can_init_new_chat(): void
    {
        $me = User::factory()->create();
        $target = User::factory()->create();
        $response = $this->actingAs($me, 'sanctum')->postJson('/api/v1/chat/init', ['target_user_id' => $target->id]);

        $response->assertStatus(201)->assertJsonPath('code', 'CHAT_INITIALIZED');
        $this->assertNotNull($response->json('data.chat_slug'));
    }

    #[TestDox('4. Ініціалізація існуючого чату повертає той самий slug')]
    public function test_init_existing_chat_returns_same_slug(): void
    {
        $me = User::factory()->create();
        $target = User::factory()->create();
        $chat = $this->createChatBetween($me, $target);

        $response = $this->actingAs($me, 'sanctum')->postJson('/api/v1/chat/init', [
            'target_user_id' => $target->id
        ]);

        $response->assertStatus(201)->assertJsonPath('data.chat_slug', $chat->slug);
    }

    #[TestDox('5. Неможливо ініціалізувати чат із заблокованим юзером (ERR_USER_BLOCKED)')]
    public function test_cannot_init_chat_with_blocked_user(): void
    {
        $me = User::factory()->create();
        $enemy = User::factory()->create();
        $this->blockUser($me, $enemy);

        $response = $this->actingAs($me, 'sanctum')->postJson('/api/v1/chat/init', [
            'target_user_id' => $enemy->id
        ]);

        $response->assertStatus(403);
    }

    #[TestDox('6. Чужий юзер (не учасник) отримує 403 при перегляді повідомлень')]
    public function test_stranger_cannot_view_messages(): void
    {
        $u1 = User::factory()->create();
        $u2 = User::factory()->create();
        $stranger = User::factory()->create();
        $chat = $this->createChatBetween($u1, $u2);

        $response = $this->actingAs($stranger, 'sanctum')->getJson("/api/v1/chat/{$chat->slug}/messages");
        $response->assertStatus(403);
    }

    #[TestDox('7. Учасник може отримати повідомлення чату')]
    public function test_participant_can_view_messages(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $chat = $this->createChatBetween($me, $friend);

        $response = $this->actingAs($me, 'sanctum')->getJson("/api/v1/chat/{$chat->slug}/messages");
        $response->assertStatus(200)->assertJsonPath('code', 'MESSAGES_RETRIEVED');
    }

    #[TestDox('8. Успішна відправка текстового повідомлення')]
    public function test_can_send_text_message(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $chat = $this->createChatBetween($me, $friend);

        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/chat/{$chat->slug}/message", [
            'text' => 'Hello there!'
        ]);

        $response->assertStatus(201)->assertJsonPath('code', 'MESSAGE_SENT');
        $this->assertDatabaseCount('messages', 1);
    }

    #[TestDox('9. Помилка валідації при відправці абсолютно порожнього повідомлення')]
    public function test_cannot_send_empty_message(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $chat = $this->createChatBetween($me, $friend);

        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/chat/{$chat->slug}/message", [
            'text' => ''
        ]);

        // Спрацьовує правило required_without_all
        $response->assertStatus(422)->assertJsonValidationErrors(['text']);
    }

    #[TestDox('10. Можна відправити медіафайл без тексту')]
    public function test_can_send_media_without_text(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $chat = $this->createChatBetween($me, $friend);

        $file = UploadedFile::fake()->image('photo.jpg');

        $response = $this->actingAs($me, 'sanctum')->post("/api/v1/chat/{$chat->slug}/message", [
            'media' => [$file]
        ]);

        $response->assertStatus(201)->assertJsonPath('code', 'MESSAGE_SENT');
    }

    #[TestDox('11. Неможливо відправити повідомлення, якщо співрозмовник тебе заблокував')]
    public function test_cannot_send_message_if_blocked_by_target(): void
    {
        $me = User::factory()->create();
        $target = User::factory()->create();
        $chat = $this->createChatBetween($me, $target);

        $this->blockUser($target, $me); // Він мене заблокував

        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/chat/{$chat->slug}/message", [
            'text' => 'Are you there?'
        ]);

        $response->assertStatus(403)->assertJsonPath('code', 'ERR_USER_BLOCKED');
    }

    #[TestDox('12. Відправник може відредагувати своє повідомлення')]
    public function test_sender_can_update_message(): void
    {
        $me = User::factory()->create();
        $chat = $this->createChatBetween($me, User::factory()->create());

        $msgResponse = $this->actingAs($me, 'sanctum')->postJson("/api/v1/chat/{$chat->slug}/message", ['text' => 'Old']);
        $msgId = $msgResponse->json('data.message_id');

        $response = $this->actingAs($me, 'sanctum')->putJson("/api/v1/chat/{$chat->slug}/message/{$msgId}", [
            'text' => 'New'
        ]);

        $response->assertStatus(200)->assertJsonPath('code', 'MESSAGE_UPDATED');
        $this->assertEquals(1, Message::find($msgId)->is_edited);
    }

    #[TestDox('13. Співрозмовник НЕ МОЖЕ редагувати чуже повідомлення (Policy 403)')]
    public function test_cannot_update_others_message(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $chat = $this->createChatBetween($me, $friend);

        $msgResponse = $this->actingAs($me, 'sanctum')->postJson("/api/v1/chat/{$chat->slug}/message", ['text' => 'My text']);
        $msgId = $msgResponse->json('data.message_id');

        $response = $this->actingAs($friend, 'sanctum')->putJson("/api/v1/chat/{$chat->slug}/message/{$msgId}", [
            'text' => 'Hacked text'
        ]);

        $response->assertStatus(403);
    }

    #[TestDox('14. Спроба видалити весь текст і медіа при редагуванні кидає ERR_EMPTY_MESSAGE')]
    public function test_cannot_make_message_empty_on_update(): void
    {
        $me = User::factory()->create();
        $chat = $this->createChatBetween($me, User::factory()->create());

        $msgResponse = $this->actingAs($me, 'sanctum')->postJson("/api/v1/chat/{$chat->slug}/message", ['text' => 'Text']);
        $msgId = $msgResponse->json('data.message_id');

        $response = $this->actingAs($me, 'sanctum')->putJson("/api/v1/chat/{$chat->slug}/message/{$msgId}", [
            'text' => ''
        ]);

        $response->assertStatus(422)->assertJsonPath('code', 'ERR_EMPTY_MESSAGE');
    }

    #[TestDox('15. Відправник може видалити своє повідомлення')]
    public function test_sender_can_delete_message(): void
    {
        $me = User::factory()->create();
        $chat = $this->createChatBetween($me, User::factory()->create());

        $msgResponse = $this->actingAs($me, 'sanctum')->postJson("/api/v1/chat/{$chat->slug}/message", ['text' => 'Delete me']);
        $msgId = $msgResponse->json('data.message_id');

        $response = $this->actingAs($me, 'sanctum')->deleteJson("/api/v1/chat/{$chat->slug}/message/{$msgId}");

        $response->assertStatus(200)->assertJsonPath('code', 'MESSAGE_DELETED');
        $this->assertNull(Message::find($msgId));
    }

    #[TestDox('16. Співрозмовник НЕ МОЖЕ видалити чуже повідомлення')]
    public function test_receiver_cannot_delete_senders_message(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $chat = $this->createChatBetween($me, $friend);

        $msgResponse = $this->actingAs($me, 'sanctum')->postJson("/api/v1/chat/{$chat->slug}/message", ['text' => 'My text']);
        $msgId = $msgResponse->json('data.message_id');

        $response = $this->actingAs($friend, 'sanctum')->deleteJson("/api/v1/chat/{$chat->slug}/message/{$msgId}");

        $response->assertStatus(403);
    }

    #[TestDox('17. Учасник може закріпити/відкріпити повідомлення')]
    public function test_participant_can_toggle_pin(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $chat = $this->createChatBetween($me, $friend);
        $msgResponse = $this->actingAs($me, 'sanctum')->postJson("/api/v1/chat/{$chat->slug}/message", ['text' => 'Pin this']);
        $msgId = $msgResponse->json('data.message_id');

        $response = $this->actingAs($friend, 'sanctum')->postJson("/api/v1/chat/{$chat->slug}/message/{$msgId}/pin");
        $response->assertStatus(200)->assertJsonPath('code', 'MESSAGE_PIN_TOGGLED');
        $this->assertTrue((bool)Message::find($msgId)->is_pinned);
    }

    #[TestDox('18. Чужий юзер не може закріпити повідомлення')]
    public function test_stranger_cannot_pin_message(): void
    {
        $me = User::factory()->create();
        $chat = $this->createChatBetween($me, User::factory()->create());
        $msgResponse = $this->actingAs($me, 'sanctum')->postJson("/api/v1/chat/{$chat->slug}/message", ['text' => 'Pin this']);
        $msgId = $msgResponse->json('data.message_id');

        $stranger = User::factory()->create();
        $response = $this->actingAs($stranger, 'sanctum')->postJson("/api/v1/chat/{$chat->slug}/message/{$msgId}/pin");

        $response->assertStatus(403);
    }

    #[TestDox('19. Учасник може прочитати повідомлення (markAsRead)')]
    public function test_can_mark_messages_as_read(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $chat = $this->createChatBetween($me, $friend);

        $msgResponse = $this->actingAs($friend, 'sanctum')->postJson("/api/v1/chat/{$chat->slug}/message", ['text' => 'Read me']);
        $msgId = $msgResponse->json('data.message_id');

        $this->assertNull(Message::find($msgId)->read_at);

        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/chat/{$chat->slug}/read");

        $response->assertStatus(204);
        $this->assertNotNull(Message::find($msgId)->read_at);
    }

    #[TestDox('20. Учасник може видалити чат ТІЛЬКИ для себе')]
    public function test_participant_can_delete_chat_for_self(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $chat = $this->createChatBetween($me, $friend);

        $response = $this->actingAs($me, 'sanctum')->deleteJson("/api/v1/chat/{$chat->slug}", ['for_both' => false]);

        $response->assertStatus(200)->assertJsonPath('code', 'CHAT_DELETED');
        // Чат фізично існує
        $this->assertDatabaseHas('chats', ['id' => $chat->id]);
        // Але мене там вже немає (soft delete)
        $this->assertSoftDeleted('chat_participants', ['chat_id' => $chat->id, 'user_id' => $me->id]);
    }

    #[TestDox('21. Учасник може видалити чат для обох')]
    public function test_participant_can_delete_chat_for_both(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $chat = $this->createChatBetween($me, $friend);

        $response = $this->actingAs($me, 'sanctum')->deleteJson("/api/v1/chat/{$chat->slug}", ['for_both' => true]);

        $response->assertStatus(200)->assertJsonPath('code', 'CHAT_DELETED');
        // Чат видаляється повністю
        $this->assertDatabaseMissing('chats', ['id' => $chat->id]);
    }

    #[TestDox('22. Чужий юзер не може видалити чужий чат')]
    public function test_stranger_cannot_delete_chat(): void
    {
        $chat = $this->createChatBetween(User::factory()->create(), User::factory()->create());
        $stranger = User::factory()->create();

        $response = $this->actingAs($stranger, 'sanctum')->deleteJson("/api/v1/chat/{$chat->slug}");
        $response->assertStatus(403);
    }
}