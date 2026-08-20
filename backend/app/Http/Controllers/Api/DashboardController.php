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
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class DashboardController extends Controller
{
    use AuthorizesRequests;

    public function overview()
    {
        $this->authorize('view_dashboard');

        $user = request()->user();
        $workspaceId = $user ? ($user->workspace_id ?? 'global') : 'global';

        $data = Cache::remember(
            "dashboard_overview:{$workspaceId}",
            600,
            function () {
                $contactsCount = Contact::count();
                $companiesCount = Company::count();

                $duplicatedPhones = Contact::whereNotNull('phone')
                    ->where('phone', '!=', '')
                    ->selectRaw('phone, count(*) as cnt')
                    ->groupBy('phone')
                    ->havingRaw('count(*) > 1')
                    ->get()
                    ->sum('cnt');

                $leadStatuses = Contact::selectRaw(
                    "JSON_UNQUOTE(JSON_EXTRACT(custom_data, '$.lead_status')) as lead_status, count(*) as cnt"
                )
                    ->groupBy('lead_status')
                    ->get()
                    ->pluck('cnt', 'lead_status')
                    ->mapWithKeys(fn ($count, $status) => [($status ?: 'New') => (int) $count])
                    ->toArray();

                $dealsCount = Deal::count();

                $dealStages = Deal::with('pipelineStage')
                    ->get()
                    ->groupBy(fn ($deal) => $deal->pipelineStage
                        ? strtolower(str_replace(' ', '_', $deal->pipelineStage->name))
                        : 'unknown'
                    )
                    ->mapWithKeys(fn ($deals, $stage) => [$stage => $deals->count()])
                    ->toArray();

                $tasksCount = Task::count();

                $taskStatuses = Task::selectRaw('status, count(*) as cnt')
                    ->groupBy('status')
                    ->pluck('cnt', 'status')
                    ->map(fn ($count) => (int) $count)
                    ->toArray();

                $ticketsCount = Ticket::count();

                $ticketRows = Ticket::selectRaw('status, priority, count(*) as cnt')
                    ->groupBy('status', 'priority')
                    ->get();

                $ticketStatuses = $ticketRows
                    ->groupBy('status')
                    ->mapWithKeys(fn ($rows, $status) => [$status => $rows->sum('cnt')])
                    ->toArray();

                $ticketPriorities = $ticketRows
                    ->groupBy('priority')
                    ->mapWithKeys(fn ($rows, $priority) => [$priority => $rows->sum('cnt')])
                    ->toArray();

                return [
                    'contacts' => [
                        'total' => $contactsCount,
                        'companies' => $companiesCount,
                        'duplicatedPhones' => (int) $duplicatedPhones,
                        'leadStatuses' => $leadStatuses,
                    ],
                    'deals' => [
                        'total' => $dealsCount,
                        'stages' => $dealStages,
                    ],
                    'tasks' => [
                        'total' => $tasksCount,
                        'statuses' => $taskStatuses,
                    ],
                    'tickets' => [
                        'total' => $ticketsCount,
                        'statuses' => $ticketStatuses,
                        'priorities' => $ticketPriorities,
                    ],
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
