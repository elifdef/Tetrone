<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class ApiException extends Exception
{
    public function __construct(
        protected string $apiCode,
        protected int    $statusCode = 400,
        protected mixed  $data = null
    )
    {
        parent::__construct($apiCode, $statusCode);
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'code' => $this->apiCode,
            'data' => $this->data
        ], $this->statusCode);
    }
}