<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\User;
use Tests\TestCase;
use Tests\Traits\TestHelpers;

class AuditLogTest extends TestCase
{
    use TestHelpers;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpWorkspace();
    }

    public function test_unauthenticated_user_cannot_access_audit_log(): void
    {
        $response = $this->getJson('/api/audit-log');

        $response->assertStatus(401);
    }

    public function test_user_can_get_empty_audit_log(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/audit-log');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'logs',
            'total',
        ]);
        $response->assertJson(['logs' => [], 'total' => 0]);
    }

    public function test_user_can_list_audit_logs(): void
    {
        $this->authenticateAsAdmin();

        AuditLog::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
        ]);

        $response = $this->getJson('/api/audit-log');

        $response->assertStatus(200);
        $response->assertJsonCount(3, 'logs');
        $response->assertJsonPath('total', 3);
    }

    public function test_audit_logs_are_workspace_scoped(): void
    {
        $this->authenticateAsAdmin();

        AuditLog::factory()->count(2)->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $otherWorkspace = \App\Models\Workspace::factory()->create();
        AuditLog::factory()->count(5)->create([
            'workspace_id' => $otherWorkspace->id,
        ]);

        $response = $this->getJson('/api/audit-log');

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'logs');
        $response->assertJsonPath('total', 2);
    }

    public function test_audit_log_response_has_correct_structure(): void
    {
        $this->authenticateAsAdmin();

        AuditLog::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
            'action' => 'updated',
            'category' => 'Contact',
            'subcategory' => 'Contact',
            'source' => 'Web App',
        ]);

        $response = $this->getJson('/api/audit-log');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'logs' => [
                [
                    'id',
                    'category',
                    'subcategory',
                    'action',
                    'modified_by_name',
                    'modified_by_email',
                    'modified_by_avatar',
                    'assisted_by',
                    'source',
                    'source_url',
                    'date_of_change',
                ],
            ],
        ]);
    }

    public function test_action_is_formatted_correctly(): void
    {
        $this->authenticateAsAdmin();

        AuditLog::factory()->create([
            'workspace_id' => $this->workspace->id,
            'action' => 'created',
        ]);

        $response = $this->getJson('/api/audit-log');

        $response->assertStatus(200);
        $response->assertJsonFragment(['action' => 'Create']);
    }

    public function test_filter_by_category(): void
    {
        $this->authenticateAsAdmin();

        AuditLog::factory()->create([
            'workspace_id' => $this->workspace->id,
            'category' => 'Contact',
        ]);
        AuditLog::factory()->create([
            'workspace_id' => $this->workspace->id,
            'category' => 'Deal',
        ]);

        $response = $this->getJson('/api/audit-log?category=Contact');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'logs');
        $response->assertJsonPath('total', 1);
    }

    public function test_filter_by_tab_category(): void
    {
        $this->authenticateAsAdmin();

        AuditLog::factory()->create([
            'workspace_id' => $this->workspace->id,
            'category' => 'Login',
        ]);
        AuditLog::factory()->create([
            'workspace_id' => $this->workspace->id,
            'category' => 'Contact',
        ]);

        $response = $this->getJson('/api/audit-log?tab_category=Login');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'logs');
    }

    public function test_filter_by_action(): void
    {
        $this->authenticateAsAdmin();

        AuditLog::factory()->create([
            'workspace_id' => $this->workspace->id,
            'action' => 'created',
        ]);
        AuditLog::factory()->create([
            'workspace_id' => $this->workspace->id,
            'action' => 'deleted',
        ]);

        $response = $this->getJson('/api/audit-log?action=created');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'logs');
    }

    public function test_filter_by_date_from(): void
    {
        $this->authenticateAsAdmin();

        AuditLog::factory()->create([
            'workspace_id' => $this->workspace->id,
            'created_at' => now()->subDays(5),
        ]);
        AuditLog::factory()->create([
            'workspace_id' => $this->workspace->id,
            'created_at' => now()->subDays(60),
        ]);

        $response = $this->getJson('/api/audit-log?date_from=' . now()->subDays(30)->toIso8601String());

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'logs');
    }

    public function test_filter_by_modified_by_me(): void
    {
        $this->authenticateAsAdmin();

        AuditLog::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
        ]);
        AuditLog::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->standardUser->id,
        ]);

        $response = $this->getJson('/api/audit-log?modified_by_me=true');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'logs');
    }

    public function test_pagination(): void
    {
        $this->authenticateAsAdmin();

        AuditLog::factory()->count(5)->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson('/api/audit-log?page=1&page_size=2');

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'logs');
        $response->assertJsonPath('total', 5);
    }

    public function test_modified_by_name_derived_from_user(): void
    {
        $this->authenticateAsAdmin();

        $this->adminUser->update(['name' => 'John Admin']);

        AuditLog::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
        ]);

        $response = $this->getJson('/api/audit-log');

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'modified_by_name' => 'John Admin',
            'modified_by_email' => $this->adminUser->email,
        ]);
    }

    public function test_store_persists_record_reference_and_exposes_it_in_list(): void
    {
        $this->authenticateAsAdmin();
        $contact = \App\Models\Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->postJson('/api/audit-log', [
            'action' => 'updated',
            'category' => 'Contact',
            'subcategory' => 'Contact',
            'record_id' => $contact->id,
            'record_type' => 'App\Models\Contact',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('audit_logs', [
            'workspace_id' => $this->workspace->id,
            'action' => 'updated',
            'auditable_id' => $contact->id,
            'auditable_type' => 'App\Models\Contact',
        ]);

        $list = $this->getJson('/api/audit-log');

        $list->assertStatus(200);
        $list->assertJsonFragment([
            'record_id' => $contact->id,
            'record_type' => 'App\Models\Contact',
        ]);
    }

    public function test_filter_by_action_is_case_insensitive(): void
    {
        $this->authenticateAsAdmin();

        AuditLog::factory()->create([
            'workspace_id' => $this->workspace->id,
            'action' => 'Updated',
        ]);
        AuditLog::factory()->create([
            'workspace_id' => $this->workspace->id,
            'action' => 'deleted',
        ]);

        $response = $this->getJson('/api/audit-log?action=updated');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'logs');
    }

    public function test_filter_by_action_display_label_matches_stored_forms(): void
    {
        $this->authenticateAsAdmin();

        AuditLog::factory()->create([
            'workspace_id' => $this->workspace->id,
            'action' => 'updated',
        ]);
        AuditLog::factory()->create([
            'workspace_id' => $this->workspace->id,
            'action' => 'update',
        ]);
        AuditLog::factory()->create([
            'workspace_id' => $this->workspace->id,
            'action' => 'deleted',
        ]);

        $response = $this->getJson('/api/audit-log?action=Update');

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'logs');
    }

    public function test_store_normalizes_action_to_lowercase(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/audit-log', [
            'action' => 'Update',
            'category' => 'Contact',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('audit_logs', [
            'workspace_id' => $this->workspace->id,
            'action' => 'update',
        ]);
    }
}
