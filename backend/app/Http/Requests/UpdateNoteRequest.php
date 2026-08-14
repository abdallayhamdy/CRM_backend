<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content' => 'sometimes|required|string',
            'notable_type' => 'sometimes|required|string|in:company,contact,deal',
            'notable_id' => 'sometimes|required|uuid',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->has('notable_type') && $this->has('notable_id')) {
                $type = $this->input('notable_type');
                $id = $this->input('notable_id');
                $modelClass = match($type) {
                    'company' => \App\Models\Company::class,
                    'contact' => \App\Models\Contact::class,
                    'deal' => \App\Models\Deal::class,
                    default => null
                };
                if ($modelClass) {
                    $exists = $modelClass::where('id', $id)
                        ->where('workspace_id', $this->user()?->workspace_id)
                        ->exists();
                    if (!$exists) {
                        $validator->errors()->add('notable_id', 'The selected notable relation is invalid or does not belong to your workspace.');
                    }
                }
            }
        });
    }
}
