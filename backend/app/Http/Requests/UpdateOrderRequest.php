<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class UpdateOrderRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $workspaceId = $this->user()?->workspace_id;

        $userScope = function ($q) use ($workspaceId) {
            $q->where('workspace_id', $workspaceId)
              ->orWhereExists(function ($sub) use ($workspaceId) {
                  $sub->select(DB::raw(1))
                      ->from('workspace_user')
                      ->whereColumn('workspace_user.user_id', 'users.id')
                      ->where('workspace_user.workspace_id', $workspaceId);
              });
        };

        return [
            'contact_id' => [
                'nullable',
                Rule::exists('contacts', 'id')->where(fn ($q) => $q->where('workspace_id', $workspaceId)),
            ],
            'company_id' => [
                'nullable',
                Rule::exists('companies', 'id')->where(fn ($q) => $q->where('workspace_id', $workspaceId)),
            ],
            'owner_id' => [
                'nullable',
                Rule::exists('users', 'id')->where($userScope),
            ],
            'title' => 'sometimes|required|string|max:255',
            'order_number' => 'nullable|string|max:255',
            'status' => 'nullable|in:open,paid,refunded',
            'currency' => 'nullable|string|size:3',
            'subtotal' => 'nullable|numeric',
            'discount' => 'nullable|numeric',
            'tax' => 'nullable|numeric',
            'shipping' => 'nullable|numeric',
            'total' => 'nullable|numeric',

            'line_items' => 'nullable|array',
            'line_items.*.product_id' => [
                'nullable',
                Rule::exists('products', 'id')->where(fn ($q) => $q->where('workspace_id', $workspaceId)),
            ],
            'line_items.*.name' => 'sometimes|required|string|max:255',
            'line_items.*.quantity' => 'sometimes|required|integer|min:1',
            'line_items.*.unit_price' => 'sometimes|required|numeric',
            'line_items.*.discount' => 'nullable|numeric',
            'line_items.*.tax' => 'nullable|numeric',
            'line_items.*.total' => 'sometimes|required|numeric',

            'custom_fields' => 'nullable|array',
        ];
    }
}
