<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        // لو اليوزر مش سوبر أدمن، اطرده
        if (!auth('sanctum')->check() || !auth('sanctum')->user()->is_super_admin) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Super Admin access only.'
            ], 403);
        }

        return $next($request);
    }
}