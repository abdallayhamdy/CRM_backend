<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Task;
use App\Models\Ticket;
use App\Models\Activity;
use App\Http\Resources\ActivityResource;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class DashboardController extends Controller
{
    use AuthorizesRequests;
    public function overview()
    {
        $this->authorize('view_dashboard');

        $user = request()->user();
        $workspaceId = $user ? ($user->workspace_id ?? 'global') : 'global';

        $data = \Illuminate\Support\Facades\Cache::remember(
            "dashboard_overview:{$workspaceId}",
            600,
            function () {
                $dealAggregates = Deal::selectRaw("
                    SUM(CASE WHEN status = 'won' THEN amount ELSE 0 END) as total_revenue,
                    SUM(CASE WHEN status = 'open' THEN amount ELSE 0 END) as pipeline_value,
                    COUNT(*) as total_deals,
                    SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won_deals,
                    SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_deals
                ")->first();

                $totalRevenue = (float) ($dealAggregates->total_revenue ?? 0);
                $pipelineValue = (float) ($dealAggregates->pipeline_value ?? 0);
                $openDeals = (int) ($dealAggregates->open_deals ?? 0);
                $totalDeals = (int) ($dealAggregates->total_deals ?? 0);
                $wonDeals = (int) ($dealAggregates->won_deals ?? 0);
                $conversionRate = $totalDeals > 0 ? round(($wonDeals / $totalDeals) * 100, 2) : 0;

                $openTickets = Ticket::whereIn('status', ['open', 'pending'])->count();

                $activeTasks = Task::whereIn('status', ['pending', 'in_progress'])->count();

                $contactsCount = Contact::count();

                $companiesCount = Company::count();

                return [
                    'totalRevenue' => (float) $totalRevenue,
                    'pipelineValue' => (float) $pipelineValue,
                    'openDeals' => $openDeals,
                    'wonDeals' => $wonDeals,
                    'conversionRate' => $conversionRate,
                    'openTickets' => $openTickets,
                    'activeTasks' => $activeTasks,
                    'contactsCount' => $contactsCount,
                    'companiesCount' => $companiesCount,
                ];
            }
        );

        return response()->json([
            'status' => 'success',
            'data' => $data,
        ]);
    }

    public function recentActivity()
    {
        $this->authorize('view_dashboard');
        $activities = Activity::with('user', 'activitable')
            ->latest()
            ->take(10)
            ->get();

        $data = $activities->map(fn($a) => (new ActivityResource($a))->toArray(request()))->values();

        return response()->json([
            'status' => 'success',
            'data' => $data,
        ]);
    }
}
