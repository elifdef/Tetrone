<?php

namespace App\Http\Controllers\Api\v1\Admin;

use App\Http\Controllers\Api\v1\Controller;
use App\Models\Report;
use App\Models\User;
use App\Services\Admin\ReportService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function __construct(protected ReportService $reportService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAdminPanel', User::class);

        $stats = [
            'total' => Report::count(),
            'pending' => Report::where('status', 'pending')->count(),
            'resolved' => Report::where('status', 'resolved')->count(),
            'rejected' => Report::where('status', 'rejected')->count(),
        ];

        $query = Report::with(['reporter', 'moderator', 'reportable'])->latest();

        if ($request->has('status') && in_array($request->status, ['pending', 'resolved', 'rejected']))
        {
            $query->where('status', $request->status);
        }

        return $this->success('REPORTS_RETRIEVED', 'Reports retrieved', [
            'stats' => $stats,
            'reports' => $query->paginate(20)
        ]);
    }

    public function resolve(Request $request, Report $report): JsonResponse
    {
        $this->authorize('viewAdminPanel', User::class);
        $request->validate(['admin_response' => 'required|string|max:1000']);

        if (class_basename($report->reportable_type) === 'User' && $report->reportable)
        {
            $this->authorize('moderate', clone $report->reportable);
        }

        $this->reportService->resolve($report, $request->user(), $request->admin_response);

        return $this->success('REPORT_RESOLVED', 'Report resolved. Content deleted/User banned.');
    }

    public function reject(Request $request, Report $report): JsonResponse
    {
        $this->authorize('viewAdminPanel', User::class);
        $request->validate(['admin_response' => 'required|string|max:1000']);

        $this->reportService->reject($report, $request->user(), $request->admin_response);

        return $this->success('REPORT_REJECTED', 'Report rejected. Content remains.');
    }
}