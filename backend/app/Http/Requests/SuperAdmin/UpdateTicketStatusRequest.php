<?php

namespace App\Http\Requests\SuperAdmin;

use App\Models\SupportTicket;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTicketStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check() && auth('sanctum')->user()->is_super_admin;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in(SupportTicket::STATUSES)],
        ];
    }
}
