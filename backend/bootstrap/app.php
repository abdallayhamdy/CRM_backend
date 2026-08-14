<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Illuminate\Auth\Access\AuthorizationException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Throwable;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prepend(\Illuminate\Http\Middleware\TrustProxies::class);

        $trustedProxies = array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('TRUSTED_PROXIES', '')),
        )));

        if ($trustedProxies !== []) {
            $middleware->trustProxies(at: $trustedProxies);
        }

        $middleware->throttleApi('api');

        $middleware->append(\App\Http\Middleware\SecurityHeaders::class);

        $middleware->alias([
            'set.workspace' => \App\Http\Middleware\SetCurrentWorkspace::class,
            'check.impersonation.expiry' => \App\Http\Middleware\CheckImpersonationExpiry::class,
        ]);

        $middleware->api(append: [
            \App\Http\Middleware\EnforceIpWhitelist::class,
        ]);

        $middleware->priority([
            \App\Http\Middleware\IsSuperAdmin::class,
            \App\Http\Middleware\EnforceIpWhitelist::class,
            \Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests::class,
            \Illuminate\Cookie\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            \Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests::class,
            \Illuminate\Routing\Middleware\ThrottleRequests::class,
            \Illuminate\Routing\Middleware\ThrottleRequestsWithRedis::class,
            \Illuminate\Contracts\Session\Middleware\AuthenticatesSessions::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
            \Illuminate\Auth\Middleware\Authorize::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
          $exceptions->shouldRenderJsonWhen(
        fn (Request $request) => $request->is('api/*'),
    );

    // 401
    $exceptions->render(function (AuthenticationException $e, Request $request) {
        return response()->json([
            'status' => 'error',
            'message' => 'Unauthenticated.'
        ], 401);
    });

    // 404 Model
    $exceptions->render(function (ModelNotFoundException $e, Request $request) {
        return response()->json([
            'status' => 'error',
            'message' => 'Resource not found.'
        ], 404);
    });

    // 404 Route
    $exceptions->render(function (NotFoundHttpException $e, Request $request) {
        return response()->json([
            'status' => 'error',
            'message' => 'Route not found.'
        ], 404);
    });

    // 422 Validation
    $exceptions->render(function (ValidationException $e, Request $request) {
        return response()->json([
            'status' => 'error',
            'message' => 'Validation failed.',
            'errors' => $e->errors()
        ], 422);
    });

$exceptions->render(function (AuthorizationException $e, Request $request) {
    return response()->json([
        'status' => 'error',
        'message' => 'Forbidden.'
    ], 403);
});

$exceptions->render(function (MethodNotAllowedHttpException $e, Request $request) {
    return response()->json([
        'status' => 'error',
        'message' => 'Method not allowed.'
    ], 405);
});

$exceptions->render(function (Throwable $e, Request $request) {
    if (config('app.debug')) {
        return null;
    }

    $statusCode = $e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface
        ? $e->getStatusCode()
        : 500;

    return response()->json([
        'status' => 'error',
        'message' => $statusCode === 500 ? 'Internal server error.' : $e->getMessage(),
    ], $statusCode);
});
    })->create();
    
