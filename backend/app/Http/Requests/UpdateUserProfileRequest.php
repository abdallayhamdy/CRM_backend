<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|nullable|string|max:255',
            'language' => 'sometimes|nullable|string|max:10',
            'date_format' => 'sometimes|nullable|string|max:20',
            'phone_country' => 'sometimes|nullable|string|max:10',
            'phone_number' => 'sometimes|nullable|string|max:30',
            'default_landing_page' => 'sometimes|nullable|string|max:50',
            'work_start_day' => 'sometimes|nullable|string|max:20',
            'work_end_day' => 'sometimes|nullable|string|max:20',
            'work_start_time' => 'sometimes|nullable|string|max:10',
            'work_end_time' => 'sometimes|nullable|string|max:10',
        ];
    }
}
