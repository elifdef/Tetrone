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

    private function generateProseMirrorJson(string $text): array
    {
        return [
            'type' => 'doc',
            'content' => [
                ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => $text]]]
            ]
        ];
    }

    #[TestDox('1. UserBlockedEvent відправляється в правильний канал з правильним PAYLOAD')]
    public function test_user_blocked_event_is_dispatched_with_correct_payload(): void
    {
        Event::fake([UserBlockedEvent::class]);

        $me = User::factory()->create();
        $target = User::factory()->create();

        $this->actingAs($me, 'sanctum')->postJson("/api/v1/friends/block/{$target->username}");

        Event::assertDispatched(UserBlockedEvent::class, function (UserBlockedEvent $event) use ($me, $target) {

            return $event->blocker_id === $me->id
                && $event->broadcastOn()->name === 'private-App.Models.User.' . $target->id;
        });
    }

    #[TestDox('2. Сповіщення про заявку в друзі поважає налаштування юзера (вимкнені пуші)')]
    public function test_friend_request_notification_respects_user_settings(): void
    {
        $requester = User::factory()->create();
        $notifiable = User::factory()->create();

        $notifiable->notificationSettings()->update(['notify_friend_requests' => false]);
        $notifiable->refresh();

        $notification = new NewFriendRequestNotification($requester);
        $broadcastData = $notification->toBroadcast($notifiable)->data;

        $this->assertFalse($broadcastData['show_toast']);
        $this->assertEquals('none', $broadcastData['sound']);
    }

    #[TestDox('3. NewLikeNotification: КОРЕКТНО парсить вкладений ProseMirror JSON')]
    public function test_like_notification_handles_prosemirror_json_correctly(): void
    {
        $liker = User::factory()->create();
        $notifiable = User::factory()->create();

        $post = new Post();
        $post->id = 999;

        $post->content = $this->generateProseMirrorJson('Дуже довгий текст який має бути обрізаний функцією Str::limit');

        $notification = new NewLikeNotification($liker, $post);
        $array = $notification->toArray($notifiable);

        $this->assertNotNull($array['post_snippet']);
        $this->assertStringNotContainsString('type', $array['post_snippet']);
    }

    #[TestDox('4. NewWallPostNotification: Повертає ATTACHMENT, якщо тексту немає, але є медіа')]
    public function test_wall_post_notification_handles_attachments(): void
    {
        $author = User::factory()->create();
        $notifiable = User::factory()->create();

        $post = new Post();
        $post->id = 888;

        $post->content = ['youtube' => 'https://youtube.com/watch?v=123'];

        $notification = new NewWallPostNotification($author, $post);
        $array = $notification->toArray($notifiable);

        $this->assertEquals('ATTACHMENT', $array['post_snippet']);
    }
}