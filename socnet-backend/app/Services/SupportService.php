<?php

namespace App\Services;

namespace App\Services;

use App\Models\Ticket;
use App\Models\User;
use App\Enums\TicketStatus;
use App\Enums\Role;
use App\Exceptions\ApiException;
use Illuminate\Support\Facades\DB;

class SupportService
{
    public function createTicket(User $user, array $data, ?array $files): Ticket
    {
        // Захист від спаму тікетами
        $activeTickets = Ticket::where('user_id', $user->id)
            ->whereIn('status', [TicketStatus::Open->value, TicketStatus::InProgress->value])
            ->count();

        if ($activeTickets >= 3)
        {
            throw new ApiException('ERR_TOO_MANY_TICKETS', 429);
        }

        return DB::transaction(function () use ($user, $data, $files)
        {
            $metaData = [];
            if (isset($data['meta']) && is_array($data['meta']))
            {
                $allowedKeys = ['browser', 'os', 'steps_to_reproduce'];
                foreach ($allowedKeys as $key)
                {
                    if (isset($data['meta'][$key]))
                    {
                        $metaData[$key] = $data['meta'][$key];
                    }
                }
            }

            $metaData['user_agent'] = request()->userAgent();
            $metaData['is_banned_appeal'] = $user->is_banned ? true : false;

            $ticket = Ticket::create([
                'user_id' => $user->id,
                'subject' => $data['subject'],
                'category' => $data['category'],
                'subcategory' => $data['subcategory'] ?? null,
                'status' => TicketStatus::Open,
                'meta_data' => array_filter($metaData),
            ]);

            $message = $ticket->messages()->create([
                'user_id' => $user->id,
                'message' => $data['message'],
            ]);

            // Обробка файлів
            if ($files)
            {
                foreach ($files as $file)
                {
                    $path = $file->store("support/tickets/{$ticket->id}", 'public');
                    $message->attachments()->create([
                        'file_path' => $path,
                        'file_name' => $file->getClientOriginalName(),
                        'file_type' => $file->getMimeType(),
                        'file_size' => $file->getSize(),
                    ]);
                }
            }

            return $ticket;
        });
    }

    /**
     * Відповідь у тікет (для юзера і для адміна)
     */
    public function replyToTicket(Ticket $ticket, User $user, string $text, bool $isInternal = false)
    {
        // Не можна відповідати в закритий тікет
        if ($ticket->status === TicketStatus::Closed || $ticket->status === TicketStatus::Resolved)
        {
            throw new ApiException('ERR_TICKET_CLOSED', 403);
        }

        return DB::transaction(function () use ($ticket, $user, $text, $isInternal)
        {
            $message = $ticket->messages()->create([
                'user_id' => $user->id,
                'message' => $text,
                'is_internal_note' => $isInternal
            ]);

            // Логіка зміни статусу
            if ($user->role->value !== Role::User->value && !$isInternal)
            {
                // Якщо відповів адмін (і це не прихована нотатка) -> чекаємо відповіді юзера
                $ticket->update(['status' => TicketStatus::WaitingForUser]);
            } elseif ($user->id === $ticket->user_id)
            {
                // Якщо відповів сам юзер -> повертаємо в роботу
                $ticket->update(['status' => TicketStatus::InProgress]);
            }

            return $message;
        });
    }
}