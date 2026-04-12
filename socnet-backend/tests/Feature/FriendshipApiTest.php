<?php

namespace Tests\Feature;

use App\Models\Friendship;
use App\Models\User;
use App\Notifications\NewFriendRequestNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class FriendshipApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
    }

    private function makePendingRequest(User $sender, User $receiver): void
    {
        Friendship::create(['user_id' => $sender->id, 'friend_id' => $receiver->id, 'status' => Friendship::STATUS_PENDING]);
    }

    private function makeFriends(User $u1, User $u2): void
    {
        Friendship::create(['user_id' => $u1->id, 'friend_id' => $u2->id, 'status' => Friendship::STATUS_ACCEPTED]);
    }

    private function blockUser(User $blocker, User $blocked): void
    {
        Friendship::create(['user_id' => $blocker->id, 'friend_id' => $blocked->id, 'status' => Friendship::STATUS_BLOCKED]);
    }

    public static function protectedRoutesProvider(): array
    {
        return [
            ['GET', '/api/v1/friends'],
            ['GET', '/api/v1/friends/requests'],
            ['GET', '/api/v1/friends/sent'],
            ['GET', '/api/v1/friends/blocked'],
            ['POST', '/api/v1/friends/add/someuser'],
            ['POST', '/api/v1/friends/accept/someuser'],
            ['POST', '/api/v1/friends/block/someuser'],
            ['DELETE', '/api/v1/friends/someuser'],
            ['DELETE', '/api/v1/friends/blocked/someuser'],
        ];
    }

    #[TestDox('1. Анонімний юзер отримує 401 на ВСІХ ендпоінтах друзів')]
    #[DataProvider('protectedRoutesProvider')]
    public function test_guest_gets_401_on_all_routes(string $method, string $uri): void
    {
        $target = User::factory()->create();
        $realUri = str_replace('someuser', $target->username, $uri);

        $this->json($method, $realUri)->assertStatus(401);
    }

    #[TestDox('2. Забанений юзер отримує 403 на ВСІХ ендпоінтах друзів')]
    #[DataProvider('protectedRoutesProvider')]
    public function test_banned_user_gets_403_on_all_routes(string $method, string $uri): void
    {
        $bannedUser = User::factory()->create(['is_banned' => true]);

        $target = User::factory()->create();
        $realUri = str_replace('someuser', $target->username, $uri);

        $this->actingAs($bannedUser, 'sanctum')->json($method, $realUri)->assertStatus(403);
    }

    #[TestDox('3. Успішна відправка заявки: створює запис у БД і ВІДПРАВЛЯЄ НОТИФІКАЦІЮ')]
    public function test_can_send_friend_request_and_notification_is_sent(): void
    {
        $me = User::factory()->create();
        $target = User::factory()->create();

        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/friends/add/{$target->username}");

        $response->assertStatus(201)->assertJsonPath('code', 'FRIEND_REQUEST_SENT');

        $this->assertDatabaseHas('friendships', [
            'user_id' => $me->id,
            'friend_id' => $target->id,
            'status' => Friendship::STATUS_PENDING
        ]);

        Notification::assertSentTo($target, NewFriendRequestNotification::class);
    }

    #[TestDox('4. Помилка 409 при спробі додати, якщо ВІН ВЖЕ КИНУВ ЗАЯВКУ МЕНІ')]
    public function test_cannot_add_if_target_already_sent_request(): void
    {
        $me = User::factory()->create();
        $target = User::factory()->create();
        $this->makePendingRequest($target, $me);

        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/friends/add/{$target->username}");

        $response->assertStatus(409);
    }

    #[TestDox('5. Security Bypass: Неможливо додати юзера, який тебе заблокував')]
    public function test_cannot_add_if_blocked_by_target(): void
    {
        $me = User::factory()->create();
        $target = User::factory()->create();
        $this->blockUser($target, $me);

        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/friends/add/{$target->username}");
        $response->assertStatus(403)->assertJsonPath('code', 'ERR_USER_BLOCKED');

        $this->assertDatabaseMissing('friendships', [
            'user_id' => $me->id,
            'status' => Friendship::STATUS_PENDING
        ]);
    }

    #[TestDox('6. Успішне прийняття заявки (БД оновлюється коректно)')]
    public function test_can_accept_friend_request(): void
    {
        $sender = User::factory()->create();
        $me = User::factory()->create();
        $this->makePendingRequest($sender, $me);

        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/friends/accept/{$sender->username}");

        $response->assertStatus(200)->assertJsonPath('code', 'FRIEND_REQUEST_ACCEPTED');
        $this->assertDatabaseHas('friendships', [
            'user_id' => $sender->id,
            'friend_id' => $me->id,
            'status' => Friendship::STATUS_ACCEPTED
        ]);
    }

    #[TestDox('7. Видалення друга фізично чистить БД')]
    public function test_can_remove_friend(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $this->makeFriends($me, $friend);

        $response = $this->actingAs($me, 'sanctum')->deleteJson("/api/v1/friends/{$friend->username}");

        $response->assertStatus(200)->assertJsonPath('code', 'FRIEND_REMOVED');

        $this->assertDatabaseMissing('friendships', ['user_id' => $me->id, 'friend_id' => $friend->id]);
        $this->assertDatabaseMissing('friendships', ['user_id' => $friend->id, 'friend_id' => $me->id]);
    }

    #[TestDox('8. Блокування перезаписує статус PENDING або ACCEPTED на BLOCKED')]
    public function test_blocking_overwrites_existing_friendship_status(): void
    {
        $me = User::factory()->create();
        $enemy = User::factory()->create();

        $this->makePendingRequest($enemy, $me);

        $this->actingAs($me, 'sanctum')->postJson("/api/v1/friends/block/{$enemy->username}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('friendships', [
            'user_id' => $enemy->id,
            'friend_id' => $me->id,
            'status' => Friendship::STATUS_PENDING
        ]);

        $this->assertDatabaseHas('friendships', [
            'user_id' => $me->id,
            'friend_id' => $enemy->id,
            'status' => Friendship::STATUS_BLOCKED
        ]);
    }

    #[TestDox('9. Списки повертають правильний JSON контракт з ПАГІНАЦІЄЮ')]
    public function test_lists_return_strict_json_contract(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $this->makeFriends($me, $friend);

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/friends');

        $response->assertStatus(200)
            ->assertJsonPath('code', 'FRIENDS_RETRIEVED')
            ->assertJsonStructure([
                'success',
                'code',
                'data' => [
                    '*' => [
                        'id', 'username', 'first_name', 'last_name', 'avatar', 'is_online'
                    ]
                ],
                'links',
                'meta' => ['current_page', 'last_page', 'total']
            ]);

        $this->assertCount(1, $response->json('data'));
    }
}