<?php

namespace App\Enums;

enum TicketStatus: string
{
    case Open = 'open';
    case InProgress = 'in_progress';
    case WaitingForUser = 'waiting_for_user';
    case Resolved = 'resolved';
    case Closed = 'closed';
}