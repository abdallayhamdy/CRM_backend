<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFormLayoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = auth()->user();
        return $user->hasPermissionTo('manage_panel_configs');
    }

    public function rules(): array
    {
        return [
            'object_type' => 'required|string|max:100',
            'groups' => 'required|array',
            'groups.*.id' => 'required|string',
            'groups.*.label' => 'required|string',
        ];
    }
}
