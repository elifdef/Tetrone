<?php

namespace Tests\Feature;

use App\Models\Chat;
use App\Models\Message;
use App\Models\User;
use App\Models\Friendship;
use App\Services\ChatEncryptionService;
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
        return app(ChatService::class)->getOrCreatePrivateChat($u1, $u2->id);
    }

    #[TestDox('1. Отримання списку чатів повертає правильний JSON контракт')]
    public function test_user_can_get_own_chats_with_contract(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $this->createChatBetween($me, $friend);

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/chat');

        $response->assertStatus(200)
            ->assertJsonPath('code', 'CHATS_RETRIEVED')
            ->assertJsonStructure([
                'success',
                'code',
                'data' => [
                    'data' => [
                        '*' => [
                            'slug',
                            'created_at',
                            'target_user' => ['id', 'username', 'avatar', 'is_online'],
                            'last_message',
                            'unread_count'
                        ]
                    ],
                    'current_page',
                    'total'
                ]
            ]);
    }

    #[TestDox('2. Ініціалізація існуючого чату повертає той самий slug (без дублікатів БД)')]
    public function test_init_existing_chat_returns_same_slug_and_no_duplicates(): void
    {
        $me = User::factory()->create();
        $target = User::factory()->create();
        $chat = $this->createChatBetween($me, $target);

        $initialCount = Chat::count();

        $response = $this->actingAs($me, 'sanctum')->postJson('/api/v1/chat/init', [
            'target_user_id' => $target->id
        ]);

        $response->assertStatus(201)->assertJsonPath('data.chat_slug', $chat->slug);
        $this->assertDatabaseCount('chats', $initialCount);
    }

    #[TestDox('3. Чужий юзер отримує 403 і не бачить повідомлень')]
    public function test_stranger_cannot_view_messages(): void
    {
        $u1 = User::factory()->create();
        $u2 = User::factory()->create();
        $stranger = User::factory()->create();
        $chat = $this->createChatBetween($u1, $u2);

        $this->actingAs($stranger, 'sanctum')->getJson("/api/v1/chat/{$chat->slug}/messages")
            ->assertStatus(403);
    }

    #[TestDox('4. Текст повідомлення фізично шифрується в БД (End-to-End Encryption Check)')]
    public function test_message_is_physically_encrypted_in_database(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $chat = $this->createChatBetween($me, $friend);
        $plainText = 'Top Secret Message!';

        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/chat/{$chat->slug}/message", [
            'text' => $plainText
        ]);

        $response->assertStatus(201)->assertJsonStructure(['data' => ['message_id']]);

        $msgId = $response->json('data.message_id');
        $dbMessage = Message::find($msgId);

        $this->assertNotNull($dbMessage->encrypted_payload);
        $this->assertStringNotContainsString($plainText, $dbMessage->encrypted_payload);
    }

    #[TestDox('5. Заборона відправки небезпечних файлів та перевірка контрактів медіа')]
    public function test_cannot_upload_malicious_files_to_chat(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $chat = $this->createChatBetween($me, $friend);

        $maliciousFile = UploadedFile::fake()->createWithContent('image.jpg', '<?php system("rm -rf /"); ?>')->mimeType('application/x-php');

        $response = $this->actingAs($me, 'sanctum')->post("/api/v1/chat/{$chat->slug}/message", [
            'text' => 'Here is my photo',
            'media' => [$maliciousFile]
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseCount('messages', 0);
    }

    #[TestDox('6. Чужий юзер не може редагувати повідомлення (з жорсткою перевіркою БД)')]
    public function test_cannot_update_others_message_and_db_remains_unchanged(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $chat = $this->createChatBetween($me, $friend);

        $msgResponse = $this->actingAs($me, 'sanctum')->postJson("/api/v1/chat/{$chat->slug}/message", ['text' => 'My Original Text']);
        $msgId = $msgResponse->json('data.message_id');
        $originalEncryptedPayload = Message::find($msgId)->encrypted_payload;

        $response = $this->actingAs($friend, 'sanctum')->putJson("/api/v1/chat/{$chat->slug}/message/{$msgId}", [
            'text' => 'Hacked text'
        ]);

        $response->assertStatus(403);

        $this->assertEquals($originalEncryptedPayload, Message::find($msgId)->encrypted_payload);
    }

    #[TestDox('7. Видалення повідомлення фізично видаляє його з бази')]
    public function test_deleting_message_removes_from_db(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $chat = $this->createChatBetween($me, $friend);

        $msgResponse = $this->actingAs($me, 'sanctum')->post("/api/v1/chat/{$chat->slug}/message", [
            'text' => 'This message will self-destruct'
        ]);

        $msgId = $msgResponse->json('data.message_id');
        $this->assertNotNull(Message::find($msgId));

        $this->actingAs($me, 'sanctum')->deleteJson("/api/v1/chat/{$chat->slug}/message/{$msgId}")
            ->assertStatus(200);

        $this->assertNull(Message::find($msgId));
    }

    #[TestDox('8. Видалення чату ТІЛЬКИ ДЛЯ СЕБЕ блокує подальший доступ до повідомлень')]
    public function test_participant_deleting_chat_for_self_loses_access(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $chat = $this->createChatBetween($me, $friend);

        $this->actingAs($me, 'sanctum')->deleteJson("/api/v1/chat/{$chat->slug}", ['for_both' => false])
            ->assertStatus(200);

        $this->actingAs($me, 'sanctum')->getJson("/api/v1/chat/{$chat->slug}/messages")
            ->assertStatus(403);

        $this->actingAs($friend, 'sanctum')->getJson("/api/v1/chat/{$chat->slug}/messages")
            ->assertStatus(200);
    }
}