<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\NewFriendRequestNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class NotificationApiTest extends TestCase
{
    use RefreshDatabase;

    #[TestDox('1. Отримання списку сповіщень та підтягування об\'єкта користувача')]
    public function test_can_get_notifications(): void
    {
        $user = User::factory()->create();
        $sender = User::factory()->create();

        // Реально відправляємо сповіщення через базу даних
        $user->notify(new NewFriendRequestNotification($sender));

        // Виконуємо запит до твого роуту
        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/notifications');

        $response->assertStatus(200);

        // Перевіряємо структуру
        $this->assertCount(1, $response->json('notifications'));
        $this->assertEquals(1, $response->json('unread_count'));

        // Перевіряємо магію з твого роуту: чи підтягнувся об'єкт 'user'
        $this->assertEquals($sender->id, $response->json('notifications.0.data.user.id'));
        $this->assertEquals($sender->username, $response->json('notifications.0.data.user.username'));
    }

    #[TestDox('2. Успішне позначення сповіщення як прочитаного')]
    public function test_can_mark_notification_as_read(): void
    {
        $user = User::factory()->create();
        $sender = User::factory()->create();

        $user->notify(new NewFriendRequestNotification($sender));

        // Переконуємося, що є 1 непрочитане
        $this->assertEquals(1, $user->unreadNotifications()->count());
        $notificationId = $user->notifications()->first()->id;

        // Робимо POST запит на прочитання
        $response = $this->actingAs($user, 'sanctum')->postJson("/api/v1/notifications/{$notificationId}/read");

        $response->assertStatus(200)->assertJsonPath('status', true);

        // Перевіряємо, що лічильник обнулився
        $this->assertEquals(0, $user->unreadNotifications()->count());
    }

    #[TestDox('3. Помилка 404 при спробі прочитати чуже сповіщення')]
    public function test_cannot_mark_others_notification_as_read(): void
    {
        $me = User::factory()->create();
        $stranger = User::factory()->create();

        // Відправляємо сповіщення "чужому"
        $stranger->notify(new NewFriendRequestNotification($me));
        $notificationId = $stranger->notifications()->first()->id;

        // Я намагаюся прочитати його сповіщення
        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/notifications/{$notificationId}/read");

        $response->assertStatus(404);
    }
}