<?php

namespace App\Services;

use App\Models\Comment;
use App\Models\Post;
use App\Models\Report;
use App\Models\User;
use App\Models\StickerPack;

class ReportService
{
    protected array $typeMap = [
        'post' => Post::class,
        'user' => User::class,
        'comment' => Comment::class,
        'emoji_pack' => StickerPack::class,
    ];

    public function submitReport(int $reporterId, string $type, string $targetId, string $reason, string $details): array|Report
    {
        $targetClass = $this->typeMap[$type];

        if (!$targetClass::find($targetId))
        {
            return ['error' => 'ERR_TARGET_NOT_FOUND', 'message' => 'Target not found', 'status' => 404];
        }

        $exists = Report::where('reporter_id', $reporterId)
            ->where('reportable_type', $targetClass)
            ->where('reportable_id', $targetId)
            ->where('status', 'pending')
            ->exists();

        if ($exists)
        {
            return ['error' => 'ERR_ALREADY_REPORTED', 'message' => 'You already reported this.', 'status' => 429];
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