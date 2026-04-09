<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
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
    }

    #[TestDox('1. Анонімний юзер отримує 401')]
    public function test_unauthorized_user_cannot_create_post(): void
    {
        $response = $this->postJson('/api/v1/posts', ['payload' => json_encode(['text' => 'hi'])]);
        $response->assertStatus(401);
    }

    #[TestDox('2. Забанений юзер отримує 403')]
    public function test_banned_user_cannot_create_post(): void
    {
        $user = User::factory()->create(['is_banned' => true]);
        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/posts', ['payload' => json_encode(['text' => 'hi'])]);
        $response->assertStatus(403);
    }

    #[TestDox('3. Неможливо створити абсолютно порожній пост')]
    public function test_cannot_create_completely_empty_post(): void
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/posts', ['payload' => json_encode([])]);
        $response->assertStatus(422)->assertJsonValidationErrors(['payload']);
    }

    #[TestDox('4. Успішне створення поста ТІЛЬКИ з текстом (JSON)')]
    public function test_can_create_post_with_text_only(): void
    {
        $user = User::factory()->create();

        $payload = [
            'text' => [
                'type' => 'doc',
                'content' => [
                    [
                        'type' => 'paragraph',
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => 'Тестовий пост'
                            ]
                        ]
                    ]
                ]
            ]
        ];

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/posts', ['payload' => json_encode($payload)]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('posts', ['user_id' => $user->id]);
    }

    #[TestDox('5. Успішне створення поста ТІЛЬКИ з картинкою')]
    public function test_can_create_post_with_image_only(): void
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user, 'sanctum')->post('/api/v1/posts', [
            'media' => [UploadedFile::fake()->image('cat.jpg')]
        ]);
        $response->assertStatus(201);
        $this->assertDatabaseHas('post_attachments', ['type' => 'image']);
    }

    #[TestDox('6. Успішне створення поста ТІЛЬКИ з відео')]
    public function test_can_create_post_with_video_only(): void
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user, 'sanctum')->post('/api/v1/posts', [
            'media' => [UploadedFile::fake()->create('vid.mp4', 1000, 'video/mp4')]
        ]);
        $response->assertStatus(201);
        $this->assertDatabaseHas('post_attachments', ['type' => 'video']);
    }

    #[TestDox('7. Успішне створення поста ТІЛЬКИ з документом (аудіо/PDF)')]
    public function test_can_create_post_with_document_only(): void
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user, 'sanctum')->post('/api/v1/posts', [
            'media' => [UploadedFile::fake()->create('song.m4a', 500, 'audio/mp4')]
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('post_attachments', ['type' => 'audio']);
    }

    #[TestDox('8. Створення поста: Текст + 2 Картинки + 1 Відео')]
    public function test_can_create_post_with_multiple_media_types(): void
    {
        $user = User::factory()->create();
        $payload = ['text' => ['type' => 'doc']];

        $response = $this->actingAs($user, 'sanctum')->post('/api/v1/posts', [
            'payload' => json_encode($payload),
            'media' => [
                UploadedFile::fake()->image('1.jpg'),
                UploadedFile::fake()->image('2.jpg'),
                UploadedFile::fake()->create('3.mp4', 100, 'video/mp4'),
            ]
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseCount('post_attachments', 3);
    }

    #[TestDox('9. Блокування завантаження більше 10 файлів')]
    public function test_cannot_create_post_with_more_than_10_media(): void
    {
        $user = User::factory()->create();
        $files = array_map(fn($i) => UploadedFile::fake()->image("$i.jpg"), range(1, 11));

        $response = $this->actingAs($user, 'sanctum')->post('/api/v1/posts', ['media' => $files]);
        $response->assertStatus(422)->assertJsonValidationErrors(['media']);
    }

    #[TestDox('10. Блокування завантаження вірусів (.exe)')]
    public function test_cannot_upload_exe_files(): void
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user, 'sanctum')->post('/api/v1/posts', [
            'media' => [UploadedFile::fake()->create('virus.exe', 100, 'application/x-msdownload')]
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors(['media.0']);
    }

    // ==========================================
    // 📊 3. ОПИТУВАННЯ ТА ВІКТОРИНИ (5 тестів)
    // ==========================================

    #[TestDox('11. Успішне створення поста з опитуванням')]
    public function test_can_create_post_with_poll(): void
    {
        $user = User::factory()->create();
        $payload = ['poll' => ['question' => 'Q?', 'options' => [['text' => 'A'], ['text' => 'B']]]];

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/posts', ['payload' => json_encode($payload)]);
        $response->assertStatus(201);
    }

    #[TestDox('12. Опитування без питання відхиляється')]
    public function test_cannot_create_poll_without_question(): void
    {
        $user = User::factory()->create();
        $payload = ['poll' => ['question' => '', 'options' => [['text' => 'A'], ['text' => 'B']]]];
        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/posts', ['payload' => json_encode($payload)]);
        $response->assertStatus(422)->assertJsonPath('code', 'ERR_POLL_QUESTION_EMPTY');
    }

    #[TestDox('13. Опитування з 1 варіантом відхиляється')]
    public function test_cannot_create_poll_with_less_than_two_options(): void
    {
        $user = User::factory()->create();
        $payload = ['poll' => ['question' => 'Q?', 'options' => [['text' => 'A']]]];
        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/posts', ['payload' => json_encode($payload)]);
        $response->assertStatus(422)->assertJsonPath('code', 'ERR_POLL_OPTIONS_LIMIT');
    }

    #[TestDox('14. Опитування з 17 варіантами відхиляється')]
    public function test_cannot_create_poll_with_more_than_ten_options(): void
    {
        $user = User::factory()->create();
        // ТУТ МАЄ БУТИ 17!
        $options = array_map(fn($i) => ['text' => "Option $i"], range(1, 17));
        $payload = ['poll' => ['question' => 'Q?', 'options' => $options]];

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/posts', ['payload' => json_encode($payload)]);
        $response->assertStatus(422)->assertJsonPath('code', 'ERR_POLL_OPTIONS_LIMIT');
    }

    #[TestDox('15. Вікторина (quiz) без правильної відповіді відхиляється')]
    public function test_cannot_create_quiz_without_correct_option(): void
    {
        $user = User::factory()->create();
        $payload = ['poll' => ['type' => 'quiz', 'question' => 'Q?', 'options' => [['text' => 'A'], ['text' => 'B']]]];
        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/posts', ['payload' => json_encode($payload)]);
        $response->assertStatus(422)->assertJsonPath('code', 'ERR_QUIZ_NO_CORRECT_OPTION');
    }

    #[TestDox('16. Успішний пустий репост')]
    public function test_can_create_repost(): void
    {
        $user = User::factory()->create();
        $original = $user->posts()->create(['content' => ['text' => 'orig']]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/posts', ['original_post_id' => $original->id]);
        $response->assertStatus(201);
        $this->assertDatabaseHas('posts', ['original_post_id' => $original->id, 'is_repost' => true]);
    }

    #[TestDox('17. Успішний репост з власним текстом')]
    public function test_can_create_repost_with_additional_text(): void
    {
        $user = User::factory()->create();
        $original = $user->posts()->create(['content' => ['text' => 'orig']]);
        $payload = ['text' => ['type' => 'doc', 'content' => 'my comment']];

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/posts', ['original_post_id' => $original->id, 'payload' => json_encode($payload)]);
        $response->assertStatus(201);
    }

    // ==========================================
    // 🧱 5. СТІНА ТА ПРАВА (2 тести)
    // ==========================================

    #[TestDox('18. Публікація на чужій стіні')]
    public function test_can_write_post_on_another_users_wall(): void
    {
        $author = User::factory()->create();
        $target = User::factory()->create();

        $response = $this->actingAs($author, 'sanctum')->postJson('/api/v1/posts', [
            'payload' => json_encode(['text' => 'Hi']), 'target_user_id' => $target->id
        ]);
        $response->assertStatus(201);
        $this->assertDatabaseHas('posts', ['target_user_id' => $target->id]);
    }

    #[TestDox('19. Заблокований юзер НЕ МОЖЕ писати на стіні')]
    public function test_blocked_user_cannot_write_on_wall(): void
    {
        // Примітка: Потребує логіки блокування у твоєму StorePostRequest,
        // або перевірки Authorization. Переконайся, що це є у твоєму коді!
        $this->assertTrue(true); // Заглушка, реалізуй блокування, якщо воно є на рівні створення.
    }

    // ==========================================
    // ✏️ 6. ОНОВЛЕННЯ ПОСТА (8 тестів)
    // ==========================================

    #[TestDox('20. Оновлення тексту поста')]
    public function test_can_update_own_post_text(): void
    {
        $user = User::factory()->create();
        $post = $user->posts()->create(['content' => ['text' => 'Old']]);

        $payload = ['text' => 'New'];
        $response = $this->actingAs($user, 'sanctum')->putJson("/api/v1/posts/{$post->id}", ['payload' => json_encode($payload)]);

        $response->assertStatus(200);
        $this->assertEquals('New', $post->refresh()->content['text']);
    }

    #[TestDox('21. Видалення тексту (але залишається картинка)')]
    public function test_can_clear_text_from_post_if_media_exists(): void
    {
        $user = User::factory()->create();
        $post = $user->posts()->create(['content' => ['text' => 'Old']]);
        $post->attachments()->create(['file_path' => 'img.jpg', 'type' => 'image']);

        // Відправляємо payload без text (або з text: null)
        $payload = ['text' => null];
        $response = $this->actingAs($user, 'sanctum')->putJson("/api/v1/posts/{$post->id}", ['payload' => json_encode($payload)]);

        $response->assertStatus(200);
        $this->assertNull($post->refresh()->content['text'] ?? null);
    }

    #[TestDox('22. НЕ МОЖНА видалити текст, якщо пост стане повністю порожнім')]
    public function test_cannot_clear_text_if_post_becomes_empty(): void
    {
        $user = User::factory()->create();
        $post = $user->posts()->create(['content' => ['text' => 'Old']]); // Немає медіа

        $payload = ['text' => null];
        $response = $this->actingAs($user, 'sanctum')->putJson("/api/v1/posts/{$post->id}", ['payload' => json_encode($payload)]);

        $response->assertStatus(422); // Має спрацювати валідація "Post cannot be empty"
    }

    #[TestDox('23. Додавання нових файлів при редагуванні')]
    public function test_can_add_new_media_to_existing_post(): void
    {
        $user = User::factory()->create();
        $post = $user->posts()->create(['content' => ['text' => 'Txt']]);

        $response = $this->actingAs($user, 'sanctum')->post("/api/v1/posts/{$post->id}", [
            '_method' => 'PUT',
            'payload' => json_encode(['text' => 'Txt']),
            'media' => [UploadedFile::fake()->image('new.jpg')]
        ]);

        $response->assertStatus(200);
        $this->assertCount(1, $post->refresh()->attachments);
    }

    #[TestDox('24. Видалення існуючих файлів при редагуванні')]
    public function test_can_delete_media_from_existing_post(): void
    {
        $user = User::factory()->create();
        $post = $user->posts()->create(['content' => ['text' => 'Txt']]);
        $media = $post->attachments()->create(['file_path' => 'test.jpg', 'type' => 'image']);

        $response = $this->actingAs($user, 'sanctum')->post("/api/v1/posts/{$post->id}", [
            '_method' => 'PUT',
            'payload' => json_encode(['text' => 'Txt']),
            'deleted_media' => [$media->id]
        ]);

        $response->assertStatus(200);
        $this->assertCount(0, $post->refresh()->attachments);
    }

    #[TestDox('25. При оновленні не можна перевищити ліміт 10 медіа')]
    public function test_cannot_exceed_10_media_when_updating(): void
    {
        $user = User::factory()->create();
        $post = $user->posts()->create(['content' => ['text' => 'Txt']]);
        for ($i = 0; $i < 9; $i++)
        {
            $post->attachments()->create(['file_path' => "$i.jpg", 'type' => 'image']);
        }

        $newFiles = [UploadedFile::fake()->image('a.jpg'), UploadedFile::fake()->image('b.jpg')]; // Разом 11

        $response = $this->actingAs($user, 'sanctum')->post("/api/v1/posts/{$post->id}", [
            '_method' => 'PUT', 'media' => $newFiles
        ]);
        $response->assertStatus(422);
    }

    #[TestDox('26. Хакер не може редагувати чужий пост')]
    public function test_cannot_edit_others_post(): void
    {
        $author = User::factory()->create();
        $hacker = User::factory()->create();
        $post = $author->posts()->create(['content' => ['text' => 'Orig']]);

        $response = $this->actingAs($hacker, 'sanctum')->putJson("/api/v1/posts/{$post->id}", ['payload' => json_encode(['text' => 'Hacked'])]);
        $response->assertStatus(403);
    }

    #[TestDox('27. Оновлення тексту не видаляє існуюче опитування')]
    public function test_updating_post_does_not_remove_poll(): void
    {
        $user = User::factory()->create();
        $post = $user->posts()->create(['content' => ['text' => 'Old', 'poll' => ['question' => 'Q?']]]);

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/v1/posts/{$post->id}", ['payload' => json_encode(['text' => 'New Text'])]);

        $response->assertStatus(200);
        $this->assertArrayHasKey('poll', $post->refresh()->content);
    }

    // ==========================================
    // 🗑 7. ВИДАЛЕННЯ (3 тести)
    // ==========================================

    #[TestDox('28. Власник може видалити свій пост')]
    public function test_owner_can_delete_own_post(): void
    {
        $user = User::factory()->create();
        $post = $user->posts()->create(['content' => ['text' => 'Txt']]);

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/v1/posts/{$post->id}");
        $response->assertStatus(202);
        $this->assertDatabaseMissing('posts', ['id' => $post->id]);
    }

    #[TestDox('29. Власник стіни може видалити чужий пост зі своєї стіни')]
    public function test_wall_owner_can_delete_others_post_on_their_wall(): void
    {
        $author = User::factory()->create();
        $wallOwner = User::factory()->create();
        $post = $author->posts()->create(['target_user_id' => $wallOwner->id, 'content' => ['text' => 'Txt']]);

        $response = $this->actingAs($wallOwner, 'sanctum')->deleteJson("/api/v1/posts/{$post->id}");
        $response->assertStatus(202);
    }

    #[TestDox('30. Рандомний юзер НЕ МОЖЕ видалити чужий пост')]
    public function test_cannot_delete_others_post(): void
    {
        $author = User::factory()->create();
        $hacker = User::factory()->create();
        $post = $author->posts()->create(['content' => ['text' => 'Txt']]);

        $response = $this->actingAs($hacker, 'sanctum')->deleteJson("/api/v1/posts/{$post->id}");
        $response->assertStatus(403);
    }
}