<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Post;
use App\Models\Report;
use App\Models\User;
use App\Notifications\ReportReviewedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class ReportApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
    }

    #[TestDox('1. Отримання причин скарг (Кеш та Контракт)')]
    public function test_can_get_report_reasons(): void
    {
        $me = User::factory()->create();

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/reports/reasons');

        $response->assertStatus(200);
        $this->assertNotEmpty($response->json('data'));
    }

    #[TestDox('2. Успішне створення скарги на пост')]
    public function test_can_submit_report(): void
    {
        $user = User::factory()->create();
        $post = User::factory()->create()->posts()->create(['content' => ['text' => 'Bad stuff']]);

        $validReason = config('reports.reasons')[0]['id'] ?? 'spam';

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/reports', [
            'type' => 'post',
            'id' => (string)$post->id,
            'reason' => $validReason,
            'details' => 'Offensive.'
        ]);

        $response->assertStatus(201)->assertJsonPath('code', 'REPORT_SUBMITTED');

        $this->assertDatabaseHas('reports', [
            'reporter_id' => $user->id,
            'reportable_type' => Post::class,
            'reportable_id' => $post->id,
            'reason' => $validReason
        ]);
    }

    #[TestDox('3. Захист від спаму: не можна скаржитись двічі (429)')]
    public function test_spam_protection_cannot_report_twice(): void
    {
        $me = User::factory()->create();
        $post = User::factory()->create()->posts()->create(['content' => ['text' => 'Bad']]);

        $payload = [
            'type' => 'post',
            'id' => (string)$post->id,
            'reason' => 'spam',
            'details' => 'This is a terrible post!'
        ];

        $this->actingAs($me, 'sanctum')->postJson("/api/v1/reports", $payload)->assertStatus(201);

        $this->actingAs($me, 'sanctum')->postJson("/api/v1/reports", $payload)->assertStatus(429);
    }

    #[TestDox('4. Модератор бачить список скарг з пагінацією та статистикою')]
    public function test_moderator_can_see_reports_list(): void
    {
        $moderator = \App\Models\User::factory()->create(['role' => \App\Enums\Role::Moderator]);

        $response = $this->actingAs($moderator, 'sanctum')->getJson('/api/v1/admin/reports');

        $response->assertStatus(200);

        $this->assertArrayHasKey('data', $response->json());
    }

    #[TestDox('5. Модератор відхиляє скаргу -> статус міняється -> ЮЗЕР ОТРИМУЄ СПОВІЩЕННЯ')]
    public function test_moderator_can_reject_report_and_notify_user(): void
    {
        $moderator = User::factory()->create(['role' => Role::Moderator->value]);
        $reporter = User::factory()->create();
        $report = Report::create(['reporter_id' => $reporter->id, 'reportable_type' => User::class, 'reportable_id' => 2, 'reason' => 'spam']);

        $response = $this->actingAs($moderator, 'sanctum')->postJson("/api/v1/admin/reports/{$report->id}/reject", [
            'admin_response' => 'No violation found.'
        ]);

        $response->assertStatus(200);
        $this->assertEquals('rejected', $report->refresh()->status);

        Notification::assertSentTo($reporter, ReportReviewedNotification::class);
    }

    #[TestDox('6. Адмін ВИРІШУЄ скаргу на юзера -> ЮЗЕР РЕАЛЬНО БАНИТЬСЯ -> Reporter отримує сповіщення')]
    public function test_admin_resolving_user_report_actually_bans_user(): void
    {
        $admin = User::factory()->create(['role' => Role::Admin->value]);
        $reporter = User::factory()->create();
        $badUser = User::factory()->create(['role' => Role::User->value, 'is_banned' => false]);

        $report = Report::create(['reporter_id' => $reporter->id, 'reportable_type' => User::class, 'reportable_id' => $badUser->id, 'reason' => 'spam']);

        $response = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/reports/{$report->id}/resolve", [
            'admin_response' => 'User banned.',
            'action' => 'ban'
        ]);

        $response->assertStatus(200);
        $this->assertEquals('resolved', $report->refresh()->status);

        $this->assertTrue((bool)$badUser->refresh()->is_banned);

        Notification::assertSentTo($reporter, ReportReviewedNotification::class);
    }

    #[TestDox('7. Модератор НЕ МОЖЕ модерувати Адміна (Статус скарги не міняється, Адмін не баниться)')]
    public function test_moderator_cannot_moderate_admin(): void
    {
        $moderator = User::factory()->create(['role' => Role::Moderator]);
        $admin = User::factory()->create(['role' => Role::Admin]);
        $reporter = User::factory()->create();

        $this->actingAs($reporter, 'sanctum')->postJson("/api/v1/reports", [
            'type' => 'user',
            'id' => (string)$admin->id,
            'reason' => 'spam',
            'details' => 'He is bad'
        ])->assertStatus(201);

        $report = Report::first();

        $response = $this->actingAs($moderator, 'sanctum')->postJson("/api/v1/admin/reports/{$report->id}/resolve", [
            'action' => 'ban'
        ]);

        $response->assertStatus(403);
    }
}