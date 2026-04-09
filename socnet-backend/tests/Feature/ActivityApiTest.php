<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use App\Models\PollVote;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class ActivityApiTest extends TestCase
{
    use RefreshDatabase;

    #[TestDox('1. Анонімний юзер отримує 401')]
    public function test_guest_gets_401(): void
    {
        $this->getJson('/api/v1/activity/liked')->assertStatus(401);
    }

    #[TestDox('2. Забанений юзер отримує 403')]
    public function test_banned_user_gets_403(): void
    {
        $user = User::factory()->create(['is_banned' => true]);
        $this->actingAs($user, 'sanctum')->getJson('/api/v1/activity/liked')->assertStatus(403);
    }

    #[TestDox('3. Отримання лайкнутих постів (тільки своїх)')]
    public function test_user_gets_only_own_liked_posts(): void
    {
        $me = User::factory()->create();
        $otherUser = User::factory()->create();

        $myLikedPost = $me->posts()->create(['content' => ['text' => 'P1']]);
        $otherLikedPost = $otherUser->posts()->create(['content' => ['text' => 'P2']]);

        $myLikedPost->likes()->create(['user_id' => $me->id]);
        $otherLikedPost->likes()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/activity/liked');

        $response->assertStatus(200)->assertJsonPath('code', 'LIKED_POSTS_RETRIEVED');
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($myLikedPost->id, $response->json('data.0.id'));
    }

    #[TestDox('4. Отримання власних репостів (чужих не видно)')]
    public function test_user_gets_only_own_reposts(): void
    {
        $me = User::factory()->create();
        $otherUser = User::factory()->create();

        $originalPost = $me->posts()->create(['content' => ['text' => 'Orig']]);

        $me->posts()->create(['original_post_id' => $originalPost->id, 'is_repost' => true]);
        $otherUser->posts()->create(['original_post_id' => $originalPost->id, 'is_repost' => true]);

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/activity/reposts');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }

    #[TestDox('5. Отримання власних коментарів')]
    public function test_user_gets_only_own_comments(): void
    {
        $me = User::factory()->create();
        $otherUser = User::factory()->create();
        $post = $me->posts()->create(['content' => ['text' => 'P1']]);

        $post->comments()->create(['user_id' => $me->id, 'content' => ['type' => 'doc', 'content' => []]]);
        $post->comments()->create(['user_id' => $otherUser->id, 'content' => ['type' => 'doc', 'content' => []]]);

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/activity/comments');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }

    #[TestDox('6. Отримання опитувань, де голосував юзер')]
    public function test_user_gets_voted_polls(): void
    {
        $me = User::factory()->create();
        $post = $me->posts()->create(['content' => ['poll' => ['options' => [['id' => 1]]]]]);

        PollVote::create(['user_id' => $me->id, 'post_id' => $post->id, 'option_id' => 1]);

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/activity/voted-polls');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }

    #[TestDox('7. Лічильники активності працюють коректно')]
    public function test_get_activity_counts(): void
    {
        $me = User::factory()->create();
        $post = $me->posts()->create(['content' => ['text' => 'P1']]);

        $post->likes()->create(['user_id' => $me->id]);
        $me->posts()->create(['original_post_id' => $post->id, 'is_repost' => true]);

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/activity/counts');

        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('data.likes'));
        $this->assertEquals(1, $response->json('data.reposts'));
        $this->assertEquals(0, $response->json('data.comments'));
    }
}