<?php

namespace App\Policies;

use App\Models\Report;
use App\Models\User;
use App\Enums\Role;

class ReportPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role?->value >= Role::Moderator->value;
    }

    public function manage(User $user, Report $report): bool
    {
        if ($user->role?->value < Role::Moderator->value) return false;

        if (class_basename($report->reportable_type) === 'User' && $report->reportable)
        {
            return $user->role->value > $report->reportable->role->value;
        }

        return true;
    }
}