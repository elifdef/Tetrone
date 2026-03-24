<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Requests\StoreReportRequest;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(protected ReportService $reportService)
    {
    }

    public function getReasons(): JsonResponse
    {
        return $this->success('REASONS_RETRIEVED', 'Reasons retrieved', [
            'reasons' => config('reports.reasons')
        ])->setCache(['max_age' => 86400, 'public' => true]);
    }

    public function store(StoreReportRequest $request): JsonResponse
    {
        $result = $this->reportService->submitReport(
            $request->user()->id,
            $request->validated('type'),
            $request->validated('id'),
            $request->validated('reason'),
            $request->validated('details')
        );

        if (is_array($result))
        {
            return $this->error($result['error'], $result['message'], $result['status']);
        }

        return $this->success('REPORT_SUBMITTED', 'Report submitted successfully.');
    }
}