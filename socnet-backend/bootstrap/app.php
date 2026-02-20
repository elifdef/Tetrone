<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use App\Http\Middleware\UpdateLastSeen;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\HttpKernel\Exception\HttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware)
    {
        $middleware->api(append: [UpdateLastSeen::class]);
    })
    ->withExceptions(function (Exceptions $exceptions)
    {
        // змушує Laravel віддавати JSON помилки
        $exceptions->shouldRenderJsonWhen(function (Request $request, Throwable $e)
        {
            if ($request->is('api/*'))
            {
                return true;
            }
            return $request->expectsJson();
        });

        // при неавторизованому
        $exceptions->render(function (AuthenticationException $e, Request $request)
        {
            if ($request->is('api/*'))
            {
                return response()->json([
                    'status' => false,
                    'message' => 'Unauthenticated. Please provide a valid token.'
                ], 401);
            }
        });

        // при знайденому маршруту
        $exceptions->render(function (NotFoundHttpException $e, Request $request)
        {
            if ($request->is('api/*'))
            {
                return response()->json([
                    'status' => false,
                    'message' => 'Record not found.'
                ], 404);
            }
        });

        // при ліміті запитів
        $exceptions->render(function (ThrottleRequestsException $e, Request $request)
        {
            if ($request->is('api/*') || $request->wantsJson())
            {
                return response()->json([
                    'message' => 'Too many attempts. Try later',
                    'seconds_remaining' => $e->getHeaders()['Retry-After'] ?? null
                ], 429);
            }
        });

        // при помилці відправки пошти
        $exceptions->render(function (TransportException $e, Request $request)
        {
            if ($request->is('api/*'))
            {
                return response()->json([
                    'message' => 'Error on the part of the email service.'
                ], 500);
            }
        });

        // якщо користувач не підтвердив пошту
        $exceptions->render(function (HttpException $e, Request $request)
        {
            if ($request->is('api/*'))
            {
                return response()->json([
                    'status' => false,
                    'message' => "You can't do this without email confirmation."
                ], 403);
            }
        });

    })->create();