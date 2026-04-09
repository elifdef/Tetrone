<?php

namespace Tests\Feature;

use App\Models\Friendship;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class FriendshipApiTest extends TestCase
{
    use RefreshDatabase;

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

    // ==========================================
    // 🛡 ДОСТУП ТА МІДЛВАРИ
    // ==========================================

    #[TestDox('1. Анонімний юзер отримує 401')]
    public function test_guest_gets_401(): void
    {
        $this->getJson('/api/v1/friends')->assertStatus(401);
    }

    #[TestDox('2. Забанений юзер отримує 403')]
    public function test_banned_user_gets_403(): void
    {
        $user = User::factory()->create(['is_banned' => true]);
        $this->actingAs($user, 'sanctum')->getJson('/api/v1/friends')->assertStatus(403);
    }

    #[TestDox('3. Юзер без підтвердженої пошти отримує 403 при спробі додати друга')]
    public function test_unverified_user_gets_403_on_add(): void
    {
        config(['features.need_confirm_email' => true]);

        $me = User::factory()->unverified()->create();
        $target = User::factory()->create();

        config(['features.need_confirm_email' => false]);

        $this->actingAs($me, 'sanctum')
            ->postJson("/api/v1/friends/add/{$target->username}")
            ->assertStatus(403);
    }

    #[TestDox('4. Успішна відправка заявки в друзі (201)')]
    public function test_can_send_friend_request(): void
    {
        $me = User::factory()->create();
        $target = User::factory()->create();

        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/friends/add/{$target->username}");

        $response->assertStatus(201)->assertJsonPath('code', 'FRIEND_REQUEST_SENT');
        $this->assertDatabaseHas('friendships', ['user_id' => $me->id, 'friend_id' => $target->id, 'status' => Friendship::STATUS_PENDING]);
    }

    #[TestDox('5. Помилка 400 при спробі додати самого себе')]
    public function test_cannot_friend_self(): void
    {
        $me = User::factory()->create();
        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/friends/add/{$me->username}");
        $response->assertStatus(400)->assertJsonPath('code', 'ERR_CANNOT_FRIEND_SELF');
    }

    #[TestDox('6. Помилка 409 при спробі додати, якщо вже друзі')]
    public function test_cannot_send_request_if_already_friends(): void
    {
        $me = User::factory()->create();
        $target = User::factory()->create();
        $this->makeFriends($me, $target);

        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/friends/add/{$target->username}");
        $response->assertStatus(409)->assertJsonPath('code', 'ERR_ALREADY_FRIENDS');
    }

    #[TestDox('7. Помилка 409 при спробі додати, якщо заявка вже висить')]
    public function test_cannot_send_request_if_pending(): void
    {
        $me = User::factory()->create();
        $target = User::factory()->create();
        $this->makePendingRequest($me, $target);

        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/friends/add/{$target->username}");
        $response->assertStatus(409)->assertJsonPath('code', 'ERR_REQUEST_PENDING');
    }

    #[TestDox('8. Помилка 403 при спробі додати юзера, який тебе заблокував')]
    public function test_cannot_add_if_blocked_by_target(): void
    {
        $me = User::factory()->create();
        $target = User::factory()->create();
        $this->blockUser($target, $me); // Він мене заблокував

        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/friends/add/{$target->username}");
        $response->assertStatus(403)->assertJsonPath('code', 'ERR_USER_BLOCKED');
    }

    #[TestDox('9. Помилка 404, якщо юзер не існує')]
    public function test_404_if_user_not_found(): void
    {
        $me = User::factory()->create();
        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/friends/add/ghost_user_123");
        $response->assertStatus(404);
    }

    // ==========================================
    // ✅ ПРИЙНЯТТЯ ТА ВИДАЛЕННЯ
    // ==========================================

    #[TestDox('10. Успішне прийняття заявки (200)')]
    public function test_can_accept_friend_request(): void
    {
        $sender = User::factory()->create();
        $me = User::factory()->create();
        $this->makePendingRequest($sender, $me);

        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/friends/accept/{$sender->username}");

        $response->assertStatus(200)->assertJsonPath('code', 'FRIEND_REQUEST_ACCEPTED');
        $this->assertDatabaseHas('friendships', ['user_id' => $sender->id, 'friend_id' => $me->id, 'status' => Friendship::STATUS_ACCEPTED]);
    }

    #[TestDox('11. Помилка 404 при прийнятті, якщо заявки не існує')]
    public function test_cannot_accept_nonexistent_request(): void
    {
        $sender = User::factory()->create();
        $me = User::factory()->create();

        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/friends/accept/{$sender->username}");
        $response->assertStatus(404)->assertJsonPath('code', 'ERR_NO_PENDING_REQUEST');
    }

    #[TestDox('12. Успішне видалення існуючого друга')]
    public function test_can_remove_friend(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $this->makeFriends($me, $friend);

        $response = $this->actingAs($me, 'sanctum')->deleteJson("/api/v1/friends/{$friend->username}");

        $response->assertStatus(200)->assertJsonPath('code', 'FRIEND_REMOVED');
        $this->assertDatabaseMissing('friendships', ['user_id' => $me->id, 'friend_id' => $friend->id]);
    }

    #[TestDox('13. Успішне скасування вихідної заявки')]
    public function test_can_cancel_sent_request(): void
    {
        $me = User::factory()->create();
        $target = User::factory()->create();
        $this->makePendingRequest($me, $target);

        $response = $this->actingAs($me, 'sanctum')->deleteJson("/api/v1/friends/{$target->username}");

        $response->assertStatus(200)->assertJsonPath('code', 'FRIEND_REMOVED');
        $this->assertDatabaseMissing('friendships', ['user_id' => $me->id, 'friend_id' => $target->id]);
    }

    #[TestDox('14. Успішне відхилення вхідної заявки')]
    public function test_can_reject_incoming_request(): void
    {
        $sender = User::factory()->create();
        $me = User::factory()->create();
        $this->makePendingRequest($sender, $me);

        $response = $this->actingAs($me, 'sanctum')->deleteJson("/api/v1/friends/{$sender->username}");

        $response->assertStatus(200)->assertJsonPath('code', 'FRIEND_REMOVED');
    }

    // ==========================================
    // 🚫 БЛОКУВАННЯ / ЧОРНИЙ СПИСОК
    // ==========================================

    #[TestDox('15. Успішне блокування користувача')]
    public function test_can_block_user(): void
    {
        $me = User::factory()->create();
        $target = User::factory()->create();

        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/friends/block/{$target->username}");

        $response->assertStatus(200)->assertJsonPath('code', 'USER_BLOCKED');
        $this->assertDatabaseHas('friendships', ['user_id' => $me->id, 'friend_id' => $target->id, 'status' => Friendship::STATUS_BLOCKED]);
    }

    #[TestDox('16. Блокування друга автоматично видаляє його з друзів')]
    public function test_blocking_removes_friendship(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $this->makeFriends($me, $friend);

        $this->actingAs($me, 'sanctum')->postJson("/api/v1/friends/block/{$friend->username}");

        $this->assertDatabaseMissing('friendships', ['user_id' => $me->id, 'friend_id' => $friend->id, 'status' => Friendship::STATUS_ACCEPTED]);
        $this->assertDatabaseHas('friendships', ['user_id' => $me->id, 'friend_id' => $friend->id, 'status' => Friendship::STATUS_BLOCKED]);
    }

    #[TestDox('17. Помилка 400 при спробі заблокувати самого себе')]
    public function test_cannot_block_self(): void
    {
        $me = User::factory()->create();
        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/friends/block/{$me->username}");
        $response->assertStatus(400)->assertJsonPath('code', 'ERR_CANNOT_BLOCK_SELF');
    }

    #[TestDox('18. Успішне розблокування користувача')]
    public function test_can_unblock_user(): void
    {
        $me = User::factory()->create();
        $target = User::factory()->create();
        $this->blockUser($me, $target);

        $response = $this->actingAs($me, 'sanctum')->deleteJson("/api/v1/friends/blocked/{$target->username}");

        $response->assertStatus(200)->assertJsonPath('code', 'USER_UNBLOCKED');
        $this->assertDatabaseMissing('friendships', ['user_id' => $me->id, 'friend_id' => $target->id]);
    }

    #[TestDox('19. Помилка 404 при розблокуванні юзера, якого немає в ЧС')]
    public function test_unblock_fails_if_not_blocked(): void
    {
        $me = User::factory()->create();
        $target = User::factory()->create();

        $response = $this->actingAs($me, 'sanctum')->deleteJson("/api/v1/friends/blocked/{$target->username}");
        $response->assertStatus(404)->assertJsonPath('code', 'ERR_NOT_IN_BLACKLIST');
    }

    // ==========================================
    // 📋 СПИСКИ
    // ==========================================

    #[TestDox('20. Отримання списку друзів (повертає тільки підтверджених)')]
    public function test_can_get_friends_list(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $stranger = User::factory()->create();

        $this->makeFriends($me, $friend);
        $this->makePendingRequest($me, $stranger); // Заявка, а не друг

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/friends');
        $response->assertStatus(200)->assertJsonPath('code', 'FRIENDS_RETRIEVED');

        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($friend->username, $response->json('data.0.username'));
    }

    #[TestDox('21. Отримання вхідних заявок (requests)')]
    public function test_can_get_incoming_requests(): void
    {
        $me = User::factory()->create();
        $sender = User::factory()->create();
        $this->makePendingRequest($sender, $me);

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/friends/requests');
        $response->assertStatus(200)->assertJsonPath('code', 'INCOMING_REQUESTS_RETRIEVED');
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($sender->username, $response->json('data.0.username'));
    }

    #[TestDox('22. Отримання вихідних заявок (sent)')]
    public function test_can_get_sent_requests(): void
    {
        $me = User::factory()->create();
        $receiver = User::factory()->create();
        $this->makePendingRequest($me, $receiver);

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/friends/sent');
        $response->assertStatus(200)->assertJsonPath('code', 'SENT_REQUESTS_RETRIEVED');
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($receiver->username, $response->json('data.0.username'));
    }

    #[TestDox('23. Отримання чорного списку (blocked)')]
    public function test_can_get_blocked_users(): void
    {
        $me = User::factory()->create();
        $enemy = User::factory()->create();
        $this->blockUser($me, $enemy);

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/friends/blocked');
        $response->assertStatus(200)->assertJsonPath('code', 'BLOCKED_USERS_RETRIEVED');
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($enemy->username, $response->json('data.0.username'));
    }
}