<?php

namespace App\Http\Requests\SuperAdmin;

use App\Models\Webhook;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWebhookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check() && auth('sanctum')->user()->is_super_admin;
    }

    public function rules(): array
    {
        return [
            'url' => 'required|string|url|max:255',
            'events' => 'required|array|min:1',
            'events.*' => ['string', Rule::in(Webhook::EVENTS)],
        ];
    }
}
