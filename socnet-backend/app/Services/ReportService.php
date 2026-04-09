<?php

namespace App\Services;

use App\Models\Comment;
use App\Models\Post;
use App\Models\Report;
use App\Models\User;
use App\Models\StickerPack;
use App\Exceptions\ApiException;

class ReportService
{
    public function submitReport(int $reporterId, string $type, string $targetId, string $reason, string $details): Report
    {
        $targetClass = match ($type)
        {
            'post' => Post::class,
            'user' => User::class,
            'comment' => Comment::class,
            'emoji_pack' => StickerPack::class,
            default => throw new ApiException('ERR_VALIDATION', 422)
        };

        if (!$targetClass::find($targetId))
        {
            throw new ApiException('ERR_TARGET_NOT_FOUND', 404);
        }

        $exists = Report::where('reporter_id', $reporterId)
            ->where('reportable_type', $targetClass)
            ->where('reportable_id', $targetId)
            ->where('status', 'pending')
            ->exists();

        if ($exists)
        {
            throw new ApiException('ERR_ALREADY_REPORTED', 429);
        }

        return Report::create([
            'reporter_id' => $reporterId,
            'reportable_type' => $targetClass,
            'reportable_id' => $targetId,
            'reason' => $reason,
            'details' => $details,
        ]);
    }
}