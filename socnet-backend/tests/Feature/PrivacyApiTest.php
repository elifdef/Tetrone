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
        Friendship::create(['user_id' => $user1->id, 'friend_id' => $user2->id, 'status' => Friendship::STATUS_ACCEPTED]);
    }

    private function blockUser(User $blocker, User $blocked): void
    {
        Friendship::create(['user_id' => $blocker->id, 'friend_id' => $blocked->id, 'status' => Friendship::STATUS_BLOCKED]);
    }

    private function generateRichText(string $text = 'Cool'): array
    {
        return [
            'type' => 'doc',
            'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => $text]]]]
        ];
    }

    #[TestDox('1. Отримання налаштувань повертає суворий контракт (навіть дефолтний)')]
    public function test_user_can_get_settings_strict_contract(): void
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/settings/privacy');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success', 'code',
                'data' => [
                    'settings' => [],
                    'exceptions' => []
                ]
            ]);
    }

    #[TestDox('2. Успішне оновлення налаштування фізично змінює БД і не затирає інші')]
    public function test_user_can_update_specific_setting_without_overwriting(): void
    {
        $user = User::factory()->create(['privacy_settings' => ['avatar' => PrivacyLevel::Friends->value]]);

        $response = $this->actingAs($user, 'sanctum')->patchJson('/api/v1/settings/privacy', [
            'context' => PrivacyContext::WallPost->value,
            'level' => PrivacyLevel::Nobody->value
        ]);

        $response->assertStatus(200);

        $settings = $user->refresh()->privacy_settings;
        $this->assertEquals(PrivacyLevel::Nobody->value, $settings['wall_post']);
        $this->assertEquals(PrivacyLevel::Friends->value, $settings['avatar']);
    }

    #[TestDox('3. Створення та оновлення винятку (Exception) працює коректно в БД')]
    public function test_can_create_and_update_exception(): void
    {
        $user = User::factory()->create();
        $target = User::factory()->create();

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/settings/privacy/exceptions', [
            'target_user_id' => $target->id, 'context' => PrivacyContext::WallPost->value, 'is_allowed' => true
        ])->assertStatus(200);

        $this->assertDatabaseHas('user_privacy_exceptions', [
            'user_id' => $user->id, 'target_user_id' => $target->id, 'is_allowed' => true
        ]);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/settings/privacy/exceptions', [
            'target_user_id' => $target->id, 'context' => PrivacyContext::WallPost->value, 'is_allowed' => false
        ])->assertStatus(200);

        $this->assertDatabaseCount('user_privacy_exceptions', 1);
        $this->assertDatabaseHas('user_privacy_exceptions', ['is_allowed' => false]);
    }

    #[TestDox('4. Чужий юзер НЕ може видалити мій виняток (Security)')]
    public function test_cannot_delete_others_exception(): void
    {
        $owner = User::factory()->create();
        $hacker = User::factory()->create();
        $exception = UserPrivacyException::create([
            'user_id' => $owner->id, 'target_user_id' => User::factory()->create()->id, 'context' => 'profile', 'is_allowed' => true
        ]);

        $this->actingAs($hacker, 'sanctum')->deleteJson("/api/v1/settings/privacy/exceptions/{$exception->id}")
            ->assertStatus(200);

        $this->assertDatabaseHas('user_privacy_exceptions', ['id' => $exception->id]);
    }

    #[TestDox('5. Гість бачить замочок (is_private) і не бачить деталей закритого профілю')]
    public function test_guest_sees_private_placeholder_if_profile_closed(): void
    {
        $target = User::factory()->create([
            'birth_date' => '2000-01-01',
            'last_seen_at' => now(),
            'privacy_settings' => ['profile' => PrivacyLevel::Nobody->value]
        ]);

        $response = $this->getJson("/api/v1/users/{$target->username}");

        $response->assertStatus(200)
            ->assertJsonFragment([
                'is_private' => true,
                'avatar' => User::defaultAvatar,
                'is_online' => false,
                'birth_date' => null
            ]);
    }

    #[TestDox('6. Ізоляція контексту: виняток для профілю не відкриває аватарку')]
    public function test_exception_isolation_by_context(): void
    {
        $target = User::factory()->create([
            'avatar' => 'my-avatar.jpg',
            'privacy_settings' => ['profile' => PrivacyLevel::Nobody->value, 'avatar' => PrivacyLevel::Nobody->value]
        ]);
        $viewer = User::factory()->create();

        UserPrivacyException::create(['user_id' => $target->id, 'target_user_id' => $viewer->id, 'context' => 'profile', 'is_allowed' => true]);

        $response = $this->actingAs($viewer, 'sanctum')->getJson("/api/v1/users/{$target->username}");

        $response->assertStatus(200)
            ->assertJsonFragment(['is_private' => false, 'avatar' => User::defaultAvatar]);
    }

    #[TestDox('7. Створення поста на відкритій стіні (Everyone) РЕАЛЬНО пише в БД')]
    public function test_can_post_on_wall_if_everyone_creates_record(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['wall_post' => PrivacyLevel::Everyone->value]]);
        $writer = User::factory()->create();

        $this->actingAs($writer, 'sanctum')->postJson('/api/v1/posts', [
            'target_user_id' => $target->id,
            'payload' => json_encode(['text' => $this->generateRichText('Hi')])
        ])->assertStatus(201);

        $this->assertDatabaseHas('posts', ['user_id' => $writer->id, 'target_user_id' => $target->id]);
    }

    #[TestDox('8. Чужинець отримує 403 при спробі писати на Friends-only стіні і БД НЕ ЗМІНЮЄТЬСЯ')]
    public function test_stranger_cannot_post_on_friends_wall_and_db_is_untouched(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['wall_post' => PrivacyLevel::Friends->value]]);
        $stranger = User::factory()->create();

        $this->actingAs($stranger, 'sanctum')->postJson('/api/v1/posts', [
            'target_user_id' => $target->id,
            'payload' => json_encode(['text' => $this->generateRichText('Hacked')])
        ])->assertStatus(403);

        $this->assertDatabaseMissing('posts', ['target_user_id' => $target->id]);
    }

    #[TestDox('9. Виняток (Deny) блокує доступ навіть якщо стіна Everyone')]
    public function test_exception_deny_overrides_everyone_wall_post(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['wall_post' => PrivacyLevel::Everyone->value]]);
        $enemy = User::factory()->create();
        UserPrivacyException::create(['user_id' => $target->id, 'target_user_id' => $enemy->id, 'context' => 'wall_post', 'is_allowed' => false]);

        $this->actingAs($enemy, 'sanctum')->postJson('/api/v1/posts', [
            'target_user_id' => $target->id,
            'payload' => json_encode(['text' => $this->generateRichText('Hi')])
        ])->assertStatus(403);

        $this->assertDatabaseMissing('posts', ['user_id' => $enemy->id]);
    }

    #[TestDox('10. Неможливо коментувати (Nobody) - перевірка 403 та відсутності запису в БД')]
    public function test_cannot_comment_if_nobody_and_db_is_untouched(): void
    {
        $postOwner = User::factory()->create(['privacy_settings' => ['comment' => PrivacyLevel::Nobody->value]]);
        $post = $postOwner->posts()->create(['content' => ['text' => 'Hi'], 'can_comment' => true]);
        $commenter = User::factory()->create();

        $this->actingAs($commenter, 'sanctum')->postJson("/api/v1/posts/{$post->id}/comments", [
            'content' => $this->generateRichText('I bypass rules')
        ])->assertStatus(403);

        $this->assertDatabaseMissing('comments', ['post_id' => $post->id, 'user_id' => $commenter->id]);
    }

    #[TestDox('11. Заблокований юзер (ЧС) не може писати повідомлення незалежно від налаштувань')]
    public function test_blacklisted_user_cannot_message_regardless_of_privacy(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['message' => PrivacyLevel::Everyone->value]]);
        $blockedUser = User::factory()->create();

        $this->blockUser($target, $blockedUser);

        $this->actingAs($blockedUser, 'sanctum')->postJson('/api/v1/chat/init', ['target_user_id' => $target->id])
            ->assertStatus(403);

        $this->assertDatabaseMissing('chat_participants', ['user_id' => $blockedUser->id]);
    }

    #[TestDox('12. Прямий доступ до поста закритого профілю ЗАБОРОНЕНО (Direct Access Leak Check)')]
    public function test_direct_access_to_private_profile_post_is_forbidden(): void
    {
        $target = User::factory()->create(['privacy_settings' => ['profile' => PrivacyLevel::Nobody->value]]);
        $post = $target->posts()->create(['content' => ['text' => 'Secret Post']]);
        $stranger = User::factory()->create();

        $response = $this->actingAs($stranger, 'sanctum')->getJson("/api/v1/posts/{$post->id}");

        $this->assertContains($response->status(), [403]);
    }

    #[TestDox('13. Прямий репост із закритого профілю ЗАБОРОНЕНО')]
    public function test_cannot_repost_directly_if_profile_is_closed(): void
    {
        $postOwner = User::factory()->create(['privacy_settings' => ['profile' => PrivacyLevel::Nobody->value]]);
        $post = $postOwner->posts()->create(['content' => ['text' => 'Orig']]);
        $reposter = User::factory()->create();

        $this->actingAs($reposter, 'sanctum')->postJson('/api/v1/posts', [
            'payload' => json_encode([]),
            'original_post_id' => $post->id
        ])->assertStatus(403);

        $this->assertDatabaseMissing('posts', ['user_id' => $reposter->id, 'is_repost' => true]);
    }
}