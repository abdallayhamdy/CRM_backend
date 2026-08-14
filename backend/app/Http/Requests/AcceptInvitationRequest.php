<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AcceptInvitationRequest extends FormRequest
{
    public function authorize(): bool { return true; } // التوكن نفسه هو وسيلة التحقق

    public function rules(): array
    {
        return [
            'token' => 'required|string|exists:invitations,token',
            'name' => 'required|string|max:255',
            'password' => 'required|string|min:8|confirmed',
        ];
    }
}