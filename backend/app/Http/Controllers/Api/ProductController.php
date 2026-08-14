<?php

namespace App\Http\Controllers\Api;

use App\Models\Product;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class ProductController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Product::class);

        $sortBy = in_array($request->sort_by, ['name', 'sku', 'unit_price', 'status', 'product_folder', 'created_at', 'updated_at']) ? $request->sort_by : 'created_at';
        $sortDir = $request->sort_dir === 'asc' ? 'asc' : 'desc';

        $products = Product::query()
            ->when($request->q, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('sku', 'like', "%{$search}%");
                });
            })
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

        $products = Product::query()
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('sku', 'like', "%{$query}%");
            })
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
        if (isset($data['custom_fields'])) {
            $data['custom_data'] = $data['custom_fields'];
        }
        unset($data['custom_fields']);

        $product->update($data);

        return response()->json([
            'status' => 'success',
            'message' => 'Product updated successfully',
            'data' => new ProductResource($product)
        ]);
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