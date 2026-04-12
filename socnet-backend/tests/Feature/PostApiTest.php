<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use App\Models\Friendship;
use App\Notifications\NewRepostNotification;
use App\Notifications\NewWallPostNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class PostApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        Notification::fake();
    }

    private function generateRichText(string $text = 'Test'): array
    {
        return [
            'type' => 'doc',
            'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => $text]]]]
        ];
    }

    private function blockUser(User $blocker, User $blocked): void
    {
        Friendship::create(['user_id' => $blocker->id, 'friend_id' => $blocked->id, 'status' => Friendship::STATUS_BLOCKED]);
    }

    #[TestDox('1. Анонімний юзер отримує 401')]
    public function test_unauthorized_user_cannot_create_post(): void
    {
        $this->postJson('/api/v1/posts', ['payload' => json_encode(['text' => 'hi'])])->assertStatus(401);
    }

    #[TestDox('2. Забанений юзер отримує 403')]
    public function test_banned_user_cannot_create_post(): void
    {
        $user = User::factory()->create(['is_banned' => true]);
        $this->actingAs($user, 'sanctum')->postJson('/api/v1/posts', ['payload' => json_encode(['text' => 'hi'])])->assertStatus(403);
    }

    #[TestDox('3. Security: Заблокований юзер (ЧС) отримує 403 при спробі писати на стіні і БД не змінюється')]
    public function test_blocked_user_cannot_write_on_wall_and_db_is_untouched(): void
    {
        $hacker = User::factory()->create();
        $target = User::factory()->create();
        $this->blockUser($target, $hacker);

        $response = $this->actingAs($hacker, 'sanctum')->postJson('/api/v1/posts', [
            'target_user_id' => $target->id,
            'payload' => json_encode(['text' => $this->generateRichText('Hack')])
        ]);

        $response->assertStatus(403);

        $this->assertDatabaseMissing('posts', ['target_user_id' => $target->id, 'user_id' => $hacker->id]);
    }

    #[TestDox('4. Створення поста з текстом повертає СТРОГИЙ КОНТРАКТ і пише в БД')]
    public function test_can_create_post_with_strict_contract(): void
    {
        $user = User::factory()->create();
        $payload = ['text' => $this->generateRichText('Тестовий пост')];

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/posts', ['payload' => json_encode($payload)]);

        $response->assertStatus(201)
            ->assertJsonPath('code', 'POST_CREATED')
            ->assertJsonStructure([
                'success', 'code',
                'data' => [
                    'id', 'content', 'created_at',
                    'user' => ['id', 'username', 'avatar']
                ]
            ]);

        $this->assertDatabaseHas('posts', [
            'id' => $response->json('data.id'),
            'user_id' => $user->id
        ]);
    }

    #[TestDox('5. Створення поста з медіа ФІЗИЧНО зберігає файл на диск')]
    public function test_can_create_post_with_image_physically_saved(): void
    {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->image('cat.jpg');

        $response = $this->actingAs($user, 'sanctum')->post('/api/v1/posts', ['media' => [$file]]);

        $response->assertStatus(201);
        $postId = $response->json('data.id');

        $this->assertDatabaseHas('post_attachments', ['post_id' => $postId, 'type' => 'image']);

        $attachment = Post::find($postId)->attachments()->first();
        $this->assertTrue(Storage::disk('public')->exists($attachment->file_path));
    }

    #[TestDox('6. Security: Захист від MIME Spoofing (не можна підсунути PHP у .jpg)')]
    public function test_cannot_upload_mime_spoofed_file(): void
    {
        $user = User::factory()->create();

        $fakeImage = UploadedFile::fake()->createWithContent('hack.jpg', '<?php system("ls"); ?>')->mimeType('application/x-php');

        $response = $this->actingAs($user, 'sanctum')->post('/api/v1/posts', ['media' => [$fakeImage]]);
        $response->assertStatus(422)->assertJsonValidationErrors(['media.0']);
    }

    #[TestDox('7. Створення репосту ВІДПРАВЛЯЄ СПОВІЩЕННЯ оригінальному автору')]
    public function test_can_create_repost_and_notification_is_sent(): void
    {
        $author = User::factory()->create();
        $original = $author->posts()->create(['content' => ['text' => 'orig']]);

        $reposter = User::factory()->create();

        $response = $this->actingAs($reposter, 'sanctum')->postJson('/api/v1/posts', ['original_post_id' => $original->id]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('posts', ['original_post_id' => $original->id, 'is_repost' => true]);

        Notification::assertSentTo($author, NewRepostNotification::class);
    }

    #[TestDox('8. Публікація на чужій стіні ВІДПРАВЛЯЄ СПОВІЩЕННЯ власнику стіни')]
    public function test_can_write_post_on_wall_and_notification_is_sent(): void
    {
        $author = User::factory()->create();
        $wallOwner = User::factory()->create();

        $response = $this->actingAs($author, 'sanctum')->postJson('/api/v1/posts', [
            'payload' => json_encode(['text' => $this->generateRichText('Hi')]),
            'target_user_id' => $wallOwner->id
        ]);

        $response->assertStatus(201);

        Notification::assertSentTo($wallOwner, NewWallPostNotification::class);
    }

    #[TestDox('9. Чужий юзер НЕ МОЖЕ редагувати пост і БАЗА НЕ ЗМІНЮЄТЬСЯ')]
    public function test_cannot_edit_others_post_and_db_is_untouched(): void
    {
        $author = User::factory()->create();
        $hacker = User::factory()->create();

        $post = $author->posts()->create(['content' => ['text' => $this->generateRichText('Safe')]]);

        $response = $this->actingAs($hacker, 'sanctum')->putJson("/api/v1/posts/{$post->id}", [
            'payload' => json_encode(['text' => $this->generateRichText('Hacked')])
        ]);

        $response->assertStatus(403);

        $this->assertEquals('Safe', $post->refresh()->content['text']['content'][0]['content'][0]['text']);
    }

    #[TestDox('10. Security: ID Spoofing - Неможливо видалити чужий медіафайл при оновленні')]
    public function test_cannot_delete_media_from_different_post(): void
    {
        $me = User::factory()->create();
        $stranger = User::factory()->create();

        $myPost = $me->posts()->create(['content' => ['text' => 'Txt']]);
        $strangerPost = $stranger->posts()->create(['content' => ['text' => 'Txt']]);

        $strangerMedia = $strangerPost->attachments()->create(['file_path' => 'test.jpg', 'type' => 'image']);

        $response = $this->actingAs($me, 'sanctum')->post("/api/v1/posts/{$myPost->id}", [
            '_method' => 'PUT',
            'payload' => json_encode(['text' => 'Txt']),
            'deleted_media' => [$strangerMedia->id]
        ]);

        $this->assertDatabaseHas('post_attachments', ['id' => $strangerMedia->id]);
    }

    #[TestDox('11. Видалення поста ФІЗИЧНО ЗНИЩУЄ всі його медіафайли з диска')]
    public function test_deleting_post_removes_files_from_disk_physically(): void
    {
        $user = User::factory()->create();
        $post = $user->posts()->create(['content' => ['text' => 'Txt']]);

        $path = UploadedFile::fake()->image('test.jpg')->storeAs('posts', 'test.jpg', 'public');
        $post->attachments()->create(['file_path' => $path, 'type' => 'image']);

        $this->assertTrue(Storage::disk('public')->exists($path));

        $this->actingAs($user, 'sanctum')->deleteJson("/api/v1/posts/{$post->id}")->assertStatus(202);

        $this->assertDatabaseMissing('posts', ['id' => $post->id]);

        $this->assertFalse(Storage::disk('public')->exists($path));
    }
}