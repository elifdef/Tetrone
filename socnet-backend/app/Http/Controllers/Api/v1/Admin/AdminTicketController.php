<?php

namespace App\Http\Controllers\Api\v1\Admin;

use App\Http\Controllers\Api\v1\Controller;
use App\Models\Ticket;
use App\Services\SupportService;
use App\Enums\TicketStatus;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdminTicketController extends Controller
{
    public function __construct(protected SupportService $supportService)
    {
    }

    /**
     * Отримати всі тікети (з фільтрацією за статусом/категорією)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Ticket::with('user:id,username,avatar');

        if ($request->has('status'))
        {
            $query->where('status', $request->status);
        }

        return response()->json([
            'success' => true,
            'code' => 'TICKETS_RETRIEVED',
            'data' => $query->latest()->paginate(20)
        ]);
    }

    /**
     * Переглянути деталі тікета з повідомленнями
     */
    public function show(Ticket $ticket): JsonResponse
    {
        $ticket->load(['user', 'messages.attachments', 'messages.user']);

        return response()->json([
            'success' => true,
            'data' => $ticket
        ]);
    }

    /**
     * Відповідь адміна (може бути внутрішня нотатка)
     */
    public function reply(Request $request, Ticket $ticket): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|min:2',
            'is_internal' => 'boolean'
        ]);

        $message = $this->supportService->replyToTicket(
            $ticket,
            $request->user(),
            $request->message,
            $request->boolean('is_internal')
        );

        return response()->json([
            'success' => true,
            'code' => 'REPLY_SENT',
            'data' => $message
        ]);
    }

    /**
     * Призначити тікет на себе
     */
    public function assign(Request $request, Ticket $ticket): JsonResponse
    {
        $ticket->update([
            'assigned_to' => $request->user()->id,
            'status' => TicketStatus::IN_PROGRESS
        ]);

        return response()->json(['success' => true, 'code' => 'TICKET_ASSIGNED']);
    }
}