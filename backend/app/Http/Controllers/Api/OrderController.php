<?php

namespace App\Http\Controllers\Api;

use App\Models\Order;
use App\Models\Property;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderRequest;
use App\Http\Resources\OrderResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class OrderController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Order::class);

        $query = Order::with([
            'contact',
            'company',
            'owner',
        ]);

        if ($request->q) {
            $q = $request->q;
            $query->where(function ($query) use ($q) {
                $query->where('title', 'like', "%{$q}%")
                    ->orWhere('order_number', 'like', "%{$q}%");
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $this->applyCustomDataFilters($query, $request, 'order');

        $query->applyRecordScope(auth('sanctum')->user(), 'orders', 'view');

        $sortBy = in_array($request->sort_by, ['title', 'order_number', 'status', 'total', 'created_at', 'updated_at']) ? $request->sort_by : 'created_at';
        $sortDir = $request->sort_dir === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDir);

        $orders = $query->paginate($this->paginationLimit($request));

        return response()->json([
            'status' => 'success',
            'data' => OrderResource::collection($orders),
            'meta' => [
                'page' => $orders->currentPage(),
                'limit' => $orders->perPage(),
                'total' => $orders->total(),
                'last_page' => $orders->lastPage(),
            ],
        ]);
    }

    public function store(StoreOrderRequest $request)
    {
        $this->authorize('create', Order::class);
        $validated = $request->validated();
        $lineItems = $validated['line_items'] ?? [];
        unset($validated['line_items']);

        if (isset($validated['custom_fields'])) {
            $validated['custom_data'] = $validated['custom_fields'];
        }
        unset($validated['custom_fields']);

        $order = DB::transaction(function () use ($validated, $lineItems) {
            $validated['workspace_id'] = auth('sanctum')->user()->workspace_id;
            $order = Order::create($validated);

            if (!empty($lineItems)) {
                $itemsToInsert = [];
                $now = now();

                foreach ($lineItems as $index => $item) {
                    $item['total'] = $this->computeItemTotal($item);
                    $itemsToInsert[] = array_merge($item, [
                        'id' => (string) Str::uuid(),
                        'order_id' => $order->id,
                        'display_order' => $index,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }

                $order->lineItems()->insert($itemsToInsert);

                $order->update($this->computeFinancials(
                    $lineItems,
                    (float) ($validated['shipping'] ?? 0)
                ));
            }

            return $order->load(['lineItems', 'contact', 'company', 'owner']);
        });

        return response()->json([
            'status' => 'success',
            'data' => new OrderResource($order),
        ], 201);
    }

    public function show(Order $order)
    {
        $this->authorize('view', $order);

        $order->load(['lineItems', 'contact', 'company', 'owner']);

        return response()->json([
            'status' => 'success',
            'data' => new OrderResource($order),
        ]);
    }

    public function update(UpdateOrderRequest $request, Order $order)
    {
        $this->authorize('update', $order);
        $validated = $request->validated();
        $lineItems = $validated['line_items'] ?? null;
        unset($validated['line_items']);

        if (isset($validated['custom_fields'])) {
            $validated['custom_data'] = array_merge($order->custom_data ?? [], $validated['custom_fields']);
        }
        unset($validated['custom_fields']);

        DB::transaction(function () use ($order, $validated, $lineItems) {
            $order->update($validated);

            if (is_array($lineItems)) {
                $order->lineItems()->delete();

                $itemsToInsert = [];
                $now = now();
                foreach ($lineItems as $index => $item) {
                    $item['total'] = $this->computeItemTotal($item);
                    $itemsToInsert[] = array_merge($item, [
                        'id' => (string) Str::uuid(),
                        'order_id' => $order->id,
                        'display_order' => $index,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }

                if (!empty($itemsToInsert)) {
                    $order->lineItems()->insert($itemsToInsert);
                }
            }

            $order->update($this->computeFinancials(
                $order->lineItems()->get(['quantity', 'unit_price', 'discount', 'tax'])->toArray(),
                (float) $order->shipping
            ));
        });

        return response()->json([
            'status' => 'success',
            'data' => new OrderResource($order->load(['lineItems', 'contact', 'company', 'owner'])),
        ]);
    }

    public function addLineItems(Request $request, Order $order)
    {
        $this->authorize('update', $order);

        $request->validate([
            '*' => 'required|array',
            '*.product_id' => [
                'nullable',
                'uuid',
                Rule::exists('products', 'id')->where(fn ($q) => $q->where('workspace_id', $order->workspace_id)),
            ],
            '*.name' => 'required|string|max:255',
            '*.description' => 'nullable|string',
            '*.quantity' => 'required|integer|min:1',
            '*.unit_price' => 'required|numeric',
            '*.discount' => 'nullable|numeric',
            '*.tax' => 'nullable|numeric',
            '*.total' => 'required|numeric',
        ]);

        $items = $request->all();
        $nextOrder = $order->lineItems()->max('display_order') ?? -1;

        $itemsToInsert = [];
        $now = now();
        foreach ($items as $index => $item) {
            $item['total'] = $this->computeItemTotal($item);
            $itemsToInsert[] = array_merge($item, [
                'id' => (string) Str::uuid(),
                'order_id' => $order->id,
                'display_order' => $nextOrder + 1 + $index,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        if (!empty($itemsToInsert)) {
            $order->lineItems()->insert($itemsToInsert);
        }

        $order->update($this->computeFinancials(
            $order->lineItems()->get(['quantity', 'unit_price', 'discount', 'tax'])->toArray(),
            (float) $order->shipping
        ));

        return response()->json([
            'status' => 'success',
            'data' => new OrderResource($order->load(['lineItems', 'contact', 'company', 'owner'])),
        ], 201);
    }

    public function replaceLineItems(Request $request, Order $order)
    {
        $this->authorize('update', $order);

        $request->validate([
            '*' => 'required|array',
            '*.product_id' => [
                'nullable',
                'uuid',
                Rule::exists('products', 'id')->where(fn ($q) => $q->where('workspace_id', $order->workspace_id)),
            ],
            '*.name' => 'required|string|max:255',
            '*.description' => 'nullable|string',
            '*.quantity' => 'required|integer|min:1',
            '*.unit_price' => 'required|numeric',
            '*.discount' => 'nullable|numeric',
            '*.tax' => 'nullable|numeric',
            '*.total' => 'required|numeric',
        ]);

        $items = $request->all();

        DB::transaction(function () use ($order, $items) {
            $order->lineItems()->delete();

            $itemsToInsert = [];
            $now = now();
            foreach ($items as $index => $item) {
                $item['total'] = $this->computeItemTotal($item);
                $itemsToInsert[] = array_merge($item, [
                    'id' => (string) Str::uuid(),
                    'order_id' => $order->id,
                    'display_order' => $index,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            if (!empty($itemsToInsert)) {
                $order->lineItems()->insert($itemsToInsert);
            }

            $order->update($this->computeFinancials(
                $order->lineItems()->get(['quantity', 'unit_price', 'discount', 'tax'])->toArray(),
                (float) $order->shipping
            ));
        });

        return response()->json([
            'status' => 'success',
            'data' => new OrderResource($order->load(['lineItems', 'contact', 'company', 'owner'])),
        ]);
    }

    public function destroy(Order $order)
    {
        $this->authorize('delete', $order);

        $order->delete();

        return response()->json([
            'status' => 'success',
        ]);
    }

    protected function applyCustomDataFilters(Builder $query, Request $request, string $objectType): void
    {
        $propertyNames = Property::where('object_type', $objectType)
            ->where('is_archived', false)
            ->pluck('name')
            ->toArray();

        foreach ($propertyNames as $propName) {
            $value = $request->input("filter.{$propName}");
            if ($value === null) continue;

            $values = is_array($value) ? $value : array_map('trim', explode(',', $value));
            $query->where(function (Builder $q) use ($values, $propName) {
                foreach ($values as $val) {
                    $q->orWhereRaw("JSON_UNQUOTE(JSON_EXTRACT(custom_data, '$.{$propName}')) = ?", [$val]);
                }
            });
        }
    }

    protected function computeItemTotal(array $item): float
    {
        $quantity = (float) ($item['quantity'] ?? 1);
        $unitPrice = (float) ($item['unit_price'] ?? 0);
        $discountPct = max(0.0, min(100.0, (float) ($item['discount'] ?? 0)));
        $tax = (float) ($item['tax'] ?? 0);

        return round($quantity * $unitPrice * (1 - $discountPct / 100) + $tax, 2);
    }

    protected function computeFinancials(array $items, float $shipping): array
    {
        $subtotal = 0.0;
        $discountAmount = 0.0;
        $tax = 0.0;

        foreach ($items as $item) {
            $quantity = (float) ($item['quantity'] ?? 1);
            $unitPrice = (float) ($item['unit_price'] ?? 0);
            $discountPct = max(0.0, min(100.0, (float) ($item['discount'] ?? 0)));

            $gross = round($quantity * $unitPrice, 2);
            $net = round($gross * (1 - $discountPct / 100), 2);

            $subtotal += $net;
            $discountAmount += round($gross - $net, 2);
            $tax += (float) ($item['tax'] ?? 0);
        }

        $subtotal = round($subtotal, 2);
        $tax = round($tax, 2);

        return [
            'subtotal' => $subtotal,
            'discount' => round($discountAmount, 2),
            'tax' => $tax,
            'total' => round($subtotal + $tax + $shipping, 2),
        ];
    }
}
