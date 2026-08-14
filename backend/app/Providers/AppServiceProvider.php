<?php

namespace App\Providers;


use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Workspace;
use App\Observers\UserObserver;
use App\Observers\WorkspaceObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Workspace::observe(WorkspaceObserver::class);
        User::observe(UserObserver::class);

        Gate::before(function ($user, $ability) {
            return $user->is_super_admin ? true : null;
        });

        // String abilities used by controllers map 1:1 to Spatie permission
        // names. Without these, authorize('view_reports') etc. resolve to no
        // policy and deny everyone except super admins.
        foreach (['view_reports', 'export_reports', 'view_dashboard', 'manage_audit_log', 'manage_panel_configs', 'manage_properties'] as $ability) {
            Gate::define($ability, fn ($user) => $user && $user->hasPermissionTo($ability));
        }

        // Global API rate limit. Requests are keyed per authenticated user, or
        // per IP for unauthenticated requests (e.g. login).
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute((int) env('API_THROTTLE_LIMIT', 120))
                ->by($request->user()?->id ?: $request->ip());
        });

        // Register custom sqlite function for database operations during testing/sqlite usage
        if (config('database.default') === 'sqlite' || app()->environment('testing')) {
            \Illuminate\Support\Facades\Event::listen(
                \Illuminate\Database\Events\StatementPrepared::class,
                function ($event) {
                    $connection = $event->connection;
                    if ($connection->getDriverName() === 'sqlite') {
                        $pdo = $connection->getPdo();
                        if (!isset($connection->date_format_registered)) {
                            $pdo->sqliteCreateFunction('DATE_FORMAT', function ($date, $format) {
                                if (!$date) return null;
                                try {
                                    $carbon = \Carbon\Carbon::parse($date);
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
                            $connection->date_format_registered = true;
                        }
                    }
                }
            );
        }
    }
}
