<?php

namespace Tests\Feature;

use App\Events\UserBlockedEvent;
use App\Models\Post;
use App\Models\User;
use App\Notifications\NewFriendRequestNotification;
use App\Notifications\NewLikeNotification;
use App\Notifications\NewWallPostNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class NotificationAndEventTest extends TestCase
{
    use RefreshDatabase;

    // ==========================================
    // 📢 ТЕСТУВАННЯ ІВЕНТІВ (EVENTS)
    // ==========================================

    #[TestDox('1. UserBlockedEvent успішно відправляється в правильний приватний канал')]
    public function test_user_blocked_event_is_dispatched(): void
    {
        Event::fake([UserBlockedEvent::class]);

        $me = User::factory()->create();
        $target = User::factory()->create();

        $this->actingAs($me, 'sanctum')->postJson("/api/v1/friends/block/{$target->username}");

        Event::assertDispatched(UserBlockedEvent::class, function (UserBlockedEvent $event) use ($me, $target)
        {
            $correctBlocker = $event->blocker_id === $me->id;
            $correctChannel = $event->broadcastOn()->name === 'private-App.Models.User.' . $target->id;

            return $correctBlocker && $correctChannel;
        });
    }

    // ==========================================
    // 🔔 ТЕСТУВАННЯ ВІДПРАВКИ СПОВІЩЕНЬ
    // ==========================================

    #[TestDox('2. Сповіщення про заявку в друзі реально відправляється цільовому юзеру')]
    public function test_friend_request_notification_is_sent(): void
    {
        Notification::fake();

        $me = User::factory()->create();
        $target = User::factory()->create();

        $this->actingAs($me, 'sanctum')->postJson("/api/v1/friends/add/{$target->username}");

        Notification::assertSentTo(
            $target,
            NewFriendRequestNotification::class,
            function (NewFriendRequestNotification $notification) use ($me)
            {
                return $notification->requester->id === $me->id;
            }
        );

        Notification::assertNotSentTo([$me], NewFriendRequestNotification::class);
    }

    // ==========================================
    // 🛠 ТЕСТУВАННЯ ВНУТРІШНЬОЇ ЛОГІКИ (Щоб не було 500 помилок)
    // ==========================================

    #[TestDox('3. Форматування NewFriendRequestNotification не крашиться і враховує налаштування')]
    public function test_friend_request_notification_format(): void
    {
        $requester = User::factory()->create();
        $notifiable = User::factory()->create();

        // ОНОВЛЮЄМО існуючі налаштування (які створились автоматично), замість create
        $notifiable->notificationSettings()->update([
            'notify_friend_requests' => false,
        ]);
        $notifiable->refresh();

        $notification = new NewFriendRequestNotification($requester);

        $databaseArray = $notification->toArray($notifiable);
        $this->assertEquals('new_friend_request', $databaseArray['type']);
        $this->assertEquals($requester->id, $databaseArray['user_id']);

        $broadcastMessage = $notification->toBroadcast($notifiable);
        $broadcastData = $broadcastMessage->data;

        $this->assertFalse($broadcastData['show_toast']);
        $this->assertEquals('none', $broadcastData['sound']);
    }

    #[TestDox('4. NewLikeNotification правильно обробляє JSON контент поста (без помилок масивів)')]
    public function test_like_notification_handles_json_content(): void
    {
        $liker = User::factory()->create();
        $notifiable = User::factory()->create();

        // Створюємо віртуальний пост без звернення до БД
        $post = new Post();
        $post->id = 999;
        $post->content = ['text' => 'Дуже довгий текст який має бути обрізаний функцією Str::limit і ми це зараз перевіримо'];

        $notification = new NewLikeNotification($liker, $post);
        $array = $notification->toArray($notifiable);

        $this->assertEquals('new_like', $array['type']);
        $this->assertNotNull($array['post_snippet']);
        $this->assertTrue(strlen($array['post_snippet']) <= 43); // 40 символів + "..."
    }

    #[TestDox('5. NewWallPostNotification правильно формує fallback-сніпети (POLL, ATTACHMENT)')]
    public function test_wall_post_notification_handles_empty_text(): void
    {
        $author = User::factory()->create();
        $notifiable = User::factory()->create();

        // Віртуальний пост без тексту, але з опитуванням
        $postWithPoll = new Post();
        $postWithPoll->id = 888;
        $postWithPoll->content = ['poll' => ['q' => 'Yes or no?']];

        $notification = new NewWallPostNotification($author, $postWithPoll);
        $array = $notification->toArray($notifiable);

        $this->assertEquals('POLL', $array['post_snippet']);
    }
}