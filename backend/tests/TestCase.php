<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Clear Spatie permission cache and reset team ID to prevent test cross-contamination
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
        app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId(null);

        $conn = \Illuminate\Support\Facades\DB::connection();
        if ($conn->getDriverName() === 'sqlite') {
            $pdo = $conn->getPdo();
            $pdo->sqliteCreateFunction('DATE_FORMAT', function ($date, $format) {
                if (!$date) return null;
                try {
                    $carbon = \Carbon\Carbon::parse($date);
                    // Convert MySQL format to PHP format
                    $phpFormat = str_replace(
                        ['%Y', '%m', '%d', '%H', '%i', '%s', '%u', '%w'],
                        ['Y', 'm', 'd', 'H', 'i', 's', 'W', 'w'],
                        $format
                    );
                    return $carbon->format($phpFormat);
                } catch (\Throwable $e) {
                    return null;
                }
            });
            // Emulate MySQL JSON_UNQUOTE(JSON_EXTRACT(...)): SQLite returns JSON
            // booleans as 1/0 (like MySQL does internally before the unquote), so
            // map 1/0 back to the 'true'/'false' strings MySQL would produce.
            $pdo->sqliteCreateFunction('JSON_UNQUOTE', function ($value) {
                if ($value === null) return 'null';
                if (is_bool($value)) return $value ? 'true' : 'false';
                if (is_int($value)) {
                    return $value === 1 ? 'true' : ($value === 0 ? 'false' : (string) $value);
                }
                return (string) $value;
            });
        }
    }
}
