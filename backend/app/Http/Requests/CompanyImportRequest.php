<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CompanyImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->user()->hasPermissionTo('create_companies');
    }

    public function rules(): array
    {
        return [
            'file' => 'required|file|mimes:csv,txt|max:51200',
        ];
    }
}
