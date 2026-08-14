<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class UsageController extends Controller
{
    public function summary(): JsonResponse
    {
        $totalTenants = DB::table('workspaces')
            ->whereNull('deleted_at')
            ->count();

        $totalActiveUsers = DB::table('workspace_user')
            ->where('is_active', true)
            ->distinct('user_id')
            ->count('user_id');

        $churnedTenants = DB::table('workspaces')
            ->where('status', 'churned')
            ->whereNull('deleted_at')
            ->count();

        return response()->json([
            'data' => [
                'total_tenants' => $totalTenants,
                'total_active_users' => $totalActiveUsers,
                'avg_users_per_tenant' => $totalTenants > 0
                    ? (int) round($totalActiveUsers / $totalTenants)
                    : 0,
                'churn_rate' => $totalTenants > 0
                    ? (int) round($churnedTenants / $totalTenants * 100)
                    : 0,
            ],
        ]);
    }

    public function growth(): JsonResponse
    {
        $earliest = DB::table('workspaces')
            ->whereNull('deleted_at')
            ->min('created_at');

        if (!$earliest) {
            return response()->json(['data' => []]);
        }

        $quarters = $this->buildQuarterLabels($earliest);

        $workspaces = DB::table('workspaces')
            ->whereNull('deleted_at')
            ->select('created_at')
            ->get();

        $tenantsByQuarter = [];
        foreach ($workspaces as $ws) {
            $date = Carbon::parse($ws->created_at);
            $label = "Q{$date->quarter} {$date->year}";
            $tenantsByQuarter[$label] = ($tenantsByQuarter[$label] ?? 0) + 1;
        }

        $result = [];
        foreach ($quarters as $label) {
            $quarterEnd = $this->quarterLabelToDate($label)->endOfMonth();

            $activeUsers = DB::table('workspace_user')
                ->join('workspaces', 'workspaces.id', '=', 'workspace_user.workspace_id')
                ->where('workspace_user.is_active', true)
                ->whereNull('workspaces.deleted_at')
                ->where('workspace_user.created_at', '<=', $quarterEnd)
                ->distinct('workspace_user.user_id')
                ->count('workspace_user.user_id');

            $result[] = [
                'month' => $label,
                'new_tenants' => $tenantsByQuarter[$label] ?? 0,
                'total_active_users' => $activeUsers,
            ];
        }

        return response()->json(['data' => $result]);
    }

    public function tenantUsage(): JsonResponse
    {
        $thirtyDaysAgo = Carbon::now()->subDays(30);

        $usage = DB::table('audit_logs')
            ->join('workspaces', 'workspaces.id', '=', 'audit_logs.workspace_id')
            ->where('audit_logs.created_at', '>=', $thirtyDaysAgo)
            ->whereNull('workspaces.deleted_at')
            ->select(
                'workspaces.id as tenant_id',
                'workspaces.company_name as tenant_name',
                DB::raw('COUNT(*) as audit_events')
            )
            ->groupBy('workspaces.id', 'workspaces.company_name')
            ->orderByDesc('audit_events')
            ->get();

        return response()->json(['data' => $usage]);
    }

    public function featureAdoption(): JsonResponse
    {
        $activeTenantIds = DB::table('workspaces')
            ->whereNull('deleted_at')
            ->where('status', '!=', 'churned')
            ->pluck('id');

        if ($activeTenantIds->isEmpty()) {
            return response()->json(['data' => []]);
        }

        $activeTenantCount = $activeTenantIds->count();

        $features = [
            ['feature' => 'Contacts', 'table' => 'contacts', 'softDeletes' => true],
            ['feature' => 'Companies', 'table' => 'companies', 'softDeletes' => true],
            ['feature' => 'Deals Pipeline', 'table' => 'deals', 'softDeletes' => true],
            ['feature' => 'Tasks', 'table' => 'tasks', 'softDeletes' => false],
            ['feature' => 'Calls Log', 'table' => 'activities', 'softDeletes' => false, 'extra' => function ($query) {
                return $query->where('type', 'call');
            }],
            ['feature' => 'Documents', 'table' => 'documents', 'softDeletes' => false],
        ];

        $data = array_map(function ($feature) use ($activeTenantIds) {
            $query = DB::table($feature['table'])
                ->whereIn('workspace_id', $activeTenantIds)
                ->selectRaw('COUNT(DISTINCT workspace_id) as adopted');

            if ($feature['softDeletes']) {
                $query->whereNull('deleted_at');
            }

            if (isset($feature['extra'])) {
                $feature['extra']($query);
            }

            $adopted = $query->value('adopted');

            return [
                'feature' => $feature['feature'],
                'adopted' => (int) $adopted,
                'total' => $activeTenantIds->count(),
            ];
        }, $features);

        return response()->json(['data' => $data]);
    }

    private function buildQuarterLabels(string $fromDate): array
    {
        $start = Carbon::parse($fromDate)->startOfMonth();
        $end = Carbon::now()->endOfMonth();

        $labels = [];
        $current = $start->copy();

        while ($current->lte($end)) {
            $labels[] = "Q{$current->quarter} {$current->year}";
            $current->addMonths(3)->startOfMonth();
        }

        return array_values(array_unique($labels));
    }

    private function quarterLabelToDate(string $label): Carbon
    {
        $parts = explode(' ', $label);
        $year = (int) $parts[1];
        $quarter = (int) str_replace('Q', '', $parts[0]);
        $month = ($quarter - 1) * 3 + 1;

        return Carbon::createFromDate($year, $month, 1);
    }
}
