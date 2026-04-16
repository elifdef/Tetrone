<?php

namespace App\Enums;

enum TicketCategory: string
{
    case BugReport = 'bug_report';
    case AccountIssue = 'account_issue';
    case Appeal = 'appeal';
    case General = 'general';
}