<?php

return [
    'timeout_minutes' => env('IMPERSONATION_TIMEOUT_MINUTES', 30),

    'rate_limit_per_hour' => env('IMPERSONATION_RATE_LIMIT', 10),
];
