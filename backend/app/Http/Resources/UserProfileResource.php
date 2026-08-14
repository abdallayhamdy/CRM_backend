<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class UserProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $nameParts = $this->parseName($this->name ?? '');

        return [
            'id' => $this->id,
            'first_name' => $nameParts['first_name'],
            'last_name' => $nameParts['last_name'],
            'email' => $this->email,
            'language' => $this->language,
            'date_format' => $this->date_format,
            'phone_country' => $this->phone_country,
            'phone_number' => $this->phone_number,
            'default_landing_page' => $this->default_landing_page,
            'work_start_day' => $this->work_start_day,
            'work_end_day' => $this->work_end_day,
            'work_start_time' => $this->work_start_time,
            'work_end_time' => $this->work_end_time,
            'avatar_url' => $this->avatar_path ? '/storage/' . $this->avatar_path : null,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }

    private function parseName(string $fullName): array
    {
        $parts = array_filter(explode(' ', trim($fullName)));
        $firstName = $parts[0] ?? '';
        $lastName = implode(' ', array_slice($parts, 1));

        return [
            'first_name' => $firstName,
            'last_name' => $lastName ?: null,
        ];
    }
}
