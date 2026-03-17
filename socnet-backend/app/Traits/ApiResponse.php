<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponse
{
    // якщо успішно
    protected function success(
        string $code = 'SUCCESS',
        string $message = 'Success',
               $data = null,
        int    $statusCode = 200
    ): JsonResponse
    {
        return response()->json([
            'success' => true,
            'code' => $code,
            'message' => $message,
            'data' => $data,
        ], $statusCode);
    }

    // якщо помилка
    protected function error(
        string $code,
        string $message = 'Error',
        int    $statusCode = 400,
               $data = null): JsonResponse
    {
        return response()->json([
            'success' => false,
            'code' => $code,
            'message' => $message,
            'data' => $data,
        ], $statusCode);
    }
}