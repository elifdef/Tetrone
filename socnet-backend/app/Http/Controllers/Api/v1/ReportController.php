<?php

namespace App\Http\Controllers\Api\v1;

use App\Models\Comment;
use App\Models\Post;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    // отримання причин (кешується в браузері на 24год)
    public function getReasons()
    {
        return response()->json([
            'status' => true,
            'reasons' => config('reports.reasons')
        ])->setCache(['max_age' => 86400, 'public' => true]);
    }

    // відправка скарги
    public function store(Request $request)
    {
        $validReasons = implode(',', config('reports.reasons'));

        $request->validate([
            'type' => 'required|in:post,user,comment',
            'id' => 'required|string',
            'reason' => 'required|string|in:' . $validReasons,
            'details' => 'required|string|max:1000',
        ]);

        $typeMap = [
            'post' => Post::class,
            'user' => User::class,
            'comment' => Comment::class,
        ];

        $targetClass = $typeMap[$request->type];

        // перевіряємо чи існує
        if (!$targetClass::find($request->id))
        {
            return response()->json(['message' => 'Target not found'], 404);
        }

        // захист від спаму: чи не скаржився юзер на це саме щойно
        $exists = Report::where('reporter_id', $request->user()->id)
            ->where('reportable_type', $targetClass)
            ->where('reportable_id', $request->id)
            ->where('status', 'pending')
            ->exists();

        if ($exists)
        {
            return response()->json(['message' => 'You already reported this.'], 429);
        }

        Report::create([
            'reporter_id' => $request->user()->id,
            'reportable_type' => $targetClass,
            'reportable_id' => $request->id,
            'reason' => $request->reason,
            'details' => $request->details,
        ]);

        return response()->json(['status' => true, 'message' => 'Report submitted successfully.']);
    }
}