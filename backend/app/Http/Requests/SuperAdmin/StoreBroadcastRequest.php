<?php

namespace App\Http\Requests\SuperAdmin;

use App\Models\BroadcastMessage;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBroadcastRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check() && auth('sanctum')->user()->is_super_admin;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:200',
            'message' => 'required|string|max:5000',
            'audience' => ['required', 'string', Rule::in(BroadcastMessage::AUDIENCES)],
        ];
    }
}
