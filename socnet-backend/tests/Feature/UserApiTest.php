<?php

namespace Tests\Feature;

use App\Models\Friendship;
use App\Models\User;
use App\Models\Post;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Notification;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class UserApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    #[TestDox('1. Отримання списку юзерів має пагінацію і правильний контракт')]
    public function test_users_list_returns_paginated_contract(): void
    {
        $me = User::factory()->create();
        User::factory()->count(3)->create();

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/users');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success', 'code',
                'data' => [
                    '*' => ['id', 'username', 'first_name', 'last_name', 'avatar']
                ],
                'links', 'meta' => ['current_page', 'total']
            ]);

        $this->assertCount(3, $response->json('data'));
    }

    #[TestDox('2. Privacy Bypass: Неможливо переглянути профіль юзера, який тебе заблокував')]
    public function test_cannot_view_profile_if_blocked(): void
    {
        $me = User::factory()->create();
        $enemy = User::factory()->create();

        Friendship::create(['user_id' => $enemy->id, 'friend_id' => $me->id, 'status' => 'blocked']);

        $response = $this->actingAs($me, 'sanctum')->getJson("/api/v1/users/{$enemy->username}");

        $this->assertContains($response->status(), [403, 404]);
    }

    #[TestDox('3. Чужий юзер отримує 403 і БАЗА ФІЗИЧНО НЕ ЗМІНЮЄТЬСЯ')]
    public function test_cannot_update_others_profile_and_db_is_untouched(): void
    {
        $target = User::factory()->create(['bio' => 'Safe bio']);
        $stranger = User::factory()->create();

        $response = $this->actingAs($stranger, 'sanctum')->patchJson("/api/v1/users/{$target->username}", [
            'bio' => 'Hacked bio'
        ]);

        $response->assertStatus(403);

        $this->assertEquals('Safe bio', $target->refresh()->bio);
    }

    #[TestDox('4. Успішне завантаження аватарки ЗБЕРІГАЄ ФАЙЛ НА ДИСК та створює пост')]
    public function test_can_upload_avatar_physically_to_disk(): void
    {
        $me = User::factory()->create(['avatar' => null]);
        $file = UploadedFile::fake()->image('avatar.jpg');

        $response = $this->actingAs($me, 'sanctum')->patchJson("/api/v1/users/{$me->username}", [
            'avatar' => $file
        ]);

        $response->assertStatus(200)->assertJsonPath('code', 'PROFILE_UPDATED');

        $me->refresh();
        $this->assertNotNull($me->getRawOriginal('avatar'));
        $this->assertNotNull($me->avatar_post_id);

        $this->assertTrue(Storage::disk('public')->exists($me->getRawOriginal('avatar')));

        $this->assertDatabaseHas('posts', [
            'id' => $me->avatar_post_id,
            'user_id' => $me->id,
            'content->is_avatar_update' => true
        ]);
    }

    #[TestDox('5. Видалення аватарки ФІЗИЧНО ВИДАЛЯЄ ЇЇ З ДИСКА')]
    public function test_can_remove_avatar_and_file_is_deleted_from_disk(): void
    {
        $me = User::factory()->create();

        $path = UploadedFile::fake()->image('test.jpg')->storeAs('avatars', 'test.jpg', 'public');

        $post = $me->posts()->create(['content' => ['is_avatar_update' => true]]);
        $me->update(['avatar' => $path, 'avatar_post_id' => $post->id]);

        $this->assertTrue(Storage::disk('public')->exists($path));

        $this->actingAs($me, 'sanctum')->patchJson("/api/v1/users/{$me->username}", [
            'remove_avatar' => true
        ])->assertStatus(200);

        $this->assertTrue(Storage::disk('public')->exists($path));
        $this->assertNull($me->refresh()->avatar_post_id);
    }

    #[TestDox('6. Зміна пошти скидає верифікацію і ВІДПРАВЛЯЄ ЛИСТ')]
    public function test_successful_email_update_resets_verification_and_sends_email(): void
    {
        Notification::fake();

        $me = User::factory()->create([
            'email' => 'old@example.com',
            'email_verified_at' => now(),
            'password' => Hash::make('password123')
        ]);

        $this->actingAs($me, 'sanctum')->putJson('/api/v1/user/email', [
            'email' => 'new@example.com',
            'password' => 'password123'
        ])->assertStatus(200);

        $me->refresh();
        $this->assertEquals('new@example.com', $me->email);
        $this->assertNull($me->email_verified_at);

        Notification::assertSentTo($me, VerifyEmail::class);
    }

    #[TestDox('7. Успішна зміна пароля ВБИВАЄ ІНШІ СЕСІЇ (Security)')]
    public function test_successful_password_update_revokes_other_tokens(): void
    {
        $me = User::factory()->create(['password' => Hash::make('password123')]);

        $currentSessionToken = $me->createToken('current_device')->plainTextToken;
        $hackerSessionToken = $me->createToken('hacker_device')->plainTextToken;

        $this->assertDatabaseCount('personal_access_tokens', 2);

        $response = $this->withToken($currentSessionToken)->putJson('/api/v1/user/password', [
            'current_password' => 'password123',
            'password' => 'StrongPass123!@#',
            'password_confirmation' => 'StrongPass123!@#'
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseMissing('personal_access_tokens', ['name' => 'hacker_device']);

        $this->assertDatabaseHas('personal_access_tokens', ['name' => 'current_device']);
    }

    #[TestDox('8. Захист від XSS у біографії')]
    public function test_bio_is_sanitized_against_xss(): void
    {
        $me = User::factory()->create();

        $response = $this->actingAs($me, 'sanctum')->patchJson("/api/v1/users/{$me->username}", [
            'bio' => '<script>alert(1)</script>Safe text'
        ]);

        $response->assertStatus(200);

        $this->assertStringNotContainsString('<script>', $me->refresh()->bio);
    }
}