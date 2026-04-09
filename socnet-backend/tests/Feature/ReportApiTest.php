<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Post;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class ReportApiTest extends TestCase
{
    use RefreshDatabase;

    #[TestDox('1. Отримання причин скарг (Кеш)')]
    public function test_get_report_reasons(): void
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/reports/reasons');

        $response->assertStatus(200)
            ->assertJsonPath('code', 'REASONS_RETRIEVED')
            ->assertHeader('Cache-Control', 'max-age=86400, public');
    }

    #[TestDox('2. Успішне створення скарги на пост')]
    public function test_can_submit_report(): void
    {
        $user = User::factory()->create();
        $post = User::factory()->create()->posts()->create(['content' => ['text' => 'Bad stuff']]);

        $validReason = config('reports.reasons')[0] ?? 'spam'; // Беремо перший валідний конфіг

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/reports', [
            'type' => 'post',
            'id' => (string)$post->id,
            'reason' => $validReason,
            'details' => 'This is highly offensive.'
        ]);

        $response->assertStatus(201)->assertJsonPath('code', 'REPORT_SUBMITTED');
        $this->assertDatabaseCount('reports', 1);
    }

    #[TestDox('3. Помилка 404 при спробі поскаржитись на неіснуючий об\'єкт')]
    public function test_fails_if_target_not_found(): void
    {
        $user = User::factory()->create();
        $validReason = config('reports.reasons')[0] ?? 'spam';

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/reports', [
            'type' => 'user',
            'id' => '999999',
            'reason' => $validReason,
            'details' => 'Does not exist.'
        ]);

        $response->assertStatus(404)->assertJsonPath('code', 'ERR_TARGET_NOT_FOUND');
    }

    #[TestDox('4. Захист від спаму: не можна скаржитись двічі (429)')]
    public function test_cannot_report_same_target_twice(): void
    {
        $user = User::factory()->create();
        $targetUser = User::factory()->create();
        $validReason = config('reports.reasons')[0] ?? 'spam';

        // Перша скарга
        $this->actingAs($user, 'sanctum')->postJson('/api/v1/reports', [
            'type' => 'user', 'id' => (string)$targetUser->id, 'reason' => $validReason, 'details' => 'Bad user.'
        ])->assertStatus(201);

        // Друга скарга на того ж юзера
        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/reports', [
            'type' => 'user', 'id' => (string)$targetUser->id, 'reason' => $validReason, 'details' => 'Still bad.'
        ]);

        $response->assertStatus(429)->assertJsonPath('code', 'ERR_ALREADY_REPORTED');
    }

    // ==========================================
    // 🛡 ADMIN REPORTS API
    // ==========================================

    #[TestDox('5. Звичайний юзер не має доступу до адмінської панелі скарг (403)')]
    public function test_regular_user_cannot_view_admin_reports(): void
    {
        $user = User::factory()->create(['role' => Role::User->value]);
        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/admin/reports');
        $response->assertStatus(403);
    }

    #[TestDox('6. Модератор бачить список скарг та статистику')]
    public function test_moderator_can_view_reports(): void
    {
        $moderator = User::factory()->create(['role' => Role::Moderator->value]);

        $response = $this->actingAs($moderator, 'sanctum')->getJson('/api/v1/admin/reports');
        $response->assertStatus(200)->assertJsonPath('code', 'REPORTS_RETRIEVED');
        $this->assertArrayHasKey('stats', $response->json('data'));
    }

    #[TestDox('7. Модератор може відхилити скаргу')]
    public function test_moderator_can_reject_report(): void
    {
        $moderator = User::factory()->create(['role' => Role::Moderator->value]);
        $report = Report::create(['reporter_id' => 1, 'reportable_type' => User::class, 'reportable_id' => 2, 'reason' => 'spam', 'details' => 'test']);

        $response = $this->actingAs($moderator, 'sanctum')->postJson("/api/v1/admin/reports/{$report->id}/reject", [
            'admin_response' => 'No violation found.'
        ]);

        $response->assertStatus(200)->assertJsonPath('code', 'REPORT_REJECTED');
        $this->assertEquals('rejected', $report->refresh()->status);
    }

    #[TestDox('8. Модератор НЕ МОЖЕ вирішити скаргу на Адміна (Policy)')]
    public function test_moderator_cannot_moderate_admin(): void
    {
        $moderator = User::factory()->create(['role' => Role::Moderator->value]);
        $admin = User::factory()->create(['role' => Role::Admin->value]);

        $report = Report::create(['reporter_id' => 1, 'reportable_type' => User::class, 'reportable_id' => $admin->id, 'reason' => 'spam', 'details' => 'test']);

        $response = $this->actingAs($moderator, 'sanctum')->postJson("/api/v1/admin/reports/{$report->id}/resolve", [
            'admin_response' => 'Banning admin.'
        ]);

        $response->assertStatus(403); // Policy block (moderator cannot moderate admin)
    }

    #[TestDox('9. Адмін МОЖЕ вирішити скаргу на юзера')]
    public function test_admin_can_resolve_report(): void
    {
        $admin = User::factory()->create(['role' => Role::Admin->value]);
        $badUser = User::factory()->create(['role' => Role::User->value]);

        $report = Report::create(['reporter_id' => 1, 'reportable_type' => User::class, 'reportable_id' => $badUser->id, 'reason' => 'spam', 'details' => 'test']);

        $response = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/reports/{$report->id}/resolve", [
            'admin_response' => 'User banned.'
        ]);

        $response->assertStatus(200)->assertJsonPath('code', 'REPORT_RESOLVED');
        $this->assertEquals('resolved', $report->refresh()->status);
    }
}