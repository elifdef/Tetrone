<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Requests\StoreReportRequest;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function __construct(protected ReportService $reportService)
    {
    }

    /**
     * Отримати причини скарг
     *
     * @group Reports
     * @response 200 storage/responses/report_reasons.json
     */
    public function getReasons(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'code' => 'REASONS_RETRIEVED',
            'data' => ['reasons' => config('reports.reasons')]
        ])->setCache(['max_age' => 86400, 'public' => true]);
    }

    /**
     * Надіслати скаргу
     *
     * @group Reports
     * @authenticated
     * @response 201
     */
    public function store(StoreReportRequest $request): JsonResponse
    {
        $this->reportService->submitReport(
            $request->user()->id,
            $request->validated('type'),
            $request->validated('id'),
            $request->validated('reason'),
            $request->validated('details')
        );

        return response()->json([
            'success' => true,
            'code' => 'REPORT_SUBMITTED'
        ], 201);
    }
}