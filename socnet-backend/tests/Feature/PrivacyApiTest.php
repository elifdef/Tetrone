<?php

namespace Tests\Feature;

use App\Enums\PrivacyContext;
use App\Enums\PrivacyLevel;
use App\Enums\Role;
use App\Models\Friendship;
use App\Models\Post;
use App\Models\User;
use App\Models\UserPrivacyException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class PrivacyApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeFriends(User $user1, User $user2): void
    {
        Friendship::create([
            'user_id' => $user1->id,
            'friend_id' => $user2->id,
            'status' => Friendship::STATUS_ACCEPTED
        ]);
    }

    private array $validCommentPayload = [
        'content' => [
            'type' => 'doc',
            'content' => [
                ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Cool']]]
            ]
        ]
    ];

    #[TestDox('1. Анонімний юзер отримує 401 при спробі зайти в налаштування')]
    public function test_guest_cannot_access_privacy_settings(): void
    {
        $response = $this->getJson('/api/v1/settings/privacy');
        $response->assertStatus(401);
    }

    #[TestDox('2. Новий юзер отримує порожні налаштування (працюють дефолти)')]
    public function test_user_can_get_default_empty_settings(): void
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/settings/privacy');

        $response->assertStatus(200)
            ->assertJsonPath('data.settings', [])
            ->assertJsonPath('data.exceptions', []);
    }

    #[TestDox('3. Успішне оновлення одного налаштування (PATCH)')]
    public function test_user_can_update_specific_setting(): void
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user, 'sanctum')->patchJson('/api/v1/settings/privacy', [
            'context' => PrivacyContext::WallPost->value,
            'level' => PrivacyLevel::Friends->value
        ]);

        $response->assertStatus(200);
        $this->assertEquals(PrivacyLevel::Friends->value, $user->refresh()->privacy_settings['wall_post']);
    }

    #[TestDox('4. Помилка валідації: неіснуючий контекст')]
    public function test_cannot_update_invalid_context(): void
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user, 'sanctum')->patchJson('/api/v1/settings/privacy', [
            'context' => 'invalid_context_name',
            'level' => PrivacyLevel::Friends->value
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['context']);
    }

    #[TestDox('5. Помилка валідації: неіснуючий рівень доступу')]
    public function test_cannot_update_invalid_level(): void
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user, 'sanctum')->patchJson('/api/v1/settings/privacy', [
            'context' => PrivacyContext::Profile->value,
            'level' => 999
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['level']);
    }

    #[TestDox('6. Оновлення одного поля не затирає інші в JSON')]
    public function test_updating_one_setting_does_not_overwrite_others(): void
    {
        $user = User::factory()->create(['privacy_settings' => ['avatar' => 2]]);

        $this->actingAs($user, 'sanctum')->patchJson('/api/v1/settings/privacy', [
            'context' => 'profile', 'level' => 1
        ]);

        $settings = $user->refresh()->privacy_settings;
        $this->assertEquals(2, $settings['avatar']);
        $this->assertEquals(1, $settings['profile']);
    }

    #[TestDox('7. Створення винятку (Дозвіл для конкретного юзера)')]
    public function test_can_create_allow_exception(): void
    {
        $user = User::factory()->create();
        $friend = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/settings/privacy/exceptions', [
            'target_user_id' => $friend->id,
            'context' => PrivacyContext::WallPost->value,
            'is_allowed' => true
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('user_privacy_exceptions', [
            'user_id' => $user->id,
            'target_user_id' => $friend->id,
            'context' => 'wall_post',
            'is_allowed' => true
        ]);
    }

    #[TestDox('8. Створення винятку (Заборона для конкретного юзера)')]
    public function test_can_create_deny_exception(): void
    {
        $user = User::factory()->create();
        $enemy = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/settings/privacy/exceptions', [
            'target_user_id' => $enemy->id,
            'context' => PrivacyContext::Message->value,
            'is_allowed' => false
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('user_privacy_exceptions', ['is_allowed' => false]);
    }

    #[TestDox('9. Оновлення існуючого винятку замість створення дубля')]
    public function test_exception_updates_instead_of_duplicate(): void
    {
        $user = User::factory()->create();
        $target = User::factory()->create();

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/settings/privacy/exceptions', [
            'target_user_id' => $target->id, 'context' => 'avatar', 'is_allowed' => true
        ]);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/settings/privacy/exceptions', [
            'target_user_id' => $target->id, 'context' => 'avatar', 'is_allowed' => false
        ]);

        $this->assertDatabaseCount('user_privacy_exceptions', 1);
        $this->assertDatabaseHas('user_privacy_exceptions', ['is_allowed' => false]);
    }

    #[TestDox('10. Неможливо створити виняток для неіснуючого юзера')]
    public function test_cannot_create_exception_for_invalid_user(): void
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/settings/privacy/exceptions', [
            'target_user_id' => 99999, 'context' => 'avatar', 'is_allowed' => true
        ]);
        $response->assertStatus(422);
    }

    #[TestDox('11. Успішне видалення винятку')]
    public function test_can_delete_exception(): void
    {
        $user = User::factory()->create();
        $exception = UserPrivacyException::create([
            'user_id' => $user->id, 'target_user_id' => User::factory()->create()->id,
            'context' => 'avatar', 'is_allowed' => true
        ]);

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/v1/settings/privacy/exceptions/{$exception->id}");
        $response->assertStatus(200);
        $this->assertDatabaseMissing('user_privacy_exceptions', ['id' => $exception->id]);
    }

    #[TestDox('12. Неможливо видалити чужий виняток')]
    public function test_cannot_delete_others_exception(): void
    {
        $user = User::factory()->create();
        $hacker = User::factory()->create();
        $exception = UserPrivacyException::create([
            'user_id' => $user->id, 'target_user_id' => $hacker->id, 'context' => 'avatar'
        ]);

        $response = $this->actingAs($hacker, 'sanctum')->deleteJson("/api/v1/settings/privacy/exceptions/{$exception->id}");
        $response->assertStatus(200);
        $this->assertDatabaseHas('user_privacy_exceptions', ['id' => $exception->id]);
    }

    #[TestDox('13. Юзер завжди бачить свій профіль повністю')]
    public function test_user_can_see_own_completely_private_profile(): void
    {
        $user = User::factory()->create(['privacy_settings' => ['profile' => PrivacyLevel::Nobody->value]]);
        $response = $this->actingAs($user, 'sanctum')->getJson("/api/v1/users/{$user->username}");
        $response->assertStatus(200)->assertJsonFragment(['is_private' => false]);
    }

    #[TestDox('14. Адмін завжди бачить закритий профіль')]
    public function test_admin_can_see_private_profile(): void
    {
        $admin = User::factory()->create(['role' => Role::Admin->value]);
        $target = User::factory()->create(['privacy_settings' => ['profile' => PrivacyLevel::Nobody->value]]);
        $response = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/users/{$target->username}");
        $response->assertStatus(200)->assertJsonFragment(['is_private' => false]);
    }

    #[TestDox('15. Гість бачить ЗАМОЧОК (is_private: true) для закритого профілю')]
    public function test_guest_sees_private_placeholder_if_profile_closed(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['profile' => PrivacyLevel::Nobody->value]]);
        $response = $this->getJson("/api/v1/users/{$target->username}");
        $response->assertStatus(200)
            ->assertJsonFragment(['is_private' => true, 'avatar' => User::defaultAvatar, 'is_online' => false]);
    }

    #[TestDox('16. Гість бачить відкритий профіль (дефолт Everyone)')]
    public function test_guest_sees_open_profile(): void
    {
        $target = User::factory()->create();
        $response = $this->getJson("/api/v1/users/{$target->username}");
        $response->assertStatus(200)->assertJsonFragment(['is_private' => false]);
    }

    #[TestDox('17. Якщо дата народження прихована (Nobody), її не бачить ніхто')]
    public function test_dob_hidden_if_nobody(): void
    {
        $target = User::factory()->create(['birth_date' => '2000-01-01', 'privacy_settings' => ['dob' => PrivacyLevel::Nobody->value]]);
        $friend = User::factory()->create();
        $this->makeFriends($target, $friend);
        $response = $this->actingAs($friend, 'sanctum')->getJson("/api/v1/users/{$target->username}");
        $response->assertStatus(200)->assertJsonFragment(['birth_date' => null]);
    }

    #[TestDox('18. Друг бачить поле, якщо воно Friends-only')]
    public function test_friend_sees_friends_only_field(): void
    {
        $target = User::factory()->create(['country' => 'UA', 'privacy_settings' => ['country' => PrivacyLevel::Friends->value]]);
        $friend = User::factory()->create();
        $this->makeFriends($target, $friend);
        $response = $this->actingAs($friend, 'sanctum')->getJson("/api/v1/users/{$target->username}");
        $response->assertStatus(200)->assertJsonFragment(['country' => 'UA']);
    }

    #[TestDox('19. Чужий юзер НЕ бачить поле, якщо воно Friends-only')]
    public function test_stranger_cannot_see_friends_only_field(): void
    {
        $target = User::factory()->create(['country' => 'UA', 'privacy_settings' => ['country' => PrivacyLevel::Friends->value]]);
        $stranger = User::factory()->create();
        $response = $this->actingAs($stranger, 'sanctum')->getJson("/api/v1/users/{$target->username}");
        $response->assertStatus(200)->assertJsonFragment(['country' => null]);
    }

    #[TestDox('20. ВИНЯТОК (Дозвіл): Профіль Nobody, але є виняток для конкретного юзера')]
    public function test_exception_allow_profile_visibility(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['profile' => PrivacyLevel::Nobody->value]]);
        $viewer = User::factory()->create();
        UserPrivacyException::create(['user_id' => $target->id, 'target_user_id' => $viewer->id, 'context' => 'profile', 'is_allowed' => true]);
        $response = $this->actingAs($viewer, 'sanctum')->getJson("/api/v1/users/{$target->username}");
        $response->assertStatus(200)->assertJsonFragment(['is_private' => false]);
    }

    #[TestDox('21. ВИНЯТОК (Заборона): Профіль Everyone, але є виняток (Чорний список для поля)')]
    public function test_exception_deny_profile_visibility(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['profile' => PrivacyLevel::Everyone->value]]);
        $viewer = User::factory()->create();
        UserPrivacyException::create(['user_id' => $target->id, 'target_user_id' => $viewer->id, 'context' => 'profile', 'is_allowed' => false]);
        $response = $this->actingAs($viewer, 'sanctum')->getJson("/api/v1/users/{$target->username}");
        $response->assertStatus(200)->assertJsonFragment(['is_private' => true]);
    }

    #[TestDox('22. Виняток працює ТІЛЬКИ для свого контексту (Дозволено профіль, але заборонено аватар)')]
    public function test_exception_isolation_by_context(): void
    {
        $target = User::factory()->create([
            'avatar' => 'my-avatar.jpg',
            'privacy_settings' => ['profile' => PrivacyLevel::Nobody->value, 'avatar' => PrivacyLevel::Nobody->value]
        ]);
        $viewer = User::factory()->create();
        UserPrivacyException::create(['user_id' => $target->id, 'target_user_id' => $viewer->id, 'context' => 'profile', 'is_allowed' => true]);
        $response = $this->actingAs($viewer, 'sanctum')->getJson("/api/v1/users/{$target->username}");
        $response->assertStatus(200)->assertJsonFragment(['is_private' => false, 'avatar' => User::defaultAvatar]);
    }

    #[TestDox('23. Онлайн статус прихований, якщо профіль Private')]
    public function test_online_status_hidden_if_private(): void
    {
        $target = User::factory()->create(['last_seen_at' => now(), 'privacy_settings' => ['profile' => PrivacyLevel::Nobody->value]]);
        $response = $this->getJson("/api/v1/users/{$target->username}");
//        dd($response);
        $response->assertJsonPath('data.last_seen_at', null)
            ->assertJsonPath('data.is_online', false);
    }

    #[TestDox('24. Писати на стіні можна всім (Everyone)')]
    public function test_can_post_on_wall_if_everyone(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['wall_post' => PrivacyLevel::Everyone->value]]);
        $writer = User::factory()->create();

        $response = $this->actingAs($writer, 'sanctum')->postJson('/api/v1/posts', ['target_user_id' => $target->id, 'payload' => json_encode(['text' => 'Hi'])]);
        $response->assertStatus(201);
    }

    #[TestDox('25. Писати на стіні неможливо нікому (Nobody)')]
    public function test_cannot_post_on_wall_if_nobody(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['wall_post' => PrivacyLevel::Nobody->value]]);
        $writer = User::factory()->create();

        $response = $this->actingAs($writer, 'sanctum')->postJson('/api/v1/posts', ['target_user_id' => $target->id, 'payload' => json_encode(['text' => 'Hi'])]);
        $response->assertStatus(403);
    }

    #[TestDox('26. Друг може писати на стіні (Friends)')]
    public function test_friend_can_post_on_wall(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['wall_post' => PrivacyLevel::Friends->value]]);
        $friend = User::factory()->create();
        $this->makeFriends($target, $friend);

        $response = $this->actingAs($friend, 'sanctum')->postJson('/api/v1/posts', ['target_user_id' => $target->id, 'payload' => json_encode(['text' => 'Hi'])]);
        $response->assertStatus(201);
    }

    #[TestDox('27. Чужий НЕ може писати на стіні (Friends)')]
    public function test_stranger_cannot_post_on_wall(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['wall_post' => PrivacyLevel::Friends->value]]);
        $stranger = User::factory()->create();

        $response = $this->actingAs($stranger, 'sanctum')->postJson('/api/v1/posts', ['target_user_id' => $target->id, 'payload' => json_encode(['text' => 'Hi'])]);
        $response->assertStatus(403);
    }

    #[TestDox('28. ВИНЯТОК: Може писати на стіні (Custom + Allow)')]
    public function test_exception_allow_wall_post(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['wall_post' => PrivacyLevel::Custom->value]]);
        $writer = User::factory()->create();
        UserPrivacyException::create(['user_id' => $target->id, 'target_user_id' => $writer->id, 'context' => 'wall_post', 'is_allowed' => true]);

        $response = $this->actingAs($writer, 'sanctum')->postJson('/api/v1/posts', ['target_user_id' => $target->id, 'payload' => json_encode(['text' => 'Hi'])]);
        $response->assertStatus(201);
    }

    #[TestDox('29. ВИНЯТОК: НЕ може писати на стіні (Everyone + Deny)')]
    public function test_exception_deny_wall_post(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['wall_post' => PrivacyLevel::Everyone->value]]);
        $enemy = User::factory()->create();
        UserPrivacyException::create(['user_id' => $target->id, 'target_user_id' => $enemy->id, 'context' => 'wall_post', 'is_allowed' => false]);

        $response = $this->actingAs($enemy, 'sanctum')->postJson('/api/v1/posts', ['target_user_id' => $target->id, 'payload' => json_encode(['text' => 'Hi'])]);
        $response->assertStatus(403);
    }

    #[TestDox('30. Власник завжди може писати на своїй закритій стіні')]
    public function test_owner_can_always_post_on_own_wall(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['wall_post' => PrivacyLevel::Nobody->value]]);
        $response = $this->actingAs($target, 'sanctum')->postJson('/api/v1/posts', ['target_user_id' => $target->id, 'payload' => json_encode(['text' => 'Hi'])]);
        $response->assertStatus(201);
    }

    #[TestDox('31. Можна писати в ПП всім (Everyone)')]
    public function test_can_message_if_everyone(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['message' => PrivacyLevel::Everyone->value]]);
        $sender = User::factory()->create();

        $response = $this->actingAs($sender, 'sanctum')->postJson('/api/v1/chat/init', ['target_user_id' => $target->id]);
        $response->assertStatus(201);
    }

    #[TestDox('32. Неможливо писати в ПП (Nobody)')]
    public function test_cannot_message_if_nobody(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['message' => PrivacyLevel::Nobody->value]]);
        $sender = User::factory()->create();

        $response = $this->actingAs($sender, 'sanctum')->postJson('/api/v1/chat/init', ['target_user_id' => $target->id]);
        $response->assertStatus(403);
    }

    #[TestDox('33. Друг може писати в ПП (Friends)')]
    public function test_friend_can_message(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['message' => PrivacyLevel::Friends->value]]);
        $friend = User::factory()->create();
        $this->makeFriends($target, $friend);

        $response = $this->actingAs($friend, 'sanctum')->postJson('/api/v1/chat/init', ['target_user_id' => $target->id]);
        $response->assertStatus(201);
    }

    #[TestDox('34. Чужий НЕ може писати в ПП (Friends)')]
    public function test_stranger_cannot_message(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['message' => PrivacyLevel::Friends->value]]);
        $stranger = User::factory()->create();

        $response = $this->actingAs($stranger, 'sanctum')->postJson('/api/v1/chat/init', ['target_user_id' => $target->id]);
        $response->assertStatus(403);
    }

    #[TestDox('35. ВИНЯТОК: Може писати в ПП (Custom + Allow)')]
    public function test_exception_allow_message(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['message' => PrivacyLevel::Custom->value]]);
        $writer = User::factory()->create();
        UserPrivacyException::create(['user_id' => $target->id, 'target_user_id' => $writer->id, 'context' => 'message', 'is_allowed' => true]);

        $response = $this->actingAs($writer, 'sanctum')->postJson('/api/v1/chat/init', ['target_user_id' => $target->id]);
        $response->assertStatus(201);
    }

    #[TestDox('36. ВИНЯТОК: НЕ може писати в ПП (Everyone + Deny)')]
    public function test_exception_deny_message(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['message' => PrivacyLevel::Everyone->value]]);
        $enemy = User::factory()->create();
        UserPrivacyException::create(['user_id' => $target->id, 'target_user_id' => $enemy->id, 'context' => 'message', 'is_allowed' => false]);

        $response = $this->actingAs($enemy, 'sanctum')->postJson('/api/v1/chat/init', ['target_user_id' => $target->id]);
        $response->assertStatus(403);
    }

    #[TestDox('37. Можна коментувати пости (Everyone)')]
    public function test_can_comment_if_everyone(): void
    {
        $postOwner = User::factory()->create(['privacy_settings' => ['comment' => PrivacyLevel::Everyone->value]]);
        $post = $postOwner->posts()->create(['content' => ['text' => 'Hi'], 'can_comment' => true]);
        $commenter = User::factory()->create();

        $response = $this->actingAs($commenter, 'sanctum')->postJson("/api/v1/posts/{$post->id}/comments", $this->validCommentPayload);
        $response->assertStatus(201);
    }

    #[TestDox('38. Неможливо коментувати пости (Nobody)')]
    public function test_cannot_comment_if_nobody(): void
    {
        $postOwner = User::factory()->create(['privacy_settings' => ['comment' => PrivacyLevel::Nobody->value]]);
        $post = $postOwner->posts()->create(['content' => ['text' => 'Hi'], 'can_comment' => true]);
        $commenter = User::factory()->create();

        $response = $this->actingAs($commenter, 'sanctum')->postJson("/api/v1/posts/{$post->id}/comments", ['content' => ['text' => 'Cool']]);
        $response->assertStatus(403);
    }

    #[TestDox('39. Чужий НЕ може коментувати пости (Friends)')]
    public function test_stranger_cannot_comment_if_friends_only(): void
    {
        $postOwner = User::factory()->create(['privacy_settings' => ['comment' => PrivacyLevel::Friends->value]]);
        $post = $postOwner->posts()->create(['content' => ['text' => 'Hi'], 'can_comment' => true]);
        $stranger = User::factory()->create();

        $response = $this->actingAs($stranger, 'sanctum')->postJson("/api/v1/posts/{$post->id}/comments", ['content' => ['text' => 'Cool']]);
        $response->assertStatus(403);
    }

    #[TestDox('40. Друг може коментувати пости (Friends)')]
    public function test_friend_can_comment_if_friends_only(): void
    {
        $postOwner = User::factory()->create(['privacy_settings' => ['comment' => PrivacyLevel::Friends->value]]);
        $post = $postOwner->posts()->create(['content' => ['text' => 'Hi'], 'can_comment' => true]);
        $friend = User::factory()->create();
        $this->makeFriends($postOwner, $friend);

        $response = $this->actingAs($friend, 'sanctum')->postJson("/api/v1/posts/{$post->id}/comments", $this->validCommentPayload);
        $response->assertStatus(201);
    }

    #[TestDox('41. ВИНЯТОК: Може коментувати (Custom + Allow)')]
    public function test_exception_allow_comment(): void
    {
        $postOwner = User::factory()->create(['privacy_settings' => ['comment' => PrivacyLevel::Custom->value]]);
        $post = $postOwner->posts()->create(['content' => ['text' => 'Hi'], 'can_comment' => true]);
        $commenter = User::factory()->create();
        UserPrivacyException::create(['user_id' => $postOwner->id, 'target_user_id' => $commenter->id, 'context' => 'comment', 'is_allowed' => true]);

        $response = $this->actingAs($commenter, 'sanctum')->postJson("/api/v1/posts/{$post->id}/comments", $this->validCommentPayload);
        $response->assertStatus(201);
    }

    #[TestDox('42. ВИНЯТОК: НЕ може коментувати (Everyone + Deny)')]
    public function test_exception_deny_comment(): void
    {
        $postOwner = User::factory()->create(['privacy_settings' => ['comment' => PrivacyLevel::Everyone->value]]);
        $post = $postOwner->posts()->create(['content' => ['text' => 'Hi'], 'can_comment' => true]);
        $enemy = User::factory()->create();
        UserPrivacyException::create(['user_id' => $postOwner->id, 'target_user_id' => $enemy->id, 'context' => 'comment', 'is_allowed' => false]);

        $response = $this->actingAs($enemy, 'sanctum')->postJson("/api/v1/posts/{$post->id}/comments", ['content' => ['text' => 'Cool']]);
        $response->assertStatus(403);
    }

    #[TestDox('43. Репост неможливий, якщо профіль власника поста закритий')]
    public function test_cannot_repost_if_profile_is_closed(): void
    {
        $postOwner = User::factory()->create(['privacy_settings' => ['profile' => PrivacyLevel::Nobody->value]]);
        $post = $postOwner->posts()->create(['content' => ['text' => 'Orig']]);
        $reposter = User::factory()->create();

        $response = $this->actingAs($reposter, 'sanctum')->postJson('/api/v1/posts', ['original_post_id' => $post->id]);
        $response->assertStatus(403);
    }

    #[TestDox('44. Масив permissions у Resource правильний для Гістя (все false)')]
    public function test_permissions_array_correct_for_guest(): void
    {
        $target = User::factory()->create();
        $response = $this->getJson("/api/v1/users/{$target->username}");
        $response->assertStatus(200)->assertJsonFragment([
            'can_message' => false,
            'can_post_on_wall' => false
        ]);
    }

    #[TestDox('45. Масив permissions у Resource правильний для авторизованого (залежить від налаштувань)')]
    public function test_permissions_array_correct_for_auth_user(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['message' => PrivacyLevel::Nobody->value, 'wall_post' => PrivacyLevel::Everyone->value]]);
        $viewer = User::factory()->create();
        $response = $this->actingAs($viewer, 'sanctum')->getJson("/api/v1/users/{$target->username}");
        $response->assertStatus(200)->assertJsonFragment([
            'can_message' => false,
            'can_post_on_wall' => true
        ]);
    }

    #[TestDox('46. Якщо юзер заблокований (ЧС), він не може писати повідомлення, навіть якщо приватність Everyone')]
    public function test_blacklisted_user_cannot_message_regardless_of_privacy(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['message' => PrivacyLevel::Everyone->value]]);
        $blockedUser = User::factory()->create();

        Friendship::create([
            'user_id' => $target->id, 'friend_id' => $blockedUser->id, 'status' => Friendship::STATUS_BLOCKED
        ]);

        $response = $this->actingAs($blockedUser, 'sanctum')->postJson('/api/v1/chat/init', ['target_user_id' => $target->id]);
        $response->assertStatus(403);
    }

    #[TestDox('47. Якщо юзер заблокований (ЧС), він не може коментувати')]
    public function test_blacklisted_user_cannot_comment_regardless_of_privacy(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['comment' => PrivacyLevel::Everyone->value]]);
        $post = $target->posts()->create(['content' => ['text' => 'Hi'], 'can_comment' => true]);
        $blockedUser = User::factory()->create();

        Friendship::create(['user_id' => $target->id, 'friend_id' => $blockedUser->id, 'status' => Friendship::STATUS_BLOCKED]);

        $response = $this->actingAs($blockedUser, 'sanctum')->postJson("/api/v1/posts/{$post->id}/comments", ['content' => ['text' => 'x']]);
        $response->assertStatus(403);
    }

    #[TestDox('48. Отримання постів юзера віддає порожній список, якщо профіль закритий')]
    public function test_fetching_wall_posts_returns_empty_if_profile_closed(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['profile' => PrivacyLevel::Nobody->value]]);
        $target->posts()->create(['content' => ['text' => 'Secret Post']]);
        $stranger = User::factory()->create();

        $response = $this->actingAs($stranger, 'sanctum')->getJson("/api/v1/users/{$target->username}/posts");
        $response->assertStatus(200);
        $this->assertEmpty($response->json('data'));
    }

    #[TestDox('49. Отримання постів юзера віддає пости, якщо профіль відкритий')]
    public function test_fetching_wall_posts_returns_data_if_profile_open(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['profile' => PrivacyLevel::Everyone->value]]);
        $target->posts()->create(['content' => ['text' => 'Public Post']]);
        $stranger = User::factory()->create();

        $response = $this->actingAs($stranger, 'sanctum')->getJson("/api/v1/users/{$target->username}/posts");
        $response->assertStatus(200);
        $this->assertNotEmpty($response->json('data'));
    }

    #[TestDox('50. Адмін може читати пости на закритій стіні')]
    public function test_admin_can_fetch_wall_posts_from_closed_profile(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['profile' => PrivacyLevel::Nobody->value]]);
        $target->posts()->create(['content' => ['text' => 'Secret']]);
        $admin = User::factory()->create(['role' => Role::Admin->value]);

        $response = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/users/{$target->username}/posts");
        $response->assertStatus(200);
        $this->assertNotEmpty($response->json('data'));
    }

    #[TestDox('51. Власник може читати пости на своїй закритій стіні')]
    public function test_owner_can_fetch_own_wall_posts(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['profile' => PrivacyLevel::Nobody->value]]);
        $target->posts()->create(['content' => ['text' => 'Secret']]);

        $response = $this->actingAs($target, 'sanctum')->getJson("/api/v1/users/{$target->username}/posts");
        $response->assertStatus(200);
        $this->assertNotEmpty($response->json('data'));
    }

    #[TestDox('52. Друг може читати пости, якщо профіль Friends-only')]
    public function test_friend_can_fetch_wall_posts_if_friends_only(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['profile' => PrivacyLevel::Friends->value]]);
        $target->posts()->create(['content' => ['text' => 'Friends Post']]);
        $friend = User::factory()->create();
        $this->makeFriends($target, $friend);

        $response = $this->actingAs($friend, 'sanctum')->getJson("/api/v1/users/{$target->username}/posts");
        $response->assertStatus(200);
        $this->assertNotEmpty($response->json('data'));
    }

    #[TestDox('53. Видалення винятку через API справді скасовує доступ')]
    public function test_deleting_allow_exception_revokes_access(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['profile' => PrivacyLevel::Nobody->value]]);
        $viewer = User::factory()->create();

        $exception = UserPrivacyException::create(['user_id' => $target->id, 'target_user_id' => $viewer->id, 'context' => 'profile', 'is_allowed' => true]);

        // Перевіряємо фрагмент:
        $this->actingAs($viewer, 'sanctum')->getJson("/api/v1/users/{$target->username}")->assertJsonFragment(['is_private' => false]);

        $this->actingAs($target, 'sanctum')->deleteJson("/api/v1/settings/privacy/exceptions/{$exception->id}");

        // Перевіряємо фрагмент:
        $this->actingAs($viewer, 'sanctum')->getJson("/api/v1/users/{$target->username}")->assertJsonFragment(['is_private' => true]);
    }

    #[TestDox('54. Не можна додати виняток без параметру is_allowed')]
    public function test_cannot_create_exception_without_is_allowed(): void
    {
        $user = User::factory()->create();
        $target = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/settings/privacy/exceptions', [
            'target_user_id' => $target->id, 'context' => 'profile'
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors(['is_allowed']);
    }

    #[TestDox('55. Якщо can_comment у поста false, то навіть Everyone не допоможе')]
    public function test_cannot_comment_if_post_disabled_comments_even_if_privacy_everyone(): void
    {
        $postOwner = User::factory()->create(['privacy_settings' => ['comment' => PrivacyLevel::Everyone->value]]);
        $post = $postOwner->posts()->create(['content' => ['text' => 'Hi'], 'can_comment' => false]);
        $commenter = User::factory()->create();

        $response = $this->actingAs($commenter, 'sanctum')->postJson("/api/v1/posts/{$post->id}/comments", ['content' => ['text' => 'Cool']]);
        $response->assertStatus(403);
    }
}