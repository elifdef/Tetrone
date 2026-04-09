<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class UserApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local'); // Фейкове сховище для тестування аватарок
    }

    // ==========================================
    // 🔍 1. ПОШУК ТА ПЕРЕГЛЯД (INDEX & SHOW)
    // ==========================================

    #[TestDox('1. Анонімний юзер отримує 401 при спробі отримати список користувачів')]
    public function test_guest_cannot_get_users_list(): void
    {
        $response = $this->getJson('/api/v1/users');
        $response->assertStatus(401);
    }

    #[TestDox('2. Авторизований юзер отримує список, де немає його самого')]
    public function test_auth_user_gets_list_without_self(): void
    {
        $me = User::factory()->create();
        User::factory()->count(3)->create();

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/users');

        $response->assertStatus(200)->assertJsonPath('code', 'SUCCESS');
        $data = $response->json('data');

        $this->assertCount(3, $data);
        $this->assertEmpty(array_filter($data, fn($user) => $user['id'] === $me->id));
    }

    #[TestDox('3. Пошук коректно фільтрує юзерів за username або ім\'ям')]
    public function test_search_filters_users_correctly(): void
    {
        $me = User::factory()->create();
        User::factory()->create(['username' => 'john_doe', 'first_name' => 'John']);
        User::factory()->create(['username' => 'jane_smith', 'last_name' => 'Smith']);
        User::factory()->create(['username' => 'random_guy']);

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/users?search=john');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('john_doe', $response->json('data.0.username'));
    }

    #[TestDox('4. Можна отримати публічний профіль юзера за його username')]
    public function test_can_get_user_profile_by_username(): void
    {
        $me = User::factory()->create();
        // Додаємо created_at!
        $target = User::factory()->create(['username' => 'testuser', 'created_at' => now()]);

        $response = $this->actingAs($me, 'sanctum')->getJson("/api/v1/users/{$target->username}");

        $response->assertStatus(200)
            ->assertJsonPath('code', 'SUCCESS')
            ->assertJsonPath('data.username', 'testuser');
    }

    #[TestDox('5. Помилка 404, якщо юзера не існує')]
    public function test_404_if_user_not_found(): void
    {
        $me = User::factory()->create();
        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/users/non_existent_user');
        $response->assertStatus(404);
    }

    // ==========================================
    // ✏️ 2. ОНОВЛЕННЯ ПРОФІЛЮ (UPDATE)
    // ==========================================

    #[TestDox('6. Чужий юзер не може оновити профіль (403 Policy)')]
    public function test_cannot_update_someone_elses_profile(): void
    {
        $target = User::factory()->create(['username' => 'target']);
        $stranger = User::factory()->create();

        $response = $this->actingAs($stranger, 'sanctum')->patchJson("/api/v1/users/{$target->username}", [
            'bio' => 'Hacked bio'
        ]);

        $response->assertStatus(403);
    }

    #[TestDox('7. Власник успішно оновлює свій профіль')]
    public function test_owner_can_update_profile(): void
    {
        $me = User::factory()->create(['bio' => 'Old bio']);

        $response = $this->actingAs($me, 'sanctum')->patchJson("/api/v1/users/{$me->username}", [
            'bio' => 'New awesome bio',
            'first_name' => 'NewName'
        ]);

        $response->assertStatus(200)->assertJsonPath('code', 'PROFILE_UPDATED');
        $this->assertEquals('New awesome bio', $me->refresh()->bio);
        $this->assertEquals('NewName', $me->first_name);
    }

    #[TestDox('8. Викидається ApiException ERR_NOTHING_TO_UPDATE, якщо дані не змінилися')]
    public function test_returns_error_if_nothing_changed(): void
    {
        $me = User::factory()->create(['bio' => 'Same bio']);

        $response = $this->actingAs($me, 'sanctum')->patchJson("/api/v1/users/{$me->username}", [
            'bio' => 'Same bio'
        ]);

        $response->assertStatus(422)->assertJsonPath('code', 'ERR_NOTHING_TO_UPDATE');
    }

    #[TestDox('9. Успішне завантаження аватарки')]
    public function test_can_upload_avatar(): void
    {
        $me = User::factory()->create(['avatar' => null]);
        $file = UploadedFile::fake()->image('avatar.jpg');

        $response = $this->actingAs($me, 'sanctum')->patchJson("/api/v1/users/{$me->username}", [
            'avatar' => $file
        ]);

        $response->assertStatus(200)->assertJsonPath('code', 'PROFILE_UPDATED');
        $this->assertNotNull($me->refresh()->avatar);
        $this->assertNotNull($me->avatar_post_id); // Перевіряємо, що створився пост про оновлення аватарки
    }

    #[TestDox('10. Успішне видалення аватарки')]
    public function test_can_remove_avatar(): void
    {
        // 1. Спочатку створюємо юзера
        $me = User::factory()->create();

        // 2. Потім створюємо йому пост, щоб отримати легальний ID
        $post = $me->posts()->create(['content' => ['is_avatar_update' => true]]);

        // 3. І тільки тепер оновлюємо юзера, прив'язуючи цей пост
        $me->update(['avatar' => 'some_path.jpg', 'avatar_post_id' => $post->id]);

        $response = $this->actingAs($me, 'sanctum')->patchJson("/api/v1/users/{$me->username}", [
            'remove_avatar' => true
        ]);

        $response->assertStatus(200)->assertJsonPath('code', 'PROFILE_UPDATED');
        $this->assertEquals(User::defaultAvatar, $me->refresh()->avatar);
        $this->assertNull($me->avatar_post_id);
    }

    #[TestDox('11. Оновлення пошти вимагає поточний пароль')]
    public function test_update_email_requires_current_password(): void
    {
        $me = User::factory()->create(['password' => Hash::make('password123')]);

        $response = $this->actingAs($me, 'sanctum')->putJson('/api/v1/user/email', [
            'email' => 'new@example.com',
            'password' => 'wrong_password'
        ]);

        // Помилка валідації від FormRequest
        $response->assertStatus(422)->assertJsonValidationErrors(['password']);
    }

    #[TestDox('12. Неможливо змінити пошту на ту, що вже зайнята')]
    public function test_cannot_update_to_taken_email(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);
        $me = User::factory()->create(['password' => Hash::make('password123')]);

        $response = $this->actingAs($me, 'sanctum')->putJson('/api/v1/user/email', [
            'email' => 'taken@example.com',
            'password' => 'password123'
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['email']);
    }

    #[TestDox('13. Успішна зміна пошти скидає статус верифікації')]
    public function test_successful_email_update_resets_verification(): void
    {
        $me = User::factory()->create([
            'email' => 'old@example.com',
            'email_verified_at' => now(),
            'password' => Hash::make('password123')
        ]);

        $response = $this->actingAs($me, 'sanctum')->putJson('/api/v1/user/email', [
            'email' => 'new@example.com',
            'password' => 'password123'
        ]);

        $response->assertStatus(200)->assertJsonPath('code', 'EMAIL_UPDATED');

        $me->refresh();
        $this->assertEquals('new@example.com', $me->email);
        $this->assertNull($me->email_verified_at); // Статус скинуто!
    }

    #[TestDox('14. Зміна пароля вимагає правильний поточний пароль')]
    public function test_update_password_requires_correct_current_password(): void
    {
        $me = User::factory()->create(['password' => Hash::make('password123')]);

        $response = $this->actingAs($me, 'sanctum')->putJson('/api/v1/user/password', [
            'current_password' => 'wrong_current',
            'password' => 'NewPass123!',
            'password_confirmation' => 'NewPass123!'
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['current_password']);
    }

    #[TestDox('15. Зміна пароля відхиляється, якщо підтвердження не збігається')]
    public function test_password_update_fails_if_confirmation_does_not_match(): void
    {
        $me = User::factory()->create(['password' => Hash::make('password123')]);

        $response = $this->actingAs($me, 'sanctum')->putJson('/api/v1/user/password', [
            'current_password' => 'password123',
            'password' => 'NewPass123!',
            'password_confirmation' => 'DifferentPass!'
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['password']);
    }

    #[TestDox('16. Зміна пароля відхиляється, якщо пароль надто слабкий')]
    public function test_password_update_fails_if_too_weak(): void
    {
        $me = User::factory()->create(['password' => Hash::make('password123')]);

        $response = $this->actingAs($me, 'sanctum')->putJson('/api/v1/user/password', [
            'current_password' => 'password123',
            'password' => 'weak', // Заслабкий
            'password_confirmation' => 'weak'
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['password']);
    }

    #[TestDox('17. Успішна зміна пароля')]
    public function test_successful_password_update(): void
    {
        $me = User::factory()->create(['password' => Hash::make('password123')]);

        $response = $this->actingAs($me, 'sanctum')->putJson('/api/v1/user/password', [
            'current_password' => 'password123',
            'password' => 'StrongPass123!@#',
            'password_confirmation' => 'StrongPass123!@#'
        ]);

        $response->assertStatus(200)->assertJsonPath('code', 'PASSWORD_UPDATED');

        $this->assertTrue(Hash::check('StrongPass123!@#', $me->refresh()->password));
    }
}