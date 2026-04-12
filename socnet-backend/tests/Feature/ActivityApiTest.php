<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use App\Models\PollVote;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class ActivityApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Провайдер усіх ендпоінтів активності для перевірки доступу
     */
    public static function activityEndpointsProvider(): array
    {
        return [
            ['/api/v1/activity/liked'],
            ['/api/v1/activity/reposts'],
            ['/api/v1/activity/comments'],
            ['/api/v1/activity/voted-polls'],
            ['/api/v1/activity/counts'],
        ];
    }

    #[TestDox('1. Анонімний юзер отримує 401 на всіх ендпоінтах активності')]
    #[DataProvider('activityEndpointsProvider')]
    public function test_guest_gets_401_on_all_activity_endpoints(string $endpoint): void
    {
        $this->getJson($endpoint)->assertStatus(401);
    }

    #[TestDox('2. Забанений юзер отримує 403 на всіх ендпоінтах активності')]
    #[DataProvider('activityEndpointsProvider')]
    public function test_banned_user_gets_403_on_all_activity_endpoints(string $endpoint): void
    {
        $user = User::factory()->create(['is_banned' => true]);
        $this->actingAs($user, 'sanctum')->getJson($endpoint)->assertStatus(403);
    }

    #[TestDox('3. Отримання лайкнутих постів (правильний контракт, пагінація)')]
    public function test_user_gets_liked_posts_with_correct_contract(): void
    {
        $me = User::factory()->create();
        $author = User::factory()->create();

        $post = $author->posts()->create(['content' => ['text' => 'Cool Post']]);

        $post->likes()->create(['user_id' => $me->id]);

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/activity/liked');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));

        $this->assertEquals($post->id, $response->json('data.0.id'));
    }

    #[TestDox('4. Отримання власних репостів (з перевіркою контракту та зв\'язків)')]
    public function test_user_gets_only_own_reposts_with_original_post_data(): void
    {
        $me = User::factory()->create();
        $author = User::factory()->create();

        $originalPost = $author->posts()->create(['content' => ['text' => 'Original Text']]);

        $myRepost = $me->posts()->create([
            'original_post_id' => $originalPost->id,
            'is_repost' => true
        ]);

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/activity/reposts');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'is_repost',
                        'original_post' => ['id', 'content', 'user']
                    ]
                ]
            ]);

        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($myRepost->id, $response->json('data.0.id'));
        $this->assertEquals($originalPost->id, $response->json('data.0.original_post.id'));
    }

    #[TestDox('5. Отримання власних коментарів (з прив\'язкою до поста)')]
    public function test_user_gets_only_own_comments_with_post_snippet(): void
    {
        $me = User::factory()->create();
        $post = User::factory()->create()->posts()->create(['content' => ['text' => 'Post Text']]);

        $myComment = $post->comments()->create([
            'user_id' => $me->id,
            'content' => ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'My comment']]]]]
        ]);

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/activity/comments');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'uid',
                        'post_id',
                        'content',
                        'post' => ['id', 'user']
                    ]
                ]
            ]);

        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($myComment->uid, $response->json('data.0.uid'));
    }

    #[TestDox('6. Отримання опитувань, де голосував юзер')]
    public function test_user_gets_voted_polls_with_contract(): void
    {
        $me = User::factory()->create();
        $author = User::factory()->create();

        $post = $author->posts()->create(['content' => ['poll' => ['options' => [['id' => 1, 'text' => 'A']]]]]);
        PollVote::create(['user_id' => $me->id, 'post_id' => $post->id, 'option_id' => 1]);

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/activity/voted-polls');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'content']
                ]
            ]);

        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($post->id, $response->json('data.0.id'));
    }

    #[TestDox('7. Лічильники активності працюють коректно для всіх типів')]
    public function test_get_activity_counts_is_accurate(): void
    {
        $me = User::factory()->create();

        $targetPost = User::factory()->create()->posts()->create(['content' => ['poll' => ['options' => [['id' => 1]]]]]);

        $targetPost->likes()->create(['user_id' => $me->id]);

        $me->posts()->create(['original_post_id' => $targetPost->id, 'is_repost' => true]);
        $me->posts()->create(['original_post_id' => $targetPost->id, 'is_repost' => true]);

        $targetPost->comments()->create(['user_id' => $me->id, 'content' => ['text' => 'Comm']]);

        PollVote::create(['user_id' => $me->id, 'post_id' => $targetPost->id, 'option_id' => 1]);

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/activity/counts');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['likes', 'comments', 'reposts', 'voted_polls']
            ]);

        $this->assertEquals(1, $response->json('data.likes'));
        $this->assertEquals(1, $response->json('data.comments'));
        $this->assertEquals(2, $response->json('data.reposts'));
        $this->assertEquals(1, $response->json('data.voted_polls'));
    }
}