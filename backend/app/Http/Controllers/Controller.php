<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

abstract class Controller
{
    protected function paginationLimit(Request $request, int $default = 15, int $max = 100): int
    {
        $limit = (int) ($request->limit ?? $default);

        return min($limit > 0 ? $limit : $default, $max);
    }
}
