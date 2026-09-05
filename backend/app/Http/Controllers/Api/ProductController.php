<?php

namespace App\Http\Controllers\Api;

use App\Models\Product;
use App\Models\Property;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class ProductController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Product::class);

        $sortBy = in_array($request->sort_by, ['name', 'sku', 'unit_price', 'status', 'product_folder', 'created_at', 'updated_at']) ? $request->sort_by : 'created_at';
        $sortDir = $request->sort_dir === 'asc' ? 'asc' : 'desc';

        $user = auth('sanctum')->user();

        $products = Product::query()
            ->when($request->q, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('sku', 'like', "%{$search}%");
                });
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->product_folder, function ($query, $folder) {
                $query->where('product_folder', $folder);
            })
            ->when(true, function ($query) use ($request) {
                $this->applyCustomDataFilters($query, $request, 'product');
            })
            ->applyRecordScope($user, 'products', 'view')
            ->orderBy($sortBy, $sortDir)
            ->paginate($this->paginationLimit($request));

        return ProductResource::collection($products);
    }

    public function search(Request $request)
    {
        $this->authorize('viewAny', Product::class);
        $query = trim($request->get('q', ''));

        if ($query === '') {
            return response()->json(['data' => []]);
        }

        $user = auth('sanctum')->user();

        $products = Product::query()
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('sku', 'like', "%{$query}%");
            })
            ->applyRecordScope($user, 'products', 'view')
            ->limit(20)
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'label' => $product->name,
                    'unit_price' => (float) $product->unit_price,
                ];
            });

        return response()->json(['data' => $products]);
    }

    public function store(StoreProductRequest $request)
    {
        $this->authorize('create', Product::class);

        $data = $request->validated();
        $data['workspace_id'] = auth('sanctum')->user()->workspace_id;

        if (isset($data['custom_fields'])) {
            $data['custom_data'] = $data['custom_fields'];
        }
        unset($data['custom_fields']);

        $product = Product::create($data);

        return response()->json([
            'status' => 'success',
            'message' => 'Product created successfully',
            'data' => new ProductResource($product)
        ], 201);
    }

    public function show(Product $product)
    {
        $this->authorize('view', $product);

        return response()->json([
            'status' => 'success',
            'data' => new ProductResource($product)
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product)
    {
        $this->authorize('update', $product);

        $data = $request->validated();

        $existingCustomData = $product->custom_data ?? [];
        if (isset($data['custom_fields'])) {
            $existingCustomData = array_merge($existingCustomData, $data['custom_fields']);
        }
        unset($data['custom_fields']);

        foreach (['product_type', 'product_description'] as $field) {
            if (isset($data[$field])) {
                $existingCustomData[$field] = $data[$field];
                unset($data[$field]);
            }
        }

        if (!empty($existingCustomData)) {
            $data['custom_data'] = $existingCustomData;
        }

        $product->update($data);

        return response()->json([
            'status' => 'success',
            'message' => 'Product updated successfully',
            'data' => new ProductResource($product)
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

    public function destroy(Product $product)
    {
        $this->authorize('delete', $product);
        $product->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Product deleted successfully'
        ]);
    }
}