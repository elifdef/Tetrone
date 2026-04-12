<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\NewFriendRequestNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class NotificationApiTest extends TestCase
{
    use RefreshDatabase;

    public static function protectedRoutesProvider(): array
    {
        return [
            ['GET', '/api/v1/notifications'],
            ['POST', '/api/v1/notifications/1/read'],
        ];
    }

    #[TestDox('1. Анонімний юзер отримує 401 на ендпоінти сповіщень')]
    #[DataProvider('protectedRoutesProvider')]
    public function test_guest_gets_401(string $method, string $uri): void
    {
        $this->json($method, $uri)->assertStatus(401);
    }

    #[TestDox('2. Забанений юзер отримує 403 на ендпоінти сповіщень')]
    #[DataProvider('protectedRoutesProvider')]
    public function test_banned_user_gets_403(string $method, string $uri): void
    {
        $user = User::factory()->create(['is_banned' => true]);
        $this->actingAs($user, 'sanctum')->json($method, $uri)->assertStatus(403);
    }

    #[TestDox('3. Отримання списку сповіщень має строгий JSON контракт (з пагінацією/структурою)')]
    public function test_can_get_notifications_with_strict_contract(): void
    {
        $user = User::factory()->create();
        $sender = User::factory()->create();

        $user->notify(new NewFriendRequestNotification($sender));

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/notifications');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'notifications' => [
                    '*' => [
                        'id',
                        'type',
                        'read_at',
                        'created_at',
                        'data' => [
                            'user' => ['id', 'username', 'avatar']
                        ]
                    ]
                ],
                'unread_count'
            ]);

        $this->assertEquals(1, $response->json('unread_count'));
        $this->assertEquals($sender->id, $response->json('notifications.0.data.user.id'));
    }

    #[TestDox('4. Позначення як прочитаного ФІЗИЧНО оновлює БД')]
    public function test_can_mark_notification_as_read_updates_db(): void
    {
        $user = User::factory()->create();
        $sender = User::factory()->create();
        $user->notify(new NewFriendRequestNotification($sender));

        $notification = $user->notifications()->first();
        $this->assertNull($notification->read_at);
        $response = $this->actingAs($user, 'sanctum')->postJson("/api/v1/notifications/{$notification->id}/read");

        $response->assertStatus(200);

        $this->assertNotNull($notification->refresh()->read_at);
        $this->assertEquals(0, $user->unreadNotifications()->count());
    }

    #[TestDox('5. Чужий юзер отримує 404, а сповіщення ЗАЛИШАЄТЬСЯ НЕПРОЧИТАНИМ')]
    public function test_cannot_mark_others_notification_as_read_and_db_is_untouched(): void
    {
        $me = User::factory()->create();
        $stranger = User::factory()->create();

        $stranger->notify(new NewFriendRequestNotification($me));
        $notification = $stranger->notifications()->first();

        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/notifications/{$notification->id}/read");

        $response->assertStatus(404);

        $this->assertNull($notification->refresh()->read_at);
    }
}