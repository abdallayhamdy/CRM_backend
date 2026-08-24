<?php

namespace Database\Seeders;

use App\Models\Property;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Seeder;

class PropertyDefinitionSeeder extends Seeder
{
    public function run(): void
    {
        $workspace = Workspace::where('name', 'LeadSwift CRM')->first();
        if (!$workspace) {
            $this->command->error('Workspace "LeadSwift CRM" not found. Skipping property seed.');
            return;
        }

        $admin = User::where('email', 'admin@crm.com')->first();
        $createdBy = $admin?->id;

        $properties = [
            [
                'label'         => 'First name',
                'name'          => 'first_name',
                'field_type'    => 'single_line_text',
                'object_type'   => 'contact',
                'group_name'    => 'Contact information',
                'description'   => 'The contact\'s first name.',
                'is_required'   => true,
                'show_in_forms' => true,
                'display_order' => 1,
            ],
            [
                'label'         => 'Last name',
                'name'          => 'last_name',
                'field_type'    => 'single_line_text',
                'object_type'   => 'contact',
                'group_name'    => 'Contact information',
                'description'   => 'The contact\'s last name.',
                'is_required'   => true,
                'show_in_forms' => true,
                'display_order' => 2,
            ],
            [
                'label'         => 'Email',
                'name'          => 'email',
                'field_type'    => 'email',
                'object_type'   => 'contact',
                'group_name'    => 'Contact information',
                'description'   => 'The contact\'s primary email address.',
                'is_required'   => false,
                'show_in_forms' => true,
                'display_order' => 3,
            ],
            [
                'label'         => 'Phone number',
                'name'          => 'phone_number',
                'field_type'    => 'phone_number',
                'object_type'   => 'contact',
                'group_name'    => 'Contact information',
                'description'   => 'The contact\'s primary phone number.',
                'is_required'   => false,
                'show_in_forms' => true,
                'display_order' => 4,
            ],
            [
                'label'         => 'Lifecycle stage',
                'name'          => 'lifecycle_stage',
                'field_type'    => 'dropdown_select',
                'object_type'   => 'contact',
                'group_name'    => 'Contact information',
                'description'   => 'The contact\'s current stage in the buyer lifecycle.',
                'is_required'   => false,
                'show_in_forms' => true,
                'display_order' => 5,
                'options'       => [
                    'Subscriber', 'Lead', 'Marketing Qualified Lead',
                    'Sales Qualified Lead', 'Opportunity', 'Customer',
                    'Evangelist', 'Other',
                ],
            ],
            [
                'label'         => 'Lead status',
                'name'          => 'lead_status',
                'field_type'    => 'dropdown_select',
                'object_type'   => 'contact',
                'group_name'    => 'Contact information',
                'description'   => 'The status of the contact as a lead.',
                'is_required'   => false,
                'show_in_forms' => true,
                'display_order' => 6,
                'options'       => [
                    'New', 'Open', 'In Progress', 'Open Deal',
                    'Unqualified', 'Attempted to Contact',
                    'Connected', 'Bad Timing',
                ],
            ],
            [
                'label'         => 'Contact source',
                'name'          => 'contact_source',
                'field_type'    => 'dropdown_select',
                'object_type'   => 'contact',
                'group_name'    => 'Contact information',
                'description'   => 'Where this contact originally came from.',
                'is_required'   => false,
                'show_in_forms' => true,
                'display_order' => 7,
                'options'       => [
                    'Organic Search', 'Paid Search', 'Social Media',
                    'Email Marketing', 'Referral', 'Direct Traffic',
                    'Trade Show', 'Webinar', 'Other',
                ],
            ],
            [
                'label'         => 'Notes',
                'name'          => 'notes',
                'field_type'    => 'multi_line_text',
                'object_type'   => 'contact',
                'group_name'    => 'About',
                'description'   => 'Free-form notes about this contact.',
                'is_required'   => false,
                'show_in_forms' => true,
                'display_order' => 8,
            ],
            [
                'label'         => 'Date of birth',
                'name'          => 'date_of_birth',
                'field_type'    => 'date_picker',
                'object_type'   => 'contact',
                'group_name'    => 'Contact information',
                'description'   => 'The contact\'s date of birth.',
                'is_required'   => false,
                'show_in_forms' => true,
                'display_order' => 9,
            ],
            [
                'label'         => 'Newsletter opt-in',
                'name'          => 'newsletter_opt_in',
                'field_type'    => 'boolean_checkbox',
                'object_type'   => 'contact',
                'group_name'    => 'Contact information',
                'description'   => 'Whether the contact has opted in to receive newsletters.',
                'is_required'   => false,
                'show_in_forms' => true,
                'display_order' => 10,
            ],
        ];

        foreach ($properties as $data) {
            Property::create(array_merge($data, [
                'workspace_id' => $workspace->id,
                'created_by'   => $createdBy,
                'is_archived'  => false,
            ]));
        }

        $this->command->info("Seeded " . count($properties) . " contact properties.");
    }
}
