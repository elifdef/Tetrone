<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Requests\Support\StoreTicketRequest;
use App\Models\Ticket;
use App\Services\SupportService;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\v1\Controller;
use Illuminate\Support\Facades\Cache;

class SupportController extends Controller
{
    public function __construct(protected SupportService $supportService)
    {
    }

    public function index(Request $request)
    {
        $tickets = $request->user()->tickets()->latest()->paginate(15);
        return response()->json(['success' => true, 'code' => 'TICKETS_RETRIEVED', 'data' => $tickets]);
    }

    public function store(StoreTicketRequest $request)
    {
        $ticket = $this->supportService->createTicket($request->user(), $request->validated(), $request->file('attachments'));
        return response()->json(['success' => true, 'code' => 'TICKET_CREATED', 'data' => $ticket], 201);
    }

    /**
     * Детальний перегляд свого тікета
     */
    public function show(\App\Models\Ticket $ticket)
    {
        $ticket->load([
            'user:id,username,first_name,last_name,avatar',
            'messages.user:id,username,first_name,last_name,avatar',
            'messages.attachments',
            'assignedTo:id,username'
        ]);

        return response()->json([
            'success' => true,
            'data' => $ticket
        ]);
    }

    public function reply(Request $request, Ticket $ticket)
    {
        if ($ticket->user_id !== request()->user()->id)
        {
            abort(403, 'Unauthorized');
        }

        $request->validate(['message' => 'required|string|min:2']);

        $this->supportService->replyToTicket($ticket, $request->user(), $request->message, false);

        return response()->json(['success' => true, 'code' => 'REPLY_SENT']);
    }

    public function getCategories()
    {
        // Кешуємо на 30 днів
        $data = Cache::remember('support_categories', now()->addDays(30), function ()
        {
            return [
                'categories' => [
                    ['id' => 'bug_report', 'name_key' => 'support.cat_bug'],
                    ['id' => 'account_issue', 'name_key' => 'support.cat_account'],
                    ['id' => 'appeal', 'name_key' => 'support.cat_appeal'],
                    ['id' => 'general', 'name_key' => 'support.cat_general'],
                ],
                'subcategories' => [
                    ['id' => 'design', 'name_key' => 'support.sub_design'],
                    ['id' => 'localization', 'name_key' => 'support.sub_localization'],
                    ['id' => 'functional', 'name_key' => 'support.sub_functional'],
                ]
            ];
        });

        return response()->json([
            'success' => true,
            'code' => 'CATEGORIES_RETRIEVED',
            'data' => $data
        ]);
    }
}