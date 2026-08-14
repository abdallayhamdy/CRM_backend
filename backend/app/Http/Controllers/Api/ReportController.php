<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Task;
use App\Models\Ticket;
use App\Models\Activity;
use App\Models\Order;
use App\Models\OrderLineItem;
use App\Models\Product;
use App\Models\User;
use App\Models\PipelineStage;
use Carbon\Carbon;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ReportController extends Controller
{
    use AuthorizesRequests;
    private function getDateRange(Request $request): array
    {
        $from = $request->input('from');
        $to = $request->input('to');
        return [
            'from' => $from ? Carbon::parse($from) : null,
            'to' => $to ? Carbon::parse($to) : null,
        ];
    }

    private function applyDateFilter($query, string $column, ?Carbon $from, ?Carbon $to)
    {
        if ($from) $query->where($column, '>=', $from);
        if ($to) $query->where($column, '<=', $to);
        return $query;
    }

    /**
     * Determine current and previous time periods.
     * If dateRange is provided, previous is the same length before from.
     * Otherwise default to this-month vs last-month.
     */
    private function getTrendPeriods(?Carbon $from, ?Carbon $to): array
    {
        $now = Carbon::now();
        if ($from && $to) {
            $duration = $from->diffInSeconds($to);
            $prevFrom = $from->copy()->subSeconds($duration);
            $prevTo = $from->copy()->subSecond();
            return [
                'currentFrom' => $from, 'currentTo' => $to,
                'prevFrom' => $prevFrom, 'prevTo' => $prevTo,
            ];
        }
        // default: this month vs last month
        return [
            'currentFrom' => $now->copy()->startOfMonth(),
            'currentTo' => $now,
            'prevFrom' => $now->copy()->subMonth()->startOfMonth(),
            'prevTo' => $now->copy()->subMonth()->endOfMonth(),
        ];
    }

    private function makeKpi(string $title, $value, string $formatted, $prevValue, string $valueType, string $icon, bool $invert = false): array
    {
        $pct = $this->calcTrendPct($value, $prevValue);
        $trendUp = $invert ? $pct <= 0 : $pct >= 0;
        return [
            'title' => $title,
            'value' => $formatted,
            'previousValue' => $this->formatKpiValue($prevValue, $valueType),
            'trend' => $this->trendText($value, $prevValue, $valueType),
            'trendPct' => $pct,
            'trendUp' => $trendUp,
            'icon' => $icon,
        ];
    }

    private function calcTrendPct($current, $previous): float
    {
        $c = is_numeric($current) ? (float) $current : 0;
        $p = is_numeric($previous) ? (float) $previous : 0;
        if ($p == 0) return $c > 0 ? 100 : 0;
        return round((($c - $p) / $p) * 100, 1);
    }

    private function formatKpiValue($value, string $type): string
    {
        if (!is_numeric($value)) return (string) $value;
        return match ($type) {
            'currency' => $this->formatCurrency((float) $value),
            'percent' => round((float) $value) . '%',
            default => (string) round((float) $value),
        };
    }

    public function executive(Request $request)
    {
        $this->authorize('view_reports');
        $currentPeriod = $request->input('period', 'this_month');
        $now = Carbon::now();

        $periodStart = match ($currentPeriod) {
            'this_month' => $now->copy()->startOfMonth(),
            'this_quarter' => $now->copy()->startOfQuarter(),
            'this_year' => $now->copy()->startOfYear(),
            'last_month' => $now->copy()->subMonth()->startOfMonth(),
            'last_quarter' => $now->copy()->subQuarter()->startOfQuarter(),
            'last_year' => $now->copy()->subYear()->startOfYear(),
            default => $now->copy()->startOfMonth(),
        };
        $periodEnd = match ($currentPeriod) {
            'last_month' => $now->copy()->subMonth()->endOfMonth(),
            'last_quarter' => $now->copy()->subQuarter()->endOfQuarter(),
            'last_year' => $now->copy()->subYear()->endOfYear(),
            default => $now,
        };
        $prevPeriodStart = match ($currentPeriod) {
            'this_month' => $now->copy()->subMonth()->startOfMonth(),
            'this_quarter' => $now->copy()->subQuarter()->startOfQuarter(),
            'this_year' => $now->copy()->subYear()->startOfYear(),
            'last_month' => $now->copy()->subMonths(2)->startOfMonth(),
            'last_quarter' => $now->copy()->subQuarters(2)->startOfQuarter(),
            'last_year' => $now->copy()->subYears(2)->startOfYear(),
            default => $now->copy()->subMonth()->startOfMonth(),
        };
        $prevPeriodEnd = match ($currentPeriod) {
            'last_month' => $now->copy()->subMonths(2)->endOfMonth(),
            'last_quarter' => $now->copy()->subQuarters(2)->endOfQuarter(),
            'last_year' => $now->copy()->subYears(2)->endOfYear(),
            default => $periodStart->copy()->subDay(),
        };

        $revenue = (float) Deal::where('status', 'won')->whereBetween('updated_at', [$periodStart, $periodEnd])->sum('amount');
        $revenuePrev = (float) Deal::where('status', 'won')->whereBetween('updated_at', [$prevPeriodStart, $prevPeriodEnd])->sum('amount');

        $dealsCount = Deal::whereBetween('created_at', [$periodStart, $periodEnd])->count();
        $dealsPrev = Deal::whereBetween('created_at', [$prevPeriodStart, $prevPeriodEnd])->count();

        $openTickets = Ticket::whereIn('status', ['open', 'pending'])->whereBetween('created_at', [$periodStart, $periodEnd])->count();
        $openTicketsPrev = Ticket::whereIn('status', ['open', 'pending'])->whereBetween('created_at', [$prevPeriodStart, $prevPeriodEnd])->count();

        $totalTasks = Task::whereBetween('created_at', [$periodStart, $periodEnd])->count();
        $completedTasks = Task::where('status', 'completed')->whereBetween('updated_at', [$periodStart, $periodEnd])->count();
        $completionRate = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0;
        $totalTasksPrev = Task::whereBetween('created_at', [$prevPeriodStart, $prevPeriodEnd])->count();
        $completedTasksPrev = Task::where('status', 'completed')->whereBetween('updated_at', [$prevPeriodStart, $prevPeriodEnd])->count();
        $completionRatePrev = $totalTasksPrev > 0 ? round(($completedTasksPrev / $totalTasksPrev) * 100) : 0;

        $trendUpRev = $revenue >= $revenuePrev;
        $trendUpDeals = $dealsCount >= $dealsPrev;
        $trendUpTickets = $openTickets <= $openTicketsPrev;
        $trendUpTasks = $completionRate >= $completionRatePrev;

        $kpis = [
            [
                'title' => 'Total Revenue',
                'value' => $this->formatCurrency($revenue),
                'previousValue' => $this->formatCurrency($revenuePrev),
                'trend' => $this->trendText($revenue, $revenuePrev, 'revenue'),
                'trendPct' => $this->calcTrendPct($revenue, $revenuePrev),
                'trendUp' => $trendUpRev,
                'icon' => 'DollarSign',
            ],
            [
                'title' => 'Total Deals',
                'value' => (string) $dealsCount,
                'previousValue' => (string) $dealsPrev,
                'trend' => $this->trendText($dealsCount, $dealsPrev, 'count'),
                'trendPct' => $this->calcTrendPct($dealsCount, $dealsPrev),
                'trendUp' => $trendUpDeals,
                'icon' => 'Handshake',
            ],
            [
                'title' => 'Open Tickets',
                'value' => (string) $openTickets,
                'previousValue' => (string) $openTicketsPrev,
                'trend' => $this->trendText($openTickets, $openTicketsPrev, 'count', true),
                'trendPct' => $this->calcTrendPct($openTickets, $openTicketsPrev),
                'trendUp' => $trendUpTickets,
                'icon' => 'TicketCheck',
            ],
            [
                'title' => 'Tasks Completed',
                'value' => $completionRate . '%',
                'previousValue' => $completionRatePrev . '%',
                'trend' => $this->trendText($completionRate, $completionRatePrev, 'percent'),
                'trendPct' => $this->calcTrendPct($completionRate, $completionRatePrev),
                'trendUp' => $trendUpTasks,
                'icon' => 'CheckSquare',
            ],
        ];

        // Performance trend
        $ticketsResolvedByMonth = Ticket::query()
            ->whereIn('status', ['resolved', 'closed'])
            ->where('updated_at', '>=', $now->copy()->subMonths(12)->startOfMonth())
            ->selectRaw("DATE_FORMAT(updated_at, '%Y-%m') as month, COUNT(*) as total")
            ->groupBy(DB::raw("DATE_FORMAT(updated_at, '%Y-%m')"))
            ->pluck('total', 'month');

        $performanceTrend = Deal::select(
            DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
            DB::raw('SUM(CASE WHEN status = "won" THEN amount ELSE 0 END) as revenue'),
            DB::raw('COUNT(CASE WHEN status = "won" THEN 1 END) as dealsClosed'),
        )
            ->where('created_at', '>=', $now->copy()->subMonths(12)->startOfMonth())
            ->groupBy(DB::raw("DATE_FORMAT(created_at, '%Y-%m')"))
            ->orderBy('month')
            ->get()
            ->map(function ($row) use ($ticketsResolvedByMonth) {
                $month = Carbon::parse($row->month . '-01');
                return [
                    'month' => $month->format('M'),
                    'revenue' => (float) $row->revenue,
                    'dealsClosed' => (int) $row->dealsClosed,
                    'ticketsResolved' => (int) ($ticketsResolvedByMonth[$row->month] ?? 0),
                ];
            })
            ->values();

        // Period comparison
        $calcTrend = fn($c, $p) => $p > 0 ? round((($c - $p) / $p) * 100) : 0;
        $periodComparison = [
            [
                'metric' => 'Revenue',
                'current' => $this->formatCurrency($revenue),
                'previous' => $this->formatCurrency($revenuePrev),
                'delta' => $calcTrend($revenue, $revenuePrev),
                'deltaUp' => $trendUpRev,
            ],
            [
                'metric' => 'Deals Closed',
                'current' => (string) $dealsCount,
                'previous' => (string) $dealsPrev,
                'delta' => $calcTrend($dealsCount, $dealsPrev),
                'deltaUp' => $trendUpDeals,
            ],
            [
                'metric' => 'Open Tickets',
                'current' => (string) $openTickets,
                'previous' => (string) $openTicketsPrev,
                'delta' => $calcTrend($openTickets, $openTicketsPrev),
                'deltaUp' => $trendUpTickets,
            ],
            [
                'metric' => 'Tasks Completed',
                'current' => $completionRate . '%',
                'previous' => $completionRatePrev . '%',
                'delta' => $calcTrend($completionRate, $completionRatePrev),
                'deltaUp' => $trendUpTasks,
            ],
        ];

        return response()->json([
            'status' => 'success',
            'data' => compact('kpis', 'performanceTrend', 'periodComparison'),
        ]);
    }

    public function sales(Request $request)
    {
        $this->authorize('view_reports');
        $dr = $this->getDateRange($request);
        $tp = $this->getTrendPeriods($dr['from'], $dr['to']);
        $now = Carbon::now();
        $stages = $this->parseCommaParam($request->input('stages'));
        $reps = $this->parseCommaParam($request->input('reps'));

        // Resolve rep IDs if names provided
        $repIds = null;
        if ($reps) {
            $repIds = User::whereIn('name', $reps)->where('workspace_id', $request->user()->workspace_id)->pluck('id')->toArray();
        }

        // Pipeline overview
        $pipelineQuery = Deal::select('pipeline_stage_id', DB::raw('count(*) as count'), DB::raw('sum(amount) as value'))
            ->whereNotNull('pipeline_stage_id');
        $this->applyDateFilter($pipelineQuery, 'created_at', $dr['from'], $dr['to']);
        if ($stages) {
            $pipelineQuery->whereHas('pipelineStage', fn($q) => $q->whereIn('name', $stages));
        }
        if ($repIds) {
            $pipelineQuery->whereIn('assigned_to', $repIds);
        }
        $pipelineData = $pipelineQuery->groupBy('pipeline_stage_id')->get();

        $pipelineStages = PipelineStage::whereIn(
            'id',
            $pipelineData->pluck('pipeline_stage_id')->filter()->all(),
        )->get()->keyBy('id');

        $pipelineData = $pipelineData->map(function ($row) use ($pipelineStages) {
            $stage = $pipelineStages->get($row->pipeline_stage_id);
            return ['stage' => $stage?->name ?? 'Unknown', 'count' => (int) $row->count, 'value' => (float) $row->value];
        });

        // Win/Loss
        $wonQ = Deal::where('status', 'won')->when($dr['from'], fn($q) => $q->where('created_at', '>=', $dr['from']))->when($dr['to'], fn($q) => $q->where('created_at', '<=', $dr['to']));
        $lostQ = Deal::where('status', 'lost')->when($dr['from'], fn($q) => $q->where('created_at', '>=', $dr['from']))->when($dr['to'], fn($q) => $q->where('created_at', '<=', $dr['to']));
        if ($repIds) { $wonQ->whereIn('assigned_to', $repIds); $lostQ->whereIn('assigned_to', $repIds); }
        $won = (int) $wonQ->count();
        $lost = (int) $lostQ->count();
        $totalWonLost = $won + $lost;
        $winRate = $totalWonLost > 0 ? round(($won / $totalWonLost) * 100) : 0;
        $winLossData = [['name' => 'Won', 'value' => $winRate], ['name' => 'Lost', 'value' => 100 - $winRate]];

        // Sales by Rep
        $repQuery = Deal::select('assigned_to', DB::raw('count(*) as deals'), DB::raw('sum(amount) as revenue'))
            ->whereNotNull('assigned_to');
        $this->applyDateFilter($repQuery, 'created_at', $dr['from'], $dr['to']);
        if ($repIds) {
            $repQuery->whereIn('assigned_to', $repIds);
        }
        $salesByRep = $repQuery->groupBy('assigned_to')->get();

        $repUsers = User::whereIn(
            'id',
            $salesByRep->pluck('assigned_to')->filter()->all(),
        )->get()->keyBy('id');

        $salesByRep = $salesByRep->map(function ($row) use ($repUsers) {
            $user = $repUsers->get($row->assigned_to);
            return ['name' => $user?->name ?? 'Unknown', 'deals' => (int) $row->deals, 'revenue' => (float) $row->revenue];
        })->sortByDesc('revenue')->values();

        // Revenue Forecast
        $actualMonthsQ = Deal::select(
            DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
            DB::raw('SUM(CASE WHEN status = "won" THEN amount ELSE 0 END) as actual'),
            DB::raw('SUM(CASE WHEN status = "open" THEN amount ELSE 0 END) as forecast'),
        )->where('created_at', '>=', $now->copy()->subMonths(6)->startOfMonth());
        if ($repIds) $actualMonthsQ->whereIn('assigned_to', $repIds);
        $actualMonths = $actualMonthsQ->groupBy(DB::raw("DATE_FORMAT(created_at, '%Y-%m')"))->orderBy('month')->get()
            ->map(fn($row) => ['month' => Carbon::parse($row->month . '-01')->format('M'), 'actual' => $row->actual > 0 ? (float) $row->actual : null, 'forecast' => $row->forecast > 0 ? (float) $row->forecast : null])
            ->values();

        // Sales Trends monthly
        $currentYearMonthsQ = Deal::select(DB::raw("DATE_FORMAT(created_at, '%Y-%m') as period"), DB::raw('SUM(amount) as current'))
            ->where('status', 'won')->where('created_at', '>=', $now->copy()->startOfYear());
        $prevYearMonthsQ = Deal::select(DB::raw("DATE_FORMAT(created_at, '%Y-%m') as period"), DB::raw('SUM(amount) as previous'))
            ->where('status', 'won')->where('created_at', '>=', $now->copy()->subYear()->startOfYear())->where('created_at', '<', $now->copy()->startOfYear());
        if ($repIds) { $currentYearMonthsQ->whereIn('assigned_to', $repIds); $prevYearMonthsQ->whereIn('assigned_to', $repIds); }
        $currentYearMonths = $currentYearMonthsQ->groupBy('period')->orderBy('period')->get()->keyBy('period');
        $prevYearMonths = $prevYearMonthsQ->groupBy('period')->orderBy('period')->get()->keyBy('period');
        $salesTrendsMonthly = [];
        for ($i = 0; $i < 6; $i++) {
            $m = $now->copy()->subMonths(5 - $i);
            $k = $m->format('Y-m');
            $pk = $m->copy()->subYear()->format('Y-m');
            $salesTrendsMonthly[] = ['period' => $m->format('M'), 'current' => (float) ($currentYearMonths[$k]->current ?? 0), 'previous' => (float) ($prevYearMonths[$pk]->previous ?? 0)];
        }

        // Sales Trends quarterly
        $currentQuarterlyQ = Deal::select(DB::raw("CONCAT(YEAR(created_at), '-Q', QUARTER(created_at)) as period"), DB::raw('SUM(amount) as current'))
            ->where('status', 'won')->where('created_at', '>=', $now->copy()->subYears(2)->startOfYear());
        $prevQuarterlyQ = Deal::select(DB::raw("CONCAT(YEAR(created_at), '-Q', QUARTER(created_at)) as period"), DB::raw('SUM(amount) as previous'))
            ->where('status', 'won')->where('created_at', '>=', $now->copy()->subYears(3)->startOfYear())->where('created_at', '<', $now->copy()->subYears(1)->startOfYear());
        if ($repIds) { $currentQuarterlyQ->whereIn('assigned_to', $repIds); $prevQuarterlyQ->whereIn('assigned_to', $repIds); }
        $currentQuarterly = $currentQuarterlyQ->groupBy('period')->orderBy('period')->get()->keyBy('period');
        $prevQuarterly = $prevQuarterlyQ->groupBy('period')->orderBy('period')->get()->keyBy('period');
        $salesTrendsQuarterly = [];
        for ($i = 0; $i < 4; $i++) {
            $q = $now->copy()->subQuarters(3 - $i)->startOfQuarter();
            $k = $q->year . '-Q' . $q->quarter;
            $pk = $q->copy()->subYear()->year . '-Q' . $q->quarter;
            $salesTrendsQuarterly[] = ['period' => 'Q' . $q->quarter . ' ' . $q->year, 'current' => (float) ($currentQuarterly[$k]->current ?? 0), 'previous' => (float) ($prevQuarterly[$pk]->previous ?? 0)];
        }

        // ── KPIs with REAL trends ──
        $revYtdQ = Deal::where('status', 'won')->whereBetween('created_at', [$now->copy()->startOfYear(), $now->copy()->endOfYear()]);
        $revYtdPrevQ = Deal::where('status', 'won')->whereBetween('created_at', [$now->copy()->subYear()->startOfYear(), $now->copy()->subYear()->endOfYear()]);
        if ($repIds) { $revYtdQ->whereIn('assigned_to', $repIds); $revYtdPrevQ->whereIn('assigned_to', $repIds); }
        $revYtd = (float) $revYtdQ->sum('amount');
        $revYtdPrev = (float) $revYtdPrevQ->sum('amount');

        // Win Rate current vs previous period
        $wonPrevQ = Deal::where('status', 'won')->whereBetween('created_at', [$tp['prevFrom'], $tp['prevTo']]);
        $lostPrevQ = Deal::where('status', 'lost')->whereBetween('created_at', [$tp['prevFrom'], $tp['prevTo']]);
        if ($repIds) { $wonPrevQ->whereIn('assigned_to', $repIds); $lostPrevQ->whereIn('assigned_to', $repIds); }
        $wonPrev = (int) $wonPrevQ->count();
        $lostPrev = (int) $lostPrevQ->count();
        $winPctPrev = ($wonPrev + $lostPrev) > 0 ? round(($wonPrev / ($wonPrev + $lostPrev)) * 100) : 0;

        // Active Pipeline current vs previous
        $pipelineValQ = Deal::where('status', 'open');
        $pipelineValPrevQ = Deal::where('status', 'open')->where('created_at', '<', $tp['currentFrom']);
        if ($repIds) { $pipelineValQ->whereIn('assigned_to', $repIds); $pipelineValPrevQ->whereIn('assigned_to', $repIds); }
        $pipelineVal = (float) $pipelineValQ->sum('amount');
        $pipelineValPrev = (float) $pipelineValPrevQ->sum('amount');

        // Deals Closed MTD vs last month
        $closedMtdQ = Deal::where('status', 'won')->whereBetween('created_at', [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()]);
        $closedLastMQ = Deal::where('status', 'won')->whereBetween('created_at', [$now->copy()->subMonth()->startOfMonth(), $now->copy()->subMonth()->endOfMonth()]);
        if ($repIds) { $closedMtdQ->whereIn('assigned_to', $repIds); $closedLastMQ->whereIn('assigned_to', $repIds); }
        $closedMtd = $closedMtdQ->count();
        $closedLastM = $closedLastMQ->count();

        $kpis = [
            $this->makeKpi('Total Revenue (YTD)', $revYtd, $this->formatCurrency($revYtd), $revYtdPrev, 'currency', 'DollarSign'),
            $this->makeKpi('Win Rate', $winRate, $winRate . '%', $winPctPrev, 'percent', 'Target'),
            $this->makeKpi('Active Pipeline', $pipelineVal, $this->formatCurrency($pipelineVal), $pipelineValPrev, 'currency', 'TrendingUp'),
            $this->makeKpi('Deals Closed (MTD)', $closedMtd, (string) $closedMtd, $closedLastM, 'count', 'Handshake'),
        ];

        return response()->json([
            'status' => 'success',
            'data' => compact('pipelineData', 'winLossData', 'winRate', 'salesByRep', 'actualMonths', 'salesTrendsMonthly', 'salesTrendsQuarterly', 'kpis'),
        ]);
    }

    public function customers(Request $request)
    {
        $this->authorize('view_reports');
        $dr = $this->getDateRange($request);
        $tp = $this->getTrendPeriods($dr['from'], $dr['to']);
        $now = Carbon::now();

        // New customers over time
        $contactsByMonth = Contact::select(DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"), DB::raw('count(*) as count'))
            ->where('created_at', '>=', $now->copy()->subMonths(12)->startOfMonth())
            ->groupBy('month')->orderBy('month')->get()->keyBy('month');
        $newCustomers = [];
        for ($i = 11; $i >= 0; $i--) {
            $m = $now->copy()->subMonths($i);
            $k = $m->format('Y-m');
            $newCustomers[] = ['month' => $m->format('M'), 'count' => (int) ($contactsByMonth[$k]->count ?? 0)];
        }

        // Lead sources
        $leadSources = Activity::select('type', DB::raw('count(*) as value'))
            ->where('activitable_type', Contact::class)
            ->when($dr['from'], fn($q) => $q->where('created_at', '>=', $dr['from']))
            ->when($dr['to'], fn($q) => $q->where('created_at', '<=', $dr['to']))
            ->groupBy('type')->orderByDesc('value')->get()
            ->map(fn($r) => ['name' => ucfirst($r->type), 'value' => (int) $r->value]);
        if ($leadSources->isEmpty()) $leadSources = collect([['name' => 'No source data tracked', 'value' => 100]]);

        // Top accounts
        $topAccounts = Company::withSum(['deals' => fn($q) => $q->where('status', 'won')], 'amount')
            ->withCount(['deals' => fn($q) => $q->where('status', 'won')])
            ->has('deals')
            ->when($dr['from'], fn($q) => $q->where('created_at', '>=', $dr['from']))
            ->when($dr['to'], fn($q) => $q->where('created_at', '<=', $dr['to']))
            ->get()->sortByDesc('deals_sum_amount')->take(7)->values()
            ->map(fn($c) => ['name' => $c->name, 'revenue' => (float) ($c->deals_sum_amount ?? 0), 'deals' => (int) $c->deals_count]);

        // ── KPIs with REAL trends ──
        $newMtd = Contact::whereBetween('created_at', [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()])->count();
        $newPrev = Contact::whereBetween('created_at', [$now->copy()->subMonth()->startOfMonth(), $now->copy()->subMonth()->endOfMonth()])->count();

        $avgDeal = (float) Deal::where('status', 'won')->avg('amount') ?? 0;
        $avgDealPrev = (float) Deal::where('status', 'won')->where('created_at', '<', $tp['currentFrom'])->avg('amount') ?? 0;

        $totalCompanies = Company::count();
        $totalCompaniesPrev = Company::where('created_at', '<', $tp['currentFrom'])->count();

        $kpis = [
            $this->makeKpi('New Customers (MTD)', $newMtd, (string) $newMtd, $newPrev, 'count', 'UserPlus'),
            $this->makeKpi('Avg Deal Size', $avgDeal, $this->formatCurrency($avgDeal), $avgDealPrev, 'currency', 'Calculator'),
            $this->makeKpi('Total Companies', $totalCompanies, (string) $totalCompanies, $totalCompaniesPrev, 'count', 'Building'),
        ];

        return response()->json([
            'status' => 'success',
            'data' => compact('newCustomers', 'leadSources', 'topAccounts', 'kpis'),
        ]);
    }

    public function orders(Request $request)
    {
        $this->authorize('view_reports');
        $dr = $this->getDateRange($request);
        $tp = $this->getTrendPeriods($dr['from'], $dr['to']);
        $products = $this->parseCommaParam($request->input('products'));

        // Top products
        $topProductsQ = OrderLineItem::select('product_id', 'name', DB::raw('SUM(quantity) as units'), DB::raw('SUM(total) as revenue'))
            ->whereHas('order', function ($q) use ($dr) {
                if ($dr['from']) $q->where('created_at', '>=', $dr['from']);
                if ($dr['to']) $q->where('created_at', '<=', $dr['to']);
            });
        if ($products) {
            $topProductsQ->whereIn('name', $products);
        }
        $topProducts = $topProductsQ->groupBy('product_id', 'name')->orderByDesc('revenue')->take(6)->get()
            ->map(fn($r) => ['name' => $r->name, 'units' => (int) $r->units, 'revenue' => (float) $r->revenue]);

        $orderIdsFiltered = null;
        if ($products) {
            $orderIdsFiltered = OrderLineItem::whereHas('order')->whereIn('name', $products)->pluck('order_id')->toArray();
        }

        // Order trends
        $now = Carbon::now();
        $orderTrendsQ = Order::select(DB::raw("DATE_FORMAT(created_at, '%Y-%u') as week_num"), DB::raw('MIN(created_at) as week_start'), DB::raw('count(*) as orders'))
            ->where('created_at', '>=', $now->copy()->subWeeks(8)->startOfWeek());
        $this->applyDateFilter($orderTrendsQ, 'created_at', $dr['from'], $dr['to']);
        if ($products) {
            $orderTrendsQ->whereIn('id', $orderIdsFiltered);
        }
        $orderTrends = $orderTrendsQ->groupBy('week_num')->orderBy('week_num')->get()
            ->map(fn($r) => ['period' => 'Week ' . Carbon::parse($r->week_start)->weekOfYear, 'orders' => (int) $r->orders]);

        // AOV sparkline
        $aovQ = Order::select(DB::raw("DATE_FORMAT(created_at, '%Y-%m') as period"), DB::raw('AVG(total) as avg_value'))
            ->where('created_at', '>=', $now->copy()->subMonths(8)->startOfMonth())
            ->when($dr['from'], fn($q) => $q->where('created_at', '>=', $dr['from']))
            ->when($dr['to'], fn($q) => $q->where('created_at', '<=', $dr['to']));
        if ($products) {
            $aovQ->whereIn('id', $orderIdsFiltered);
        }
        $aovSparkline = $aovQ->groupBy('period')->orderBy('period')->get()->pluck('avg_value')
            ->map(fn($v) => round((float) $v, 2))->values();

        // ── KPIs with REAL trends ──
        $totalOrdersQ = Order::when($dr['from'], fn($q) => $q->where('created_at', '>=', $dr['from']))
            ->when($dr['to'], fn($q) => $q->where('created_at', '<=', $dr['to']));
        $totalOrdersPrevQ = Order::whereBetween('created_at', [$tp['prevFrom'], $tp['prevTo']]);
        if ($products) {
            $totalOrdersQ->whereIn('id', $orderIdsFiltered);
            $totalOrdersPrevQ->whereIn('id', $orderIdsFiltered);
        }
        $totalOrders = $totalOrdersQ->count();
        $totalOrdersPrev = $totalOrdersPrevQ->count();

        $avgValQ = Order::when($dr['from'], fn($q) => $q->where('created_at', '>=', $dr['from']))
            ->when($dr['to'], fn($q) => $q->where('created_at', '<=', $dr['to']));
        $avgValPrevQ = Order::whereBetween('created_at', [$tp['prevFrom'], $tp['prevTo']]);
        if ($products) {
            $avgValQ->whereIn('id', $orderIdsFiltered);
            $avgValPrevQ->whereIn('id', $orderIdsFiltered);
        }
        $avgVal = (float) ($avgValQ->avg('total') ?? 0);
        $avgValPrev = (float) ($avgValPrevQ->avg('total') ?? 0);

        $revPerProd = (float) (OrderLineItem::select(DB::raw('AVG(total) as avg_rev'))
            ->whereHas('order', function ($q) use ($dr) {
                if ($dr['from']) $q->where('created_at', '>=', $dr['from']);
                if ($dr['to']) $q->where('created_at', '<=', $dr['to']);
            })
            ->first()->avg_rev ?? 0);
        $revPerProdPrev = (float) (OrderLineItem::select(DB::raw('AVG(total) as avg_rev'))
            ->whereHas('order', fn($oq) => $oq->whereBetween('created_at', [$tp['prevFrom'], $tp['prevTo']]))
            ->first()->avg_rev ?? 0);

        $kpis = [
            $this->makeKpi('Total Orders', $totalOrders, (string) $totalOrders, $totalOrdersPrev, 'count', 'ShoppingCart'),
            $this->makeKpi('Avg Order Value', $avgVal, $this->formatCurrency($avgVal), $avgValPrev, 'currency', 'Receipt'),
            $this->makeKpi('Avg Revenue per Product', $revPerProd, $this->formatCurrency($revPerProd), $revPerProdPrev, 'currency', 'Package'),
        ];

        return response()->json([
            'status' => 'success',
            'data' => compact('topProducts', 'orderTrends', 'aovSparkline', 'kpis'),
        ]);
    }

    public function tickets(Request $request)
    {
        $this->authorize('view_reports');
        $dr = $this->getDateRange($request);
        $tp = $this->getTrendPeriods($dr['from'], $dr['to']);
        $now = Carbon::now();
        $priorities = $this->parseCommaParam($request->input('priorities'));
        $types = $this->parseCommaParam($request->input('types'));
        // Normalize type casing (frontend sends "Open", "Pending", etc.)
        $types = $types ? array_map('strtolower', $types) : null;

        // Ticket volume
        $volumeQ = Ticket::select(DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"), DB::raw('COUNT(*) as opened'))
            ->where('created_at', '>=', $now->copy()->subMonths(6)->startOfMonth());
        $resolvedQ = Ticket::select(DB::raw("DATE_FORMAT(updated_at, '%Y-%m') as month"), DB::raw('COUNT(*) as resolved'))
            ->whereIn('status', ['resolved', 'closed'])->where('updated_at', '>=', $now->copy()->subMonths(6)->startOfMonth());
        if ($priorities) { $volumeQ->whereIn('priority', $priorities); $resolvedQ->whereIn('priority', $priorities); }
        if ($types) { $volumeQ->whereIn('status', $types); $resolvedQ->whereIn('status', $types); }
        $volumeByMonth = $volumeQ->groupBy('month')->orderBy('month')->get()->keyBy('month');
        $resolvedByMonth = $resolvedQ->groupBy('month')->orderBy('month')->get()->keyBy('month');
        $ticketVolume = [];
        for ($i = 5; $i >= 0; $i--) {
            $m = $now->copy()->subMonths($i);
            $k = $m->format('Y-m');
            $ticketVolume[] = ['month' => $m->format('M'), 'opened' => (int) ($volumeByMonth[$k]->opened ?? 0), 'resolved' => (int) ($resolvedByMonth[$k]->resolved ?? 0)];
        }

        // Tickets by status
        $ticketsByTypeQ = Ticket::select('status', DB::raw('count(*) as count'))
            ->when($dr['from'], fn($q) => $q->where('created_at', '>=', $dr['from']))
            ->when($dr['to'], fn($q) => $q->where('created_at', '<=', $dr['to']));
        if ($priorities) $ticketsByTypeQ->whereIn('priority', $priorities);
        if ($types) $ticketsByTypeQ->whereIn('status', $types);
        $ticketsByType = $ticketsByTypeQ->groupBy('status')->orderByDesc('count')->get()
            ->map(fn($r) => ['type' => ucfirst($r->status), 'count' => (int) $r->count]);

        // Tickets by priority
        $priorityByMonthQ = Ticket::select(DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
            DB::raw("SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as low"),
            DB::raw("SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as medium"),
            DB::raw("SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high"),
            DB::raw("SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent"),
        )->where('created_at', '>=', $now->copy()->subMonths(6)->startOfMonth());
        if ($types) $priorityByMonthQ->whereIn('status', $types);
        $priorityByMonth = $priorityByMonthQ->groupBy('month')->orderBy('month')->get()->keyBy('month');
        $ticketsByPriority = [];
        for ($i = 5; $i >= 0; $i--) {
            $m = $now->copy()->subMonths($i);
            $k = $m->format('Y-m');
            $r = $priorityByMonth[$k] ?? null;
            $ticketsByPriority[] = ['month' => $m->format('M'), 'low' => (int) ($r->low ?? 0), 'medium' => (int) ($r->medium ?? 0), 'high' => (int) ($r->high ?? 0), 'urgent' => (int) ($r->urgent ?? 0)];
        }

        // ── KPIs with REAL trends ──
        $openTicketsQ = Ticket::whereIn('status', ['open', 'pending'])
            ->when($dr['from'], fn($q) => $q->where('created_at', '>=', $dr['from']))
            ->when($dr['to'], fn($q) => $q->where('created_at', '<=', $dr['to']));
        $openTicketsPrevQ = Ticket::whereIn('status', ['open', 'pending'])->whereBetween('created_at', [$tp['prevFrom'], $tp['prevTo']]);
        if ($priorities) { $openTicketsQ->whereIn('priority', $priorities); $openTicketsPrevQ->whereIn('priority', $priorities); }
        $openTickets = $openTicketsQ->count();
        $openTicketsPrev = $openTicketsPrevQ->count();

        $resolvedMtdQ = Ticket::whereIn('status', ['resolved', 'closed'])
            ->whereBetween('updated_at', [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()]);
        $resolvedPrevQ = Ticket::whereIn('status', ['resolved', 'closed'])
            ->whereBetween('updated_at', [$now->copy()->subMonth()->startOfMonth(), $now->copy()->subMonth()->endOfMonth()]);
        if ($priorities) { $resolvedMtdQ->whereIn('priority', $priorities); $resolvedPrevQ->whereIn('priority', $priorities); }
        $resolvedMtd = $resolvedMtdQ->count();
        $resolvedPrev = $resolvedPrevQ->count();

        // Avg resolution time in hours for resolved/closed tickets
        $avgResQ = Ticket::whereIn('status', ['resolved', 'closed'])
            ->whereNotNull('updated_at')
            ->select(DB::raw('AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avg_hrs'));
        $avgResPrevQ = Ticket::whereIn('status', ['resolved', 'closed'])
            ->where('updated_at', '<', $tp['currentFrom'])
            ->select(DB::raw('AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avg_hrs'));
        if ($priorities) { $avgResQ->whereIn('priority', $priorities); $avgResPrevQ->whereIn('priority', $priorities); }
        $avgResRaw = $avgResQ->value('avg_hrs');
        $avgResHrs = $avgResRaw !== null ? (float) $avgResRaw : -1;
        $avgResRawPrev = $avgResPrevQ->value('avg_hrs');
        $avgResHrsPrev = $avgResRawPrev !== null ? (float) $avgResRawPrev : -1;

        $kpis = [
            $this->makeKpi('Avg Resolution Time', $avgResHrs, $avgResHrs >= 0 ? round($avgResHrs) . 'h' : 'N/A', $avgResHrsPrev >= 0 ? $avgResHrsPrev : 0, 'count', 'Clock', true),
            $this->makeKpi('Open Tickets', $openTickets, (string) $openTickets, $openTicketsPrev, 'count', 'Clock', true),
            $this->makeKpi('Resolved (MTD)', $resolvedMtd, (string) $resolvedMtd, $resolvedPrev, 'count', 'CheckCircle'),
        ];

        return response()->json([
            'status' => 'success',
            'data' => compact('ticketVolume', 'ticketsByType', 'ticketsByPriority', 'kpis') + ['csatData' => null],
        ]);
    }

    public function productivity(Request $request)
    {
        $this->authorize('view_reports');
        $dr = $this->getDateRange($request);
        $tp = $this->getTrendPeriods($dr['from'], $dr['to']);
        $employees = $this->parseCommaParam($request->input('employees'));

        $employeeIds = null;
        if ($employees) {
            $employeeIds = User::whereIn('name', $employees)->where('workspace_id', $request->user()->workspace_id)->pluck('id')->toArray();
        }

        // Task completion by employee
        $taskByUserQ = User::withCount([
            'tasks as total_tasks' => fn($q) => $this->applyDateFilter($q, 'created_at', $dr['from'], $dr['to']),
            'tasks as completed_tasks' => fn($q) => $q->where('status', 'completed')->pipe(fn($q) => $this->applyDateFilter($q, 'updated_at', $dr['from'], $dr['to'])),
        ])->whereHas('tasks');
        if ($employeeIds) {
            $taskByUserQ->whereIn('users.id', $employeeIds);
        }
        $taskByUser = $taskByUserQ->get()->map(function ($u) {
            $t = (int) $u->total_tasks;
            $c = (int) $u->completed_tasks;
            return ['name' => $u->name, 'completed' => $c, 'total' => $t, 'rate' => $t > 0 ? round(($c / $t) * 100) : 0];
        })->sortByDesc('rate')->values();

        // Team activity
        $now = Carbon::now();
        $sevenDaysAgo = $now->copy()->subDays(6)->startOfDay();
        $activityQ = Activity::select(
            DB::raw("DATE_FORMAT(activity_date, '%w') as day_num"),
            DB::raw("SUM(CASE WHEN type = 'call' THEN 1 ELSE 0 END) as calls"),
            DB::raw("SUM(CASE WHEN type = 'email' THEN 1 ELSE 0 END) as emails"),
            DB::raw("SUM(CASE WHEN type = 'task' THEN 1 ELSE 0 END) as tasks"),
            DB::raw("SUM(CASE WHEN type = 'note' THEN 1 ELSE 0 END) as notes"),
        )->where('activity_date', '>=', $sevenDaysAgo)
            ->when($dr['from'], fn($q) => $q->where('activity_date', '>=', $dr['from']))
            ->when($dr['to'], fn($q) => $q->where('activity_date', '<=', $dr['to']));
        if ($employeeIds) {
            $activityQ->whereIn('user_id', $employeeIds);
        }
        $activityByDay = $activityQ->groupBy('day_num')->orderBy('day_num')->get()->keyBy('day_num');
        $dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        $teamActivity = [];
        foreach ($dayNames as $i => $name) {
            $r = $activityByDay[(string) $i] ?? null;
            $teamActivity[] = ['day' => $name, 'calls' => (int) ($r->calls ?? 0), 'emails' => (int) ($r->emails ?? 0), 'tasks' => (int) ($r->tasks ?? 0), 'notes' => (int) ($r->notes ?? 0)];
        }

        // ── KPIs with REAL trends ──
        $totalTasksQ = Task::when($dr['from'], fn($q) => $q->where('created_at', '>=', $dr['from']))->when($dr['to'], fn($q) => $q->where('created_at', '<=', $dr['to']));
        $completedTasksQ = Task::where('status', 'completed')->when($dr['from'], fn($q) => $q->where('updated_at', '>=', $dr['from']))->when($dr['to'], fn($q) => $q->where('updated_at', '<=', $dr['to']));
        $totalTasksPrevQ = Task::whereBetween('created_at', [$tp['prevFrom'], $tp['prevTo']]);
        $completedTasksPrevQ = Task::where('status', 'completed')->whereBetween('updated_at', [$tp['prevFrom'], $tp['prevTo']]);
        if ($employeeIds) {
            $totalTasksQ->whereIn('assigned_to', $employeeIds);
            $completedTasksQ->whereIn('assigned_to', $employeeIds);
            $totalTasksPrevQ->whereIn('assigned_to', $employeeIds);
            $completedTasksPrevQ->whereIn('assigned_to', $employeeIds);
        }
        $totalTasks = $totalTasksQ->count();
        $completedTasks = $completedTasksQ->count();
        $rate = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0;
        $totalTasksPrev = $totalTasksPrevQ->count();
        $completedTasksPrev = $completedTasksPrevQ->count();
        $ratePrev = $totalTasksPrev > 0 ? round(($completedTasksPrev / $totalTasksPrev) * 100) : 0;

        $activitiesQ = Activity::when($dr['from'], fn($q) => $q->where('activity_date', '>=', $dr['from']))->when($dr['to'], fn($q) => $q->where('activity_date', '<=', $dr['to']));
        $activitiesPrevQ = Activity::whereBetween('activity_date', [$tp['prevFrom'], $tp['prevTo']]);
        if ($employeeIds) {
            $activitiesQ->whereIn('user_id', $employeeIds);
            $activitiesPrevQ->whereIn('user_id', $employeeIds);
        }
        $activities = $activitiesQ->count();
        $activitiesPrev = $activitiesPrevQ->count();

        $kpis = [
            $this->makeKpi('Tasks Completed', $rate, $rate . '%', $ratePrev, 'percent', 'CheckSquare'),
            $this->makeKpi('Total Tasks', $totalTasks, (string) $totalTasks, $totalTasksPrev, 'count', 'Timer'),
            $this->makeKpi('Activity Score', $activities, (string) $activities, $activitiesPrev, 'count', 'Zap'),
        ];

        return response()->json([
            'status' => 'success',
            'data' => compact('taskByUser', 'teamActivity', 'kpis'),
        ]);
    }

    public function calls(Request $request)
    {
        $this->authorize('view_reports');
        $dr = $this->getDateRange($request);
        $tp = $this->getTrendPeriods($dr['from'], $dr['to']);
        $now = Carbon::now();
        $reps = $this->parseCommaParam($request->input('reps'));
        $types = $this->parseCommaParam($request->input('types'));

        $repIds = null;
        if ($reps) {
            $repIds = User::whereIn('name', $reps)->where('workspace_id', $request->user()->workspace_id)->pluck('id')->toArray();
        }

        $callsByMonthQ = Activity::select(DB::raw("DATE_FORMAT(activity_date, '%Y-%m') as month"), DB::raw('count(*) as calls'))
            ->where('type', 'call')->where('activity_date', '>=', $now->copy()->subMonths(12)->startOfMonth());
        if ($repIds) $callsByMonthQ->whereIn('user_id', $repIds);
        $callsByMonth = $callsByMonthQ->groupBy('month')->orderBy('month')->get()->keyBy('month');
        $callsOvertime = [];
        for ($i = 0; $i < 12; $i++) {
            $m = $now->copy()->subMonths(11 - $i);
            $k = $m->format('Y-m');
            $callsOvertime[] = ['month' => $m->format('M Y'), 'calls' => (int) ($callsByMonth[$k]->calls ?? 0)];
        }

        $totalCallsQ = Activity::where('type', 'call')->when($dr['from'], fn($q) => $q->where('activity_date', '>=', $dr['from']))->when($dr['to'], fn($q) => $q->where('activity_date', '<=', $dr['to']));
        $totalCallsPrevQ = Activity::where('type', 'call')->whereBetween('activity_date', [$tp['prevFrom'], $tp['prevTo']]);
        if ($repIds) { $totalCallsQ->whereIn('user_id', $repIds); $totalCallsPrevQ->whereIn('user_id', $repIds); }
        $totalCalls = $totalCallsQ->count();
        $totalCallsPrev = $totalCallsPrevQ->count();

        $callTypeQ = Activity::where('type', 'call')
            ->when($dr['from'], fn($q) => $q->where('activity_date', '>=', $dr['from']))
            ->when($dr['to'], fn($q) => $q->where('activity_date', '<=', $dr['to']));
        if ($repIds) $callTypeQ->whereIn('user_id', $repIds);
        $callTypeData = $callTypeQ
            ->select('activitable_type', DB::raw('count(*) as value'))
            ->groupBy('activitable_type')->orderByDesc('value')->get()
            ->map(fn($r) => [
                'name' => class_basename($r->activitable_type) ?? 'Unknown',
                'value' => (int) $r->value,
                'color' => 'var(--color-chart-1)',
            ]);
        if ($callTypeData->isEmpty()) $callTypeData = collect([['name' => 'Total Calls', 'value' => $totalCalls, 'color' => 'var(--color-chart-1)']]);

        $dialTypeData = [];

        $callLogQ = Activity::where('type', 'call')->with('user')
            ->when($dr['from'], fn($q) => $q->where('activity_date', '>=', $dr['from']))
            ->when($dr['to'], fn($q) => $q->where('activity_date', '<=', $dr['to']));
        if ($repIds) $callLogQ->whereIn('user_id', $repIds);
        $callLogData = $callLogQ->latest('activity_date')->take(100)->get()
            ->map(fn($a, $i) => [
                'id' => $i + 1,
                'leadName' => $a->subject ?? 'Call activity',
                'mobile' => '',
                'salesName' => $a->user?->name ?? 'Unknown',
                'type' => ucfirst($a->type),
                'result' => $a->description ?: 'Completed',
                'duration' => '00:00',
                'startIn' => $a->activity_date?->format('d-m-Y h:i A') ?? '',
            ]);

        $kpis = [
            $this->makeKpi('Total Calls', $totalCalls, (string) $totalCalls, $totalCallsPrev, 'count', 'Phone'),
        ];

        return response()->json([
            'status' => 'success',
            'data' => compact('callsOvertime', 'callTypeData', 'dialTypeData', 'callLogData', 'kpis') + ['totalCallsByHour' => $totalCalls > 0 ? round($totalCalls / 8) : 0],
        ]);
    }

    public function filterOptions(Request $request)
    {
        $this->authorize('view_reports');
        $workspaceId = $request->user()->workspace_id;
        $salesStages = PipelineStage::whereHas('pipeline', fn($q) => $q->where('workspace_id', $workspaceId))
            ->select('name')
            ->distinct()
            ->pluck('name');
        $users = User::select('name', 'id')->where('workspace_id', $workspaceId)->get();
        $salesReps = $users->pluck('name');
        $employees = $users->pluck('name');
        $products = Product::where('status', 'Active')->pluck('name');
        $ticketTypes = Ticket::select('status')->distinct()->pluck('status')->map(fn($s) => ucfirst($s));
        $ticketPriorities = ['Low', 'Medium', 'High', 'Urgent'];

        return response()->json([
            'status' => 'success',
            'data' => compact('salesStages', 'salesReps', 'employees', 'products', 'ticketTypes', 'ticketPriorities'),
        ]);
    }

    public function export(Request $request)
    {
        $this->authorize('export_reports');
        $section = $request->input('section', 'executive');
        $dr = $this->getDateRange($request);
        $now = Carbon::now();

        $rows = match ($section) {
            'executive' => $this->exportExecutive($request),
            'sales' => $this->exportSales($request),
            'customers' => $this->exportCustomers($request),
            'orders' => $this->exportOrders($request),
            'support' => $this->exportTickets($request),
            'productivity' => $this->exportProductivity($request),
            'calls-log' => $this->exportCalls($request),
            default => $this->exportExecutive($request),
        };

        if ($rows->isEmpty()) {
            return response()->json(['status' => 'success', 'data' => ['rows' => [], 'headers' => []]]);
        }

        $headers = match ($section) {
            'executive' => ['Metric', 'Value', 'Raw'],
            'sales' => ['Title', 'Status', 'Amount', 'Stage', 'Assigned To', 'Created'],
            'customers' => ['Company', 'Contacts', 'Revenue', 'Created'],
            'orders' => ['Order Number', 'Title', 'Status', 'Total', 'Contact', 'Date'],
            'support' => ['Subject', 'Status', 'Priority', 'Contact', 'Assigned To', 'Created'],
            'productivity' => ['Title', 'Status', 'Priority', 'Assigned To', 'Due Date', 'Created'],
            'calls-log' => ['Subject', 'User', 'Date', 'Description', 'Related To'],
            default => ['Metric', 'Value', 'Raw'],
        };

        $filename = "report_{$section}_" . $now->format('Y-m-d_H-i-s') . ".csv";

        return response()->streamDownload(function () use ($headers, $rows) {
            $output = fopen('php://output', 'w');
            fputcsv($output, array_map(fn ($cell) => $this->sanitizeCsvCell($cell), $headers));
            foreach ($rows as $row) {
                fputcsv($output, array_map(fn ($cell) => $this->sanitizeCsvCell($cell), $row));
            }
            fclose($output);
        }, $filename, [
            'Content-Type' => 'text/csv',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
        ]);
    }

    private function sanitizeCsvCell($value): string
    {
        $str = (string) $value;

        if ($str === '') {
            return $str;
        }

        $first = $str[0];

        // Neutralize spreadsheet formula injection (=, +, -, @) and
        // tab/carriage-return column smuggling. Pure numeric literals
        // (e.g. negative amounts like "-5000") are kept untouched.
        if (in_array($first, ['=', '+', '-', '@', "\t", "\r"], true) && !is_numeric($str)) {
            return "'" . $str;
        }

        return $str;
    }

    private function exportExecutive(Request $request)
    {
        $currentPeriod = $request->input('period', 'this_month');
        $now = Carbon::now();
        $periodStart = match ($currentPeriod) {
            'this_month' => $now->copy()->startOfMonth(),
            'this_quarter' => $now->copy()->startOfQuarter(),
            'this_year' => $now->copy()->startOfYear(),
            'last_month' => $now->copy()->subMonth()->startOfMonth(),
            'last_quarter' => $now->copy()->subQuarter()->startOfQuarter(),
            'last_year' => $now->copy()->subYear()->startOfYear(),
            default => $now->copy()->startOfMonth(),
        };
        $periodEnd = match ($currentPeriod) {
            'last_month' => $now->copy()->subMonth()->endOfMonth(),
            'last_quarter' => $now->copy()->subQuarter()->endOfQuarter(),
            'last_year' => $now->copy()->subYear()->endOfYear(),
            default => $now,
        };

        $revenue = (float) Deal::where('status', 'won')->whereBetween('updated_at', [$periodStart, $periodEnd])->sum('amount');
        $dealsCount = Deal::whereBetween('created_at', [$periodStart, $periodEnd])->count();
        $openTickets = Ticket::whereIn('status', ['open', 'pending'])->whereBetween('created_at', [$periodStart, $periodEnd])->count();
        $totalTasks = Task::whereBetween('created_at', [$periodStart, $periodEnd])->count();
        $completedTasks = Task::where('status', 'completed')->whereBetween('updated_at', [$periodStart, $periodEnd])->count();
        $completionRate = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0;

        return collect([
            ['Metric' => 'Total Revenue', 'Value' => $this->formatCurrency($revenue), 'Raw' => $revenue],
            ['Metric' => 'Total Deals', 'Value' => $dealsCount, 'Raw' => $dealsCount],
            ['Metric' => 'Open Tickets', 'Value' => $openTickets, 'Raw' => $openTickets],
            ['Metric' => 'Tasks Completed', 'Value' => $completionRate . '%', 'Raw' => $completionRate],
            ['Metric' => 'Total Tasks', 'Value' => $totalTasks, 'Raw' => $totalTasks],
        ]);
    }

    private function exportSales(Request $request)
    {
        $dr = $this->getDateRange($request);
        return Deal::with(['pipelineStage:id,name', 'assignee:id,name'])
            ->when($dr['from'], fn($q) => $q->where('created_at', '>=', $dr['from']))
            ->when($dr['to'], fn($q) => $q->where('created_at', '<=', $dr['to']))
            ->orderBy('created_at', 'desc')
            ->lazy(1000)
            ->map(fn($d) => [
                'Title' => $d->title,
                'Status' => ucfirst($d->status),
                'Amount' => $d->amount,
                'Stage' => $d->pipelineStage?->name ?? 'N/A',
                'Assigned To' => $d->assignee?->name ?? 'Unassigned',
                'Created' => $d->created_at?->format('Y-m-d') ?? '',
            ]);
    }

    private function exportCustomers(Request $request)
    {
        $dr = $this->getDateRange($request);
        return Company::withCount('contacts')
            ->withSum(['deals' => fn($q) => $q->where('status', 'won')], 'amount')
            ->when($dr['from'], fn($q) => $q->where('created_at', '>=', $dr['from']))
            ->when($dr['to'], fn($q) => $q->where('created_at', '<=', $dr['to']))
            ->orderBy('created_at', 'desc')
            ->lazy(1000)
            ->map(fn($c) => [
                'Company' => $c->name,
                'Contacts' => $c->contacts_count,
                'Revenue' => $this->formatCurrency($c->deals_sum_amount ?? 0),
                'Created' => $c->created_at?->format('Y-m-d') ?? '',
            ]);
    }

    private function exportOrders(Request $request)
    {
        $dr = $this->getDateRange($request);
        return Order::with('contact:id,first_name,last_name')
            ->when($dr['from'], fn($q) => $q->where('created_at', '>=', $dr['from']))
            ->when($dr['to'], fn($q) => $q->where('created_at', '<=', $dr['to']))
            ->orderBy('created_at', 'desc')
            ->lazy(1000)
            ->map(fn($o) => [
                'Order Number' => $o->order_number,
                'Title' => $o->title,
                'Status' => ucfirst($o->status),
                'Total' => $o->total,
                'Contact' => trim(($o->contact?->first_name ?? '') . ' ' . ($o->contact?->last_name ?? '')),
                'Date' => $o->created_at?->format('Y-m-d') ?? '',
            ]);
    }

    private function exportTickets(Request $request)
    {
        $dr = $this->getDateRange($request);
        return Ticket::with(['contact:id,first_name,last_name', 'assignee:id,name'])
            ->when($dr['from'], fn($q) => $q->where('created_at', '>=', $dr['from']))
            ->when($dr['to'], fn($q) => $q->where('created_at', '<=', $dr['to']))
            ->orderBy('created_at', 'desc')
            ->lazy(1000)
            ->map(fn($t) => [
                'Subject' => $t->subject,
                'Status' => ucfirst($t->status),
                'Priority' => ucfirst($t->priority),
                'Contact' => trim(($t->contact?->first_name ?? '') . ' ' . ($t->contact?->last_name ?? '')),
                'Assigned To' => $t->assignee?->name ?? 'Unassigned',
                'Created' => $t->created_at?->format('Y-m-d') ?? '',
            ]);
    }

    private function exportProductivity(Request $request)
    {
        $dr = $this->getDateRange($request);
        return Task::with(['assignee:id,name'])
            ->when($dr['from'], fn($q) => $q->where('created_at', '>=', $dr['from']))
            ->when($dr['to'], fn($q) => $q->where('created_at', '<=', $dr['to']))
            ->orderBy('created_at', 'desc')
            ->lazy(1000)
            ->map(fn($t) => [
                'Title' => $t->title,
                'Status' => ucfirst($t->status),
                'Priority' => ucfirst($t->priority ?? 'N/A'),
                'Assigned To' => $t->assignee?->name ?? 'Unassigned',
                'Due Date' => $t->due_date?->format('Y-m-d') ?? '',
                'Created' => $t->created_at?->format('Y-m-d') ?? '',
            ]);
    }

    private function exportCalls(Request $request)
    {
        $dr = $this->getDateRange($request);
        return Activity::where('type', 'call')->with('user:id,name', 'activitable')
            ->when($dr['from'], fn($q) => $q->where('activity_date', '>=', $dr['from']))
            ->when($dr['to'], fn($q) => $q->where('activity_date', '<=', $dr['to']))
            ->orderBy('activity_date', 'desc')
            ->lazy(1000)
            ->map(fn($a) => [
                'Subject' => $a->subject ?? 'Call',
                'User' => $a->user?->name ?? 'Unknown',
                'Date' => $a->activity_date?->format('Y-m-d H:i') ?? '',
                'Description' => $a->description ?? '',
                'Related To' => class_basename($a->activitable_type) ?? '',
            ]);
    }

    private function parseCommaParam(?string $param): ?array
    {
        if (!$param) return null;
        $items = array_map('trim', explode(',', $param));
        return array_filter($items) ?: null;
    }

    private function formatCurrency($value): string
    {
        $v = (float) $value;
        if ($v >= 1_000_000) return '$' . number_format($v / 1_000_000, 1) . 'M';
        if ($v >= 1_000) return '$' . number_format($v / 1_000, 0) . 'K';
        return '$' . number_format($v, 0);
    }

    private function trendText($current, $previous, string $type, bool $invert = false): string
    {
        $c = is_numeric($current) ? (float) $current : 0;
        $p = is_numeric($previous) ? (float) $previous : 0;
        if ($p == 0) return $c > 0 ? 'New' : 'No change';
        $pct = round((($c - $p) / $p) * 100);
        if ($invert) $pct = -$pct;
        $sign = $pct > 0 ? '+' : '';
        $label = match ($type) {
            'revenue' => 'revenue',
            'currency' => 'revenue',
            'count' => 'count',
            'percent' => 'completion',
            default => 'vs last period',
        };
        return "{$sign}{$pct}% vs last {$label}";
    }
}
