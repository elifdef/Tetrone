<?php

namespace App\Enums;

enum TicketSubcategory: string
{
    case Design = 'design';
    case Localization = 'localization';
    case Functional = 'functional';
}