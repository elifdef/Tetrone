<?php

namespace Tests\Feature;

use App\Enums\PrivacyLevel;
use App\Models\Comment;
use App\Models\Friendship;
use App\Models\Post;
use App\Models\User;
use App\Notifications\NewCommentNotification;
use App\Notifications\NewLikeNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class InteractionApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
    }

    /**
     * Хелпер для генерації валідного ProseMirror JSON.
     */
    private function generateRichText(string $text = 'Default Text'): array
    {
        return [
            'type' => 'doc',
            'content' => [
                [
                    'type' => 'paragraph',
                    'content' => [['type' => 'text', 'text' => $text]]
                ]
            ]
        ];
    }

    private function makeFriends(User $user1, User $user2): void
    {
        Friendship::create(['user_id' => $user1->id, 'friend_id' => $user2->id, 'status' => Friendship::STATUS_ACCEPTED]);
    }

    private function blockUser(User $blocker, User $blocked): void
    {
        Friendship::create(['user_id' => $blocker->id, 'friend_id' => $blocked->id, 'status' => Friendship::STATUS_BLOCKED]);
    }

    #[TestDox('1. Глобальна стрічка закрита для гостей (401)')]
    public function test_global_feed_is_private_for_guests(): void
    {
        $user = User::factory()->create();
        $user->posts()->create(['content' => ['text' => 'Public Post']]);

        $response = $this->getJson('/api/v1/feed/global');

        $response->assertStatus(401);
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

    #[TestDox('3. Персональна стрічка показує тільки пости друзів та свої')]
    public function test_personal_feed_shows_friends_and_own_posts(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $stranger = User::factory()->create();

        $this->makeFriends($me, $friend);

        $myPost = $me->posts()->create(['content' => ['text' => 'My Post']]);
        $friendPost = $friend->posts()->create(['content' => ['text' => 'Friend Post']]);
        $stranger->posts()->create(['content' => ['text' => 'Stranger Post']]);

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/feed');

        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data'));

        $returnedIds = collect($response->json('data'))->pluck('id')->toArray();
        $this->assertContains($myPost->id, $returnedIds);
        $this->assertContains($friendPost->id, $returnedIds);
    }

    #[TestDox('4. Успішний лайк пише в БД та ВІДПРАВЛЯЄ СПОВІЩЕННЯ автору')]
    public function test_can_like_public_post_and_notification_is_sent(): void
    {
        $author = User::factory()->create();
        $post = $author->posts()->create(['content' => ['text' => 'Like me']]);
        $liker = User::factory()->create();

        $response = $this->actingAs($liker, 'sanctum')->postJson("/api/v1/posts/{$post->id}/like");

        $response->assertStatus(200)->assertJsonPath('data.liked', true);

        $this->assertDatabaseHas('likes', [
            'user_id' => $liker->id,
            'post_id' => $post->id
        ]);

        Notification::assertSentTo($author, NewLikeNotification::class);
    }

    #[TestDox('5. Зняття лайка фізично видаляє його з БД')]
    public function test_can_unlike_post_removes_from_db(): void
    {
        $post = User::factory()->create()->posts()->create(['content' => ['text' => 'Like me']]);
        $user = User::factory()->create();

        $post->likes()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/v1/posts/{$post->id}/like");

        $response->assertStatus(200)->assertJsonPath('data.liked', false);

        $this->assertDatabaseMissing('likes', ['user_id' => $user->id, 'post_id' => $post->id]);
    }

    #[TestDox('6. Неможливо лайкнути пост заблокованого юзера')]
    public function test_cannot_like_blocked_user_post(): void
    {
        $me = User::factory()->create();
        $enemy = User::factory()->create();
        $this->blockUser($me, $enemy);
        $post = $enemy->posts()->create(['content' => ['text' => 'Bad']]);

        $this->actingAs($me, 'sanctum')->postJson("/api/v1/posts/{$post->id}/like")->assertStatus(403);
    }

    #[TestDox('7. Створення коментаря пише в БД і ВІДПРАВЛЯЄ СПОВІЩЕННЯ')]
    public function test_can_create_comment_and_notification_is_sent(): void
    {
        $author = User::factory()->create();
        $post = $author->posts()->create(['content' => ['text' => 'Hi'], 'can_comment' => true]);
        $commenter = User::factory()->create();

        $response = $this->actingAs($commenter, 'sanctum')->postJson("/api/v1/posts/{$post->id}/comments", [
            'content' => $this->generateRichText('Awesome post!')
        ]);

        $response->assertStatus(201)->assertJsonPath('code', 'COMMENT_CREATED');

        $this->assertDatabaseHas('comments', [
            'user_id' => $commenter->id,
            'post_id' => $post->id
        ]);

        Notification::assertSentTo($author, NewCommentNotification::class);
    }

    #[TestDox('8. Власник може оновити коментар (БД реально оновлюється)')]
    public function test_owner_can_update_comment_in_db(): void
    {
        $user = User::factory()->create();
        $post = $user->posts()->create(['content' => ['text' => 'Post']]);
        $comment = $post->comments()->create(['user_id' => $user->id, 'content' => $this->generateRichText('Old')]);

        $this->actingAs($user, 'sanctum')->putJson("/api/v1/comments/{$comment->uid}", [
            'content' => $this->generateRichText('Edited')
        ])->assertStatus(200);

        $dbComment = Comment::find($comment->id);
        $this->assertEquals('Edited', $dbComment->content['content'][0]['content'][0]['text']);
    }

    #[TestDox('9. Чужий юзер не може оновити коментар і БАЗА НЕ ЗМІНЮЄТЬСЯ')]
    public function test_stranger_cannot_update_comment_and_db_is_untouched(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $post = $owner->posts()->create(['content' => ['text' => 'Post']]);
        $comment = $post->comments()->create(['user_id' => $owner->id, 'content' => $this->generateRichText('Safe')]);

        $this->actingAs($stranger, 'sanctum')->putJson("/api/v1/comments/{$comment->uid}", [
            'content' => $this->generateRichText('Hacked')
        ])->assertStatus(403);

        $this->assertEquals('Safe', $comment->refresh()->content['content'][0]['content'][0]['text']);
    }

    #[TestDox('10. Автор коментаря може його фізично видалити')]
    public function test_comment_author_can_delete_it_from_db(): void
    {
        $author = User::factory()->create();
        $post = $author->posts()->create(['content' => ['text' => 'Post']]);
        $comment = $post->comments()->create(['user_id' => $author->id, 'content' => $this->generateRichText()]);

        $this->actingAs($author, 'sanctum')->deleteJson("/api/v1/comments/{$comment->uid}")->assertStatus(200);

        $this->assertDatabaseMissing('comments', ['id' => $comment->id]);
    }

    #[TestDox('11. Власник поста може видалити чужий коментар під своїм постом')]
    public function test_post_owner_can_delete_any_comment_on_their_post(): void
    {
        $postOwner = User::factory()->create();
        $commenter = User::factory()->create();
        $post = $postOwner->posts()->create(['content' => ['text' => 'Wall']]);
        $comment = $post->comments()->create(['user_id' => $commenter->id, 'content' => $this->generateRichText()]);

        $this->actingAs($postOwner, 'sanctum')->deleteJson("/api/v1/comments/{$comment->uid}")->assertStatus(200);
        $this->assertDatabaseMissing('comments', ['id' => $comment->id]);
    }

    #[TestDox('12. Рандомний юзер отримує 403 при видаленні і КОМЕНТАР ЗАЛИШАЄТЬСЯ')]
    public function test_stranger_cannot_delete_comment_and_it_survives(): void
    {
        $postOwner = User::factory()->create();
        $commenter = User::factory()->create();
        $stranger = User::factory()->create();

        $post = $postOwner->posts()->create(['content' => ['text' => 'Wall']]);
        $comment = $post->comments()->create(['user_id' => $commenter->id, 'content' => $this->generateRichText()]);

        $this->actingAs($stranger, 'sanctum')->deleteJson("/api/v1/comments/{$comment->uid}")->assertStatus(403);

        $this->assertDatabaseHas('comments', ['id' => $comment->id]);
    }

    #[TestDox('13. Не можна коментувати, якщо can_comment = false')]
    public function test_cannot_comment_if_disabled_on_post(): void
    {
        $post = User::factory()->create()->posts()->create(['content' => ['text' => 'Hi'], 'can_comment' => false]);
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')->postJson("/api/v1/posts/{$post->id}/comments", ['content' => $this->generateRichText()])
            ->assertStatus(403);
    }

    #[TestDox('14. Не можна коментувати, якщо налаштування приватності Nobody')]
    public function test_cannot_comment_if_privacy_is_nobody(): void
    {
        $owner = User::factory()->create(['privacy_settings' => ['comment' => PrivacyLevel::Nobody->value]]);
        $post = $owner->posts()->create(['content' => ['text' => 'Hi'], 'can_comment' => true]);
        $stranger = User::factory()->create();

        $this->actingAs($stranger, 'sanctum')->postJson("/api/v1/posts/{$post->id}/comments", ['content' => $this->generateRichText()])
            ->assertStatus(403);
    }

    #[TestDox('15. Порожній коментар відхиляється (ERR_EMPTY_MESSAGE)')]
    public function test_empty_comment_fails(): void
    {
        $post = User::factory()->create()->posts()->create(['content' => ['text' => 'Hi'], 'can_comment' => true]);
        $user = User::factory()->create();

        $emptyRichText = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => []]]];

        $this->actingAs($user, 'sanctum')->postJson("/api/v1/posts/{$post->id}/comments", ['content' => $emptyRichText])
            ->assertStatus(422)->assertJsonPath('code', 'ERR_EMPTY_MESSAGE');
    }
}