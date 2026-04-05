<?php

namespace App\Enums;

enum PrivacyContext: string
{
    // Читання
    case Profile = 'profile';
    case Avatar = 'avatar';
    case Dob = 'dob';
    case Country = 'country';

    // Взаємодія
    case Message = 'message';
    case WallPost = 'wall_post';
    case Comment = 'comment';
}