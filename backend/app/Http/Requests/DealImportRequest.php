<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DealImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->user()->hasPermissionTo('create_deals');
    }

    public function rules(): array
    {
        return [
            'file' => 'required|file|mimes:csv,txt|max:51200',
        ];
    }
}
