<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Ticket;
use App\Enums\TicketCategory;
use App\Enums\TicketStatus;
use App\Enums\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class SupportApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    #[TestDox('1. Баг-репорт вимагає картинку та кроки відтворення')]
    public function test_bug_report_requires_attachments_and_steps(): void
    {
        $user = User::factory()->create();

        // Спроба створити баг без файлів і кроків
        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/support/tickets', [
            'category' => TicketCategory::BugReport->value,
            'subject' => 'Found a glitch',
            'message' => 'Something is broken here.',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['attachments', 'meta.steps_to_reproduce']);
    }

    #[TestDox('2. Жорстка фільтрація JSON (meta): сміття відкидається')]
    public function test_garbage_json_meta_is_filtered_out(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/support/tickets', [
            'category' => TicketCategory::General->value,
            'subject' => 'Just a question',
            'message' => 'How to change password?',
            'meta' => [
                'browser' => 'Chrome',
                'hacker_injection' => 'DROP TABLE users;', // СМІТТЯ
                'is_admin' => true // СПРОБА ПІДРОБКИ
            ]
        ]);

        $response->assertStatus(201);
        $ticket = Ticket::first();

        // Жорстка перевірка БД: сміття не збереглося!
        $meta = $ticket->meta_data;
        $this->assertEquals('Chrome', $meta['browser']);
        $this->assertArrayNotHasKey('hacker_injection', $meta);
        $this->assertArrayNotHasKey('is_admin', $meta);
    }

    #[TestDox('3. Анти-спам: не більше 3 відкритих тікетів')]
    public function test_user_cannot_create_more_than_3_active_tickets(): void
    {
        $user = User::factory()->create();

        // Створюємо 3 тікети вручну через класичний create (без фабрики)
        for ($i = 0; $i < 3; $i++)
        {
            Ticket::create([
                'user_id' => $user->id,
                'subject' => 'Test Ticket ' . $i,
                'category' => TicketCategory::General->value,
                'status' => TicketStatus::Open->value,
            ]);
        }

        // 4-та спроба
        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/support/tickets', [
            'category' => TicketCategory::General->value,
            'subject' => 'Spam ticket',
            'message' => 'Let me in!',
        ]);

        $response->assertStatus(429)->assertJsonPath('code', 'ERR_TOO_MANY_TICKETS');
    }

    #[TestDox('4. Відповідь адміна змінює статус на WaitingForUser')]
    public function test_admin_reply_changes_status(): void
    {
        $user = User::factory()->create();
        $admin = User::factory()->create(['role' => Role::Admin->value]);

        // Створюємо тікет вручну
        $ticket = Ticket::create([
            'user_id' => $user->id,
            'subject' => 'Help me',
            'category' => TicketCategory::General->value,
            'status' => TicketStatus::Open->value,
        ]);

        // Звертаємося до твого нового роута в адмінці
        $response = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/tickets/{$ticket->id}/reply", [
            'message' => 'We are checking this.',
            'is_internal' => false
        ]);

        $response->assertStatus(200);

        // Перевіряємо, що статус змінився
        $this->assertEquals(TicketStatus::WaitingForUser, $ticket->refresh()->status);
    }
}