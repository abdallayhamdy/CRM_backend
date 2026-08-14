<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PanelConfigResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $config = $this->config;

        return [
            'object_type' => $this->object_type,
            'config' => [
                'cards' => $config['cards'] ?? [],
                'customLeftCards' => $config['customLeftCards'] ?? $config['custom_left_cards'] ?? [],
                'leftAddedIds' => $config['leftAddedIds'] ?? $config['left_added_ids'] ?? [],
                'customRightCards' => $config['customRightCards'] ?? $config['custom_right_cards'] ?? [],
                'tableSettings' => $config['tableSettings'] ?? $config['table_settings'] ?? null,
            ],
        ];
    }
}
