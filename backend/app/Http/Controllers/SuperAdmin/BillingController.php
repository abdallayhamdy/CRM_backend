<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class BillingController extends Controller
{
    private const PLAN_PRICES = [
        'starter' => 49,
        'pro' => 149,
        'enterprise' => 399,
    ];

    public function summary(): JsonResponse
    {
        $activeWorkspaces = DB::table('workspaces')
            ->whereNull('deleted_at')
            ->whereIn('status', ['active', 'trial', 'suspended'])
            ->select('id', 'plan', 'status')
            ->get();

        $payingWorkspaces = $activeWorkspaces->filter(fn ($ws) => $ws->status === 'active');

        $mrr = $payingWorkspaces->sum(fn ($ws) => self::PLAN_PRICES[$ws->plan] ?? 0);
        $arr = $mrr * 12;

        $activeTenantCount = $activeWorkspaces->count();

        $overdueInvoiceCount = DB::table('invoices')
            ->where('status', 'Overdue')
            ->count();

        $avgRevenuePerTenant = $activeTenantCount > 0
            ? round($mrr / $activeTenantCount, 2)
            : 0;

        return response()->json([
            'data' => [
                'mrr' => (int) $mrr,
                'arr' => (int) $arr,
                'overdue_invoice_count' => $overdueInvoiceCount,
                'avg_revenue_per_tenant' => (int) $avgRevenuePerTenant,
                'active_tenant_count' => $activeTenantCount,
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Invoice::with('workspace:id,company_name')
            ->orderByDesc('issued_date');

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $perPage = min((int) $request->input('limit', 50), 100);
        $paginator = $query->paginate($perPage);

        $data = $paginator->getCollection()->map(function (Invoice $invoice) {
            return [
                'id' => $invoice->id,
                'tenant_id' => $invoice->workspace_id,
                'tenant_name' => $invoice->workspace->company_name ?? 'Unknown',
                'amount' => (float) $invoice->amount,
                'status' => $invoice->status,
                'issued_date' => $invoice->issued_date->format('Y-m-d'),
                'due_date' => $invoice->due_date->format('Y-m-d'),
                'paid_date' => $invoice->paid_date?->format('Y-m-d'),
            ];
        })->values()->all();

        return response()->json([
            'data' => $data,
            'meta' => [
                'page' => $paginator->currentPage(),
                'limit' => $perPage,
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => 'required|uuid|exists:workspaces,id',
            'amount' => 'required|numeric|min:1',
            'issued_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:issued_date',
            'paid_date' => 'nullable|date',
        ]);

        $paidDate = $validated['paid_date'] ?? null;
        $status = $paidDate ? 'Paid' : 'Pending';

        $invoice = Invoice::create([
            'workspace_id' => $validated['tenant_id'],
            'amount' => $validated['amount'],
            'status' => $status,
            'issued_date' => $validated['issued_date'],
            'due_date' => $validated['due_date'],
            'paid_date' => $paidDate,
        ]);

        $invoice->load('workspace:id,company_name');

        return response()->json([
            'data' => [
                'id' => $invoice->id,
                'tenant_id' => $invoice->workspace_id,
                'tenant_name' => $invoice->workspace->company_name ?? 'Unknown',
                'amount' => (float) $invoice->amount,
                'status' => $invoice->status,
                'issued_date' => $invoice->issued_date->format('Y-m-d'),
                'due_date' => $invoice->due_date->format('Y-m-d'),
                'paid_date' => $invoice->paid_date?->format('Y-m-d'),
            ],
        ], 201);
    }

    public function markAsPaid(Invoice $invoice): JsonResponse
    {
        if ($invoice->status === 'Paid') {
            return response()->json(['message' => 'Invoice is already paid.'], 422);
        }

        $invoice->update([
            'status' => 'Paid',
            'paid_date' => now()->format('Y-m-d'),
        ]);

        $invoice->load('workspace:id,company_name');

        return response()->json([
            'data' => [
                'id' => $invoice->id,
                'tenant_id' => $invoice->workspace_id,
                'tenant_name' => $invoice->workspace->company_name ?? 'Unknown',
                'amount' => (float) $invoice->amount,
                'status' => $invoice->status,
                'issued_date' => $invoice->issued_date->format('Y-m-d'),
                'due_date' => $invoice->due_date->format('Y-m-d'),
                'paid_date' => $invoice->paid_date?->format('Y-m-d'),
            ],
        ]);
    }

    public function planDistribution(): JsonResponse
    {
        $activeWorkspaces = DB::table('workspaces')
            ->whereNull('deleted_at')
            ->whereIn('status', ['active', 'trial', 'suspended'])
            ->select('plan')
            ->get();

        $counts = $activeWorkspaces->groupBy('plan')->map(fn ($group) => $group->count());

        $data = [];
        foreach (self::PLAN_PRICES as $plan => $_price) {
            $label = match ($plan) {
                'starter' => 'Starter',
                'pro' => 'Pro',
                'enterprise' => 'Enterprise',
                default => $plan,
            };
            $data[] = [
                'plan' => $label,
                'count' => (int) ($counts[$plan] ?? 0),
            ];
        }

        return response()->json(['data' => $data]);
    }

    public function revenueTrend(): JsonResponse
    {
        $earliestWorkspace = DB::table('workspaces')
            ->whereNull('deleted_at')
            ->min('created_at');

        if (!$earliestWorkspace) {
            return response()->json(['data' => []]);
        }

        $start = Carbon::parse($earliestWorkspace)->startOfMonth();
        $end = Carbon::now()->endOfMonth();

        $workspaces = DB::table('workspaces')
            ->whereNull('deleted_at')
            ->select('id', 'plan', 'created_at', 'status')
            ->get()
            ->map(fn ($ws) => [
                'plan' => $ws->plan,
                'created_at' => Carbon::parse($ws->created_at),
                'status' => $ws->status,
            ]);

        $result = [];
        $current = $start->copy();

        while ($current->lte($end)) {
            $monthLabel = $current->format('M Y');
            $monthEnd = $current->copy()->endOfMonth();

            $mrr = $workspaces
                ->filter(fn ($ws) => $ws['created_at']->lte($monthEnd) && $ws['status'] === 'active')
                ->sum(fn ($ws) => self::PLAN_PRICES[$ws['plan']] ?? 0);

            $result[] = [
                'month' => $monthLabel,
                'mrr' => (int) $mrr,
            ];

            $current->addMonth();
        }

        return response()->json(['data' => $result]);
    }
}
