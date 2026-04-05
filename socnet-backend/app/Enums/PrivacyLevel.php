<?php

namespace App\Enums;

enum PrivacyLevel: int
{
    case Everyone = 0; // Доступно всім
    case Friends = 1;  // Тільки друзям
    case Nobody = 2;   // Нікому
    case Custom = 3;   // З винятками
}