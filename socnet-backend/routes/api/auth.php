<?php

use App\Http\Controllers\Api\v1\AppealController;
use App\Http\Controllers\Api\v1\AuthController;
use App\Http\Controllers\Api\v1\VerificationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

// щоб ларавел не перекидував на сторінку логін якої немає
Route::get('/login', function ()
{
    return response()->json([
        'status' => false,
        'message' => 'Unauthenticated. Please login.'
    ], 401);
})->name('login');

// публічні (12 запитів/мін)
Route::controller(AuthController::class)->group(function ()
{
    // 12 запитів для реєстрації
    Route::post('sign-up', 'register')->middleware('throttle:12,1');

    // 5 спроб на хвилину для логіну
    Route::post('sign-in', 'login')->middleware('throttle:5,1');
});

// захищені
Route::middleware(['auth:sanctum'])->group(function ()
{
    // Вихід (12 запитів/мін)
    Route::post('sign-out', [AuthController::class, 'logout'])->middleware('throttle:12,1');

    Route::middleware('auth:sanctum')->group(function ()
    {
        Route::get('/appeals/status', [AppealController::class, 'checkStatus']);
        Route::post('/appeals', [AppealController::class, 'store']);
    });

    Route::post('/user/ping', function (Illuminate\Http\Request $request)
    {
        if ($request->input('active'))
        {
            $user = $request->user();
            DB::table('user_activities')->upsert(
                [
                    'user_id' => $user->id,
                    'date' => now()->toDateString(),
                    'active_seconds' => 60
                ],
                ['user_id', 'date'],
                ['active_seconds' => DB::raw('user_activities.active_seconds + 60')]
            );
        }

        return response()->noContent();
    });

    Route::prefix('email')->group(function ()
    {
        // відправка (6 листів/мін)
        Route::post('/verification-notification', function (Request $request)
        {
            if ($request->user()->hasVerifiedEmail())
                return response()->json(['message' => 'Already confirmed'], 204);

            $request->user()->sendEmailVerificationNotification();

            return response()->json(['message' => 'Email sent successfully.']);
        })->middleware('throttle:6,1');

        // підтвердження (40 раз в мінуту)
        Route::get('/verify/{id}/{hash}', [VerificationController::class, 'verify'])
            ->middleware('throttle:40,1')
            ->name('verification.verify');
    });
});