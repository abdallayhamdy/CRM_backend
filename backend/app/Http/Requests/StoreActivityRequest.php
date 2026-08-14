<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $scope = fn ($q) => $this->user()?->is_super_admin ? $q : $q->where('workspace_id', $this->user()?->workspace_id);

        return [
            'type' => 'required|string|max:50',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'completed' => 'nullable|boolean',

            'activity_date' => 'nullable|date',

            'owner_id' => [
                'nullable',
                Rule::exists('users', 'id')->where($scope),
            ],

            'contact_id' => [
                'nullable',
                Rule::exists('contacts', 'id')->where($scope),
            ],
            'company_id' => [
                'nullable',
                Rule::exists('companies', 'id')->where($scope),
            ],
            'deal_id' => [
                'nullable',
                Rule::exists('deals', 'id')->where($scope),
            ],
            'ticket_id' => [
                'nullable',
                Rule::exists('tickets', 'id')->where($scope),
            ],
        ];
    }
}

