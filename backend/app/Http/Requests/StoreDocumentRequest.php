<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $scope = fn ($q) => $this->user()?->is_super_admin ? $q : $q->where('workspace_id', $this->user()?->workspace_id);

        return [
            'file' => 'required|file|extensions:pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif,webp|max:10240',
            'documentable_type' => 'required|string|in:deal,contact,company,product,ticket',
            'documentable_id' => 'required|uuid',
            'name' => 'nullable|string|max:255',
            'document_type' => 'nullable|string|in:Proposal,Contract,Invoice,General',
            'ticket_id' => [
                'nullable',
                Rule::exists('tickets', 'id')->where($scope),
            ],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->has('documentable_type') && $this->has('documentable_id')) {
                $type = $this->input('documentable_type');
                $id = $this->input('documentable_id');
                $modelClass = match(strtolower($type)) {
                    'company' => \App\Models\Company::class,
                    'contact' => \App\Models\Contact::class,
                    'deal' => \App\Models\Deal::class,
                    'product' => \App\Models\Product::class,
                    'ticket' => \App\Models\Ticket::class,
                    default => null
                };
                if ($modelClass) {
                    $exists = $modelClass::where('id', $id)
                        ->where('workspace_id', $this->user()?->workspace_id)
                        ->exists();
                    if (!$exists) {
                        $validator->errors()->add('documentable_id', 'The selected documentable relation is invalid or does not belong to your workspace.');
                    }
                }
            }
        });
    }
}
