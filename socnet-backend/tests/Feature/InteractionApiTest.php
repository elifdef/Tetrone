<?php

namespace Tests\Feature;

use App\Enums\PrivacyLevel;
use App\Models\Comment;
use App\Models\Friendship;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class InteractionApiTest extends TestCase
{
    use RefreshDatabase;

    private array $validRichText = [
        'type' => 'doc',
        'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Cool']]]]
    ];

    private array $validRichText2 = [
        'type' => 'doc',
        'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Hello']]]]
    ];

    private function makeFriends(User $user1, User $user2): void
    {
        Friendship::create(['user_id' => $user1->id, 'friend_id' => $user2->id, 'status' => Friendship::STATUS_ACCEPTED]);
    }

    private function blockUser(User $blocker, User $blocked): void
    {
        Friendship::create(['user_id' => $blocker->id, 'friend_id' => $blocked->id, 'status' => Friendship::STATUS_BLOCKED]);
    }

    #[TestDox('1. Глобальна стрічка доступна гостю (тепер авторизованому)')]
    public function test_global_feed_available_to_guest(): void
    {
        $user = User::factory()->create();
        $user->posts()->create(['content' => ['text' => ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Hello World']]]]]]]);

        // Додали actingAs!
        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/feed/global');
        $response->assertStatus(200)->assertJsonPath('code', 'GLOBAL_FEED_RETRIEVED');
    }

    #[TestDox('2. Глобальна стрічка приховує пости заблокованих користувачів')]
    public function test_global_feed_hides_blocked_users(): void
    {
        $me = User::factory()->create();
        $enemy = User::factory()->create();
        $this->blockUser($me, $enemy);

        $enemy->posts()->create(['content' => ['text' => 'Bad Post']]);

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/feed/global');
        $this->assertEmpty($response->json('data'));
    }

    #[TestDox('3. Персональна стрічка показує пости друзів та свої')]
    public function test_personal_feed_shows_friends_and_own_posts(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $stranger = User::factory()->create();

        $this->makeFriends($me, $friend);

        $me->posts()->create(['content' => ['text' => 'My Post']]);
        $friend->posts()->create(['content' => ['text' => 'Friend Post']]);
        $stranger->posts()->create(['content' => ['text' => 'Stranger Post']]);

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/feed');

        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data')); // Має бути тільки мій пост і пост друга
    }

    #[TestDox('4. Успішний лайк публічного поста')]
    public function test_can_like_public_post(): void
    {
        $author = User::factory()->create();
        $post = $author->posts()->create(['content' => ['text' => 'Like me']]);
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/v1/posts/{$post->id}/like");

        $response->assertStatus(200)
            ->assertJsonPath('code', 'LIKE_TOGGLED')
            ->assertJsonPath('data.liked', true)
            ->assertJsonPath('data.likes_count', 1);
    }

    #[TestDox('5. Успішне зняття лайка (Toggle)')]
    public function test_can_unlike_post(): void
    {
        $author = User::factory()->create();
        $post = $author->posts()->create(['content' => ['text' => 'Like me']]);
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')->postJson("/api/v1/posts/{$post->id}/like"); // Лайк
        $response = $this->actingAs($user, 'sanctum')->postJson("/api/v1/posts/{$post->id}/like"); // Анлайк

        $response->assertStatus(200)->assertJsonPath('data.liked', false)->assertJsonPath('data.likes_count', 0);
    }

    #[TestDox('6. Неможливо лайкнути пост заблокованого юзера (Policy)')]
    public function test_cannot_like_blocked_user_post(): void
    {
        $me = User::factory()->create();
        $enemy = User::factory()->create();
        $this->blockUser($me, $enemy);
        $post = $enemy->posts()->create(['content' => ['text' => 'Bad']]);

        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/posts/{$post->id}/like");
        $response->assertStatus(403);
    }

    #[TestDox('7. Гість не може лайкати (401)')]
    public function test_guest_cannot_like(): void
    {
        $post = User::factory()->create()->posts()->create(['content' => ['text' => 'Hi']]);
        $this->postJson("/api/v1/posts/{$post->id}/like")->assertStatus(401);
    }

    #[TestDox('8. Отримання коментарів поста')]
    public function test_can_get_comments(): void
    {
        $post = User::factory()->create()->posts()->create(['content' => ['text' => 'Hi']]);
        $post->comments()->create(['user_id' => User::factory()->create()->id, 'content' => $this->validRichText]);

        $response = $this->getJson("/api/v1/posts/{$post->id}/comments");
        $response->assertStatus(200)
            ->assertJsonPath('code', 'COMMENTS_RETRIEVED')
            ->assertJsonPath('data.0.content.type', 'doc');
    }

    #[TestDox('9. Успішне створення коментаря')]
    public function test_can_create_comment(): void
    {
        $post = User::factory()->create()->posts()->create(['content' => ['text' => 'Hi'], 'can_comment' => true]);
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/v1/posts/{$post->id}/comments", [
            'content' => $this->validRichText
        ]);

        $response->assertStatus(201)->assertJsonPath('code', 'COMMENT_CREATED');
        $this->assertDatabaseCount('comments', 1);
    }

    #[TestDox('10. Порожній коментар відхиляється з ApiException (ERR_EMPTY_MESSAGE)')]
    public function test_empty_comment_fails(): void
    {
        $post = User::factory()->create()->posts()->create(['content' => ['text' => 'Hi'], 'can_comment' => true]);
        $user = User::factory()->create();

        // Передаємо валідну ProseMirror структуру, але БЕЗ тексту
        $emptyRichText = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => []]]];

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/v1/posts/{$post->id}/comments", [
            'content' => $emptyRichText
        ]);

        $response->assertStatus(422)->assertJsonPath('code', 'ERR_EMPTY_MESSAGE');
    }

    #[TestDox('11. Власник може оновити свій коментар')]
    public function test_owner_can_update_comment(): void
    {
        $user = User::factory()->create();
        $post = $user->posts()->create(['content' => $this->validRichText2]);
        $comment = $post->comments()->create(['user_id' => $user->id, 'content' => $this->validRichText]);

        $newRichText = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Edited']]]]];

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/v1/comments/{$comment->uid}", [
            'content' => $newRichText
        ]);

        $response->assertStatus(200)->assertJsonPath('code', 'COMMENT_UPDATED');
    }

    #[TestDox('12. Чужий юзер не може оновити коментар (Policy 403)')]
    public function test_stranger_cannot_update_comment(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $post = $owner->posts()->create(['content' => ['text' => 'Hi']]);
        $comment = $post->comments()->create(['user_id' => $owner->id, 'content' => $this->validRichText]);

        $response = $this->actingAs($stranger, 'sanctum')->putJson("/api/v1/comments/{$comment->uid}", [
            'content' => $this->validRichText
        ]);

        $response->assertStatus(403);
    }

    #[TestDox('13. Видалення тексту при редагуванні заборонено (ERR_EMPTY_MESSAGE)')]
    public function test_cannot_make_comment_empty_on_update(): void
    {
        $user = User::factory()->create();
        $post = $user->posts()->create(['content' => ['text' => 'Hi']]);
        $comment = $post->comments()->create(['user_id' => $user->id, 'content' => $this->validRichText]);

        $emptyRichText = ['type' => 'doc', 'content' => []];

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/v1/comments/{$comment->uid}", [
            'content' => $emptyRichText
        ]);

        $response->assertStatus(422)->assertJsonPath('code', 'ERR_EMPTY_MESSAGE');
    }

    #[TestDox('14. Автор коментаря може його видалити')]
    public function test_comment_author_can_delete_it(): void
    {
        $author = User::factory()->create();
        $post = $author->posts()->create(['content' => ['text' => 'Hi']]);
        $comment = $post->comments()->create(['user_id' => $author->id, 'content' => $this->validRichText]);

        $response = $this->actingAs($author, 'sanctum')->deleteJson("/api/v1/comments/{$comment->uid}");
        $response->assertStatus(200)->assertJsonPath('code', 'COMMENT_DELETED');
    }

    #[TestDox('15. Власник поста може видалити чужий коментар під своїм постом')]
    public function test_post_owner_can_delete_any_comment_on_their_post(): void
    {
        $postOwner = User::factory()->create();
        $commenter = User::factory()->create();
        $post = $postOwner->posts()->create(['content' => ['text' => 'Wall']]);
        $comment = $post->comments()->create(['user_id' => $commenter->id, 'content' => $this->validRichText]);

        $response = $this->actingAs($postOwner, 'sanctum')->deleteJson("/api/v1/comments/{$comment->uid}");
        $response->assertStatus(200);
    }

    #[TestDox('16. Рандомний юзер НЕ МОЖЕ видалити чужий коментар')]
    public function test_stranger_cannot_delete_comment(): void
    {
        $postOwner = User::factory()->create();
        $commenter = User::factory()->create();
        $stranger = User::factory()->create();

        $post = $postOwner->posts()->create(['content' => ['text' => 'Wall']]);
        $comment = $post->comments()->create(['user_id' => $commenter->id, 'content' => $this->validRichText]);

        $response = $this->actingAs($stranger, 'sanctum')->deleteJson("/api/v1/comments/{$comment->uid}");
        $response->assertStatus(403);
    }

    #[TestDox('17. Не можна коментувати, якщо can_comment = false')]
    public function test_cannot_comment_if_disabled_on_post(): void
    {
        $post = User::factory()->create()->posts()->create(['content' => ['text' => 'Hi'], 'can_comment' => false]);
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/v1/posts/{$post->id}/comments", ['content' => $this->validRichText]);
        $response->assertStatus(403);
    }

    #[TestDox('18. Не можна коментувати пост юзера, який тебе заблокував')]
    public function test_cannot_comment_if_blocked(): void
    {
        $owner = User::factory()->create();
        $enemy = User::factory()->create();
        $this->blockUser($owner, $enemy); // Owner blocked enemy

        $post = $owner->posts()->create(['content' => ['text' => 'Hi'], 'can_comment' => true]);

        $response = $this->actingAs($enemy, 'sanctum')->postJson("/api/v1/posts/{$post->id}/comments", ['content' => $this->validRichText]);
        $response->assertStatus(403);
    }

    #[TestDox('19. Не можна коментувати, якщо налаштування приватності Nobody')]
    public function test_cannot_comment_if_privacy_is_nobody(): void
    {
        $owner = User::factory()->create(['privacy_settings' => ['comment' => PrivacyLevel::Nobody->value]]);
        $post = $owner->posts()->create(['content' => ['text' => 'Hi'], 'can_comment' => true]);
        $stranger = User::factory()->create();

        $response = $this->actingAs($stranger, 'sanctum')->postJson("/api/v1/posts/{$post->id}/comments", ['content' => $this->validRichText]);
        $response->assertStatus(403);
    }

    #[TestDox('20. Отримання власних коментарів (myComments)')]
    public function test_can_get_my_comments(): void
    {
        $me = User::factory()->create();
        $post = User::factory()->create()->posts()->create(['content' => ['text' => 'Hi']]);
        $post->comments()->create(['user_id' => $me->id, 'content' => $this->validRichText]);

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/activity/comments');
        $response->assertStatus(200);
    }
}