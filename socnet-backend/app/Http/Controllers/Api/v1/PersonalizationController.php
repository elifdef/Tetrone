<?php

namespace App\Http\Controllers\Api\v1;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PersonalizationController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'personalization' => $request->user()->personalization
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'banner_color' => 'nullable|string|max:150',
            'username_color' => 'nullable|string|max:50',
        ]);

        $user = $request->user();

        $personalization = $user->personalization()->firstOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        if (!$personalization->wasRecentlyCreated)
        {
            $personalization->update($validated);
        }

        return response()->json([
            'status' => true,
            'message' => 'Personalization updated',
            'personalization' => $personalization
        ]);
    }
}