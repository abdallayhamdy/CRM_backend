<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Workspace;
use App\Models\Contact;
use App\Models\Company;
use App\Models\Deal;
use App\Models\Task;
use App\Models\Ticket;
use App\Models\Product;
use App\Models\Order;
use App\Models\Note;
use App\Models\Activity;
use App\Models\ActivityComment;
use App\Models\Document;
use App\Models\Pipeline;
use App\Models\UserViewPreference;
use Database\Seeders\RolesAndPermissionsSeeder;
use Spatie\Permission\PermissionRegistrar;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class RBACAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected Workspace $workspace;
    protected User $owner;
    protected User $admin;
    protected User $member;
    protected User $viewer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->workspace = Workspace::factory()->create(['status' => 'active']);

        app(PermissionRegistrar::class)->setPermissionsTeamId($this->workspace->id);
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->owner = $this->createUserWithRole('Workspace Owner');
        $this->admin = $this->createUserWithRole('Workspace Admin');
        $this->member = $this->createUserWithRole('Workspace Member');
        $this->viewer = $this->createUserWithRole('Workspace Viewer');
    }

    protected function createUserWithRole(string $roleName): User
    {
        $user = User::factory()->create([
            'workspace_id' => $this->workspace->id,
            'is_super_admin' => false,
        ]);

        $user->assignRole($roleName);

        $user->workspaces()->attach($this->workspace->id, [
            'role_name' => $roleName,
            'is_active' => true,
        ]);

        return $user;
    }

    protected function as(User $user): self
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->workspace->id);
        Sanctum::actingAs($user);
        return $this;
    }

    // =========================================================================
    //  SECTION 1: Role Permission Counts
    // =========================================================================

    public function test_owner_has_all_permissions(): void
    {
        $role = Role::where('name', 'Workspace Owner')->where('guard_name', 'sanctum')->first();
        $perms = $role->permissions->pluck('name')->toArray();
        $allPerms = Permission::where('guard_name', 'sanctum')->pluck('name')->toArray();

        sort($perms);
        sort($allPerms);

        $this->assertEquals($allPerms, $perms, 'Owner must have ALL permissions');
    }

    public function test_admin_lacks_excluded_permissions(): void
    {
        $role = Role::where('name', 'Workspace Admin')->where('guard_name', 'sanctum')->first();
        $perms = $role->permissions->pluck('name')->toArray();

        $exclusions = [
            'manage_billing', 'delete_workspace',
            'manage_integrations', 'manage_automations',
            'manage_custom_fields', 'manage_pipelines',
            'manage_properties', 'customize_crm_layout',
        ];

        foreach ($exclusions as $perm) {
            $this->assertNotContains($perm, $perms, "Admin must NOT have: {$perm}");
        }
    }

    public function test_member_has_correct_permissions(): void
    {
        $role = Role::where('name', 'Workspace Member')->where('guard_name', 'sanctum')->first();
        $perms = $role->permissions->pluck('name')->toArray();

        $mustHave = [
            'view_contacts_all', 'create_contacts', 'edit_contacts_own',
            'view_companies_all', 'create_companies', 'edit_companies_own',
            'view_deals_all', 'create_deals', 'edit_deals_own',
            'view_tickets_all', 'create_tickets', 'edit_tickets_own',
            'view_tasks_all', 'create_tasks', 'edit_tasks_own',
            'view_products_all', 'view_orders_all', 'view_documents_all',
            'view_notes_all', 'create_notes', 'edit_notes_own',
            'view_activities_all', 'create_activities', 'edit_activities_own',
            'edit_activity_comments_own', 'delete_activity_comments_own',
            'view_dashboard', 'view_reports',
            'view_workspace_members', 'view_properties',
        ];

        foreach ($mustHave as $perm) {
            $this->assertContains($perm, $perms, "Member must have: {$perm}");
        }

        $mustNotHave = [
            'create_products', 'create_pipelines', 'create_stages',
            'manage_users', 'manage_roles', 'manage_settings',
            'manage_audit_log', 'manage_backup', 'manage_billing',
            'delete_workspace', 'invite_users', 'manage_workspace_members',
            'remove_workspace_members', 'manage_properties',
            'import_contacts', 'export_contacts', 'bulk_delete_contacts',
        ];

        foreach ($mustNotHave as $perm) {
            $this->assertNotContains($perm, $perms, "Member must NOT have: {$perm}");
        }
    }

    public function test_viewer_has_only_view_permissions(): void
    {
        $role = Role::where('name', 'Workspace Viewer')->where('guard_name', 'sanctum')->first();
        $perms = $role->permissions->pluck('name')->toArray();

        foreach ($perms as $perm) {
            $this->assertTrue(
                str_starts_with($perm, 'view_'),
                "Viewer permission must start with 'view_': found '{$perm}'"
            );
        }

        $this->assertContains('view_contacts_all', $perms);
        $this->assertContains('view_companies_all', $perms);
        $this->assertContains('view_deals_all', $perms);
        $this->assertContains('view_tasks_all', $perms);
        $this->assertContains('view_tickets_all', $perms);
        $this->assertContains('view_products_all', $perms);
        $this->assertContains('view_orders_all', $perms);
        $this->assertContains('view_documents_all', $perms);
        $this->assertContains('view_notes_all', $perms);
        $this->assertContains('view_activities_all', $perms);
        $this->assertContains('view_pipelines_all', $perms);
        $this->assertContains('view_stages_all', $perms);
        $this->assertContains('view_dashboard', $perms);
        $this->assertContains('view_reports', $perms);
        $this->assertContains('view_workspace_members', $perms);
        $this->assertContains('view_properties', $perms);
    }

    public function test_dead_permissions_do_not_exist(): void
    {
        $deadPerms = [
            'edit_products_own', 'delete_products_own',
            'edit_pipelines_own', 'delete_pipelines_own',
            'edit_stages_own', 'delete_stages_own',
        ];

        foreach ($deadPerms as $perm) {
            $this->assertDatabaseMissing('permissions', [
                'name' => $perm,
                'guard_name' => 'sanctum',
            ]);
        }
    }

    // =========================================================================
    //  SECTION 2: Contacts CRUD
    // =========================================================================

    public function test_owner_can_create_contact(): void
    {
        $this->as($this->owner);
        $response = $this->postJson('/api/contacts', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
        ]);
        $response->assertStatus(201);
    }

    public function test_admin_can_create_contact(): void
    {
        $this->as($this->admin);
        $response = $this->postJson('/api/contacts', [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
        ]);
        $response->assertStatus(201);
    }

    public function test_member_can_create_contact(): void
    {
        $this->as($this->member);
        $response = $this->postJson('/api/contacts', [
            'first_name' => 'Bob',
            'last_name' => 'Smith',
        ]);
        $response->assertStatus(201);
    }

    public function test_viewer_cannot_create_contact(): void
    {
        $this->as($this->viewer);
        $response = $this->postJson('/api/contacts', [
            'first_name' => 'No',
            'last_name' => 'Access',
        ]);
        $response->assertStatus(403);
    }

    public function test_owner_can_list_contacts(): void
    {
        Contact::factory()->count(2)->create(['workspace_id' => $this->workspace->id]);
        $this->as($this->owner);
        $response = $this->getJson('/api/contacts');
        $response->assertOk();
    }

    public function test_viewer_can_list_contacts(): void
    {
        Contact::factory()->count(2)->create(['workspace_id' => $this->workspace->id]);
        $this->as($this->viewer);
        $response = $this->getJson('/api/contacts');
        $response->assertOk();
    }

    public function test_member_can_edit_own_contact(): void
    {
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
            'created_by' => $this->member->id,
            'assigned_to' => $this->member->id,
        ]);

        $this->as($this->member);
        $response = $this->putJson("/api/contacts/{$contact->id}", [
            'first_name' => 'Updated',
        ]);
        $response->assertOk();
    }

    public function test_member_cannot_edit_others_contact(): void
    {
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
            'created_by' => $this->admin->id,
            'assigned_to' => $this->admin->id,
        ]);

        $this->as($this->member);
        $response = $this->putJson("/api/contacts/{$contact->id}", [
            'first_name' => 'Hacked',
        ]);
        $response->assertStatus(403);
    }

    public function test_viewer_cannot_edit_contact(): void
    {
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $this->as($this->viewer);
        $response = $this->putJson("/api/contacts/{$contact->id}", [
            'first_name' => 'Hacked',
        ]);
        $response->assertStatus(403);
    }

    public function test_member_can_delete_own_contact(): void
    {
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
            'created_by' => $this->member->id,
            'assigned_to' => $this->member->id,
        ]);

        $this->as($this->member);
        $response = $this->deleteJson("/api/contacts/{$contact->id}");
        $response->assertOk();
    }

    public function test_member_cannot_delete_others_contact(): void
    {
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
            'created_by' => $this->admin->id,
            'assigned_to' => $this->admin->id,
        ]);

        $this->as($this->member);
        $response = $this->deleteJson("/api/contacts/{$contact->id}");
        $response->assertStatus(403);
    }

    public function test_viewer_cannot_delete_contact(): void
    {
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $this->as($this->viewer);
        $response = $this->deleteJson("/api/contacts/{$contact->id}");
        $response->assertStatus(403);
    }

    public function test_unauthenticated_cannot_access_contacts(): void
    {
        $response = $this->getJson('/api/contacts');
        $response->assertStatus(401);
    }

    // =========================================================================
    //  SECTION 3: Companies CRUD
    // =========================================================================

    public function test_owner_can_create_company(): void
    {
        $this->as($this->owner);
        $response = $this->postJson('/api/companies', [
            'name' => 'Acme Corp',
        ]);
        $response->assertStatus(201);
    }

    public function test_member_can_create_company(): void
    {
        $this->as($this->member);
        $response = $this->postJson('/api/companies', [
            'name' => 'Small Corp',
        ]);
        $response->assertStatus(201);
    }

    public function test_viewer_cannot_create_company(): void
    {
        $this->as($this->viewer);
        $response = $this->postJson('/api/companies', [
            'name' => 'No Corp',
        ]);
        $response->assertStatus(403);
    }

    public function test_member_can_edit_own_company(): void
    {
        $company = Company::factory()->create([
            'workspace_id' => $this->workspace->id,
            'created_by' => $this->member->id,
        ]);

        $this->as($this->member);
        $response = $this->putJson("/api/companies/{$company->id}", [
            'name' => 'Updated Corp',
        ]);
        $response->assertOk();
    }

    public function test_viewer_can_list_companies(): void
    {
        Company::factory()->count(2)->create(['workspace_id' => $this->workspace->id]);
        $this->as($this->viewer);
        $response = $this->getJson('/api/companies');
        $response->assertOk();
    }

    // =========================================================================
    //  SECTION 4: Deals CRUD
    // =========================================================================

    public function test_owner_can_create_deal(): void
    {
        $this->as($this->owner);
        $response = $this->postJson('/api/deals', [
            'title' => 'Big Deal',
            'amount' => 10000,
            'status' => 'open',
        ]);
        $response->assertStatus(201);
    }

    public function test_member_can_create_deal(): void
    {
        $this->as($this->member);
        $response = $this->postJson('/api/deals', [
            'title' => 'Medium Deal',
            'amount' => 5000,
        ]);
        $response->assertStatus(201);
    }

    public function test_viewer_cannot_create_deal(): void
    {
        $this->as($this->viewer);
        $response = $this->postJson('/api/deals', [
            'title' => 'No Deal',
        ]);
        $response->assertStatus(403);
    }

    public function test_member_can_edit_own_deal(): void
    {
        $deal = Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
            'assigned_to' => $this->member->id,
        ]);

        $this->as($this->member);
        $response = $this->putJson("/api/deals/{$deal->id}", [
            'title' => 'Updated Deal',
        ]);
        $response->assertOk();
    }

    public function test_member_cannot_edit_others_deal(): void
    {
        $deal = Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
            'assigned_to' => $this->admin->id,
        ]);

        $this->as($this->member);
        $response = $this->putJson("/api/deals/{$deal->id}", [
            'title' => 'Hacked Deal',
        ]);
        $response->assertStatus(403);
    }

    public function test_viewer_cannot_delete_deal(): void
    {
        $deal = Deal::factory()->create(['workspace_id' => $this->workspace->id]);
        $this->as($this->viewer);
        $response = $this->deleteJson("/api/deals/{$deal->id}");
        $response->assertStatus(403);
    }

    // =========================================================================
    //  SECTION 5: Tasks CRUD
    // =========================================================================

    public function test_owner_can_create_task(): void
    {
        $this->as($this->owner);
        $response = $this->postJson('/api/tasks', [
            'title' => 'Important Task',
        ]);
        $response->assertStatus(201);
    }

    public function test_member_can_create_task(): void
    {
        $this->as($this->member);
        $response = $this->postJson('/api/tasks', [
            'title' => 'My Task',
        ]);
        $response->assertStatus(201);
    }

    public function test_viewer_cannot_create_task(): void
    {
        $this->as($this->viewer);
        $response = $this->postJson('/api/tasks', [
            'title' => 'No Task',
        ]);
        $response->assertStatus(403);
    }

    public function test_member_can_edit_own_task(): void
    {
        $task = Task::factory()->create([
            'workspace_id' => $this->workspace->id,
            'created_by' => $this->member->id,
            'assigned_to' => $this->member->id,
        ]);

        $this->as($this->member);
        $response = $this->putJson("/api/tasks/{$task->id}", [
            'title' => 'Updated Task',
        ]);
        $response->assertOk();
    }

    public function test_member_cannot_edit_others_task(): void
    {
        $task = Task::factory()->create([
            'workspace_id' => $this->workspace->id,
            'created_by' => $this->admin->id,
            'assigned_to' => $this->admin->id,
        ]);

        $this->as($this->member);
        $response = $this->putJson("/api/tasks/{$task->id}", [
            'title' => 'Hacked Task',
        ]);
        $response->assertStatus(403);
    }

    public function test_member_can_delete_own_task(): void
    {
        $task = Task::factory()->create([
            'workspace_id' => $this->workspace->id,
            'created_by' => $this->member->id,
            'assigned_to' => $this->member->id,
        ]);

        $this->as($this->member);
        $response = $this->deleteJson("/api/tasks/{$task->id}");
        $response->assertOk();
    }

    public function test_viewer_can_list_tasks(): void
    {
        Task::factory()->count(2)->create(['workspace_id' => $this->workspace->id]);
        $this->as($this->viewer);
        $response = $this->getJson('/api/tasks');
        $response->assertOk();
    }

    // =========================================================================
    //  SECTION 6: Tickets CRUD
    // =========================================================================

    public function test_owner_can_create_ticket(): void
    {
        $this->as($this->owner);
        $response = $this->postJson('/api/tickets', [
            'subject' => 'Urgent Issue',
        ]);
        $response->assertStatus(201);
    }

    public function test_member_can_create_ticket(): void
    {
        $this->as($this->member);
        $response = $this->postJson('/api/tickets', [
            'subject' => 'My Ticket',
        ]);
        $response->assertStatus(201);
    }

    public function test_viewer_cannot_create_ticket(): void
    {
        $this->as($this->viewer);
        $response = $this->postJson('/api/tickets', [
            'subject' => 'No Ticket',
        ]);
        $response->assertStatus(403);
    }

    public function test_member_can_edit_own_ticket(): void
    {
        $ticket = Ticket::factory()->create([
            'workspace_id' => $this->workspace->id,
            'assigned_to' => $this->member->id,
        ]);

        $this->as($this->member);
        $response = $this->putJson("/api/tickets/{$ticket->id}", [
            'subject' => 'Updated Ticket',
        ]);
        $response->assertOk();
    }

    public function test_member_cannot_edit_others_ticket(): void
    {
        $ticket = Ticket::factory()->create([
            'workspace_id' => $this->workspace->id,
            'assigned_to' => $this->admin->id,
        ]);

        $this->as($this->member);
        $response = $this->putJson("/api/tickets/{$ticket->id}", [
            'subject' => 'Hacked Ticket',
        ]);
        $response->assertStatus(403);
    }

    public function test_viewer_can_list_tickets(): void
    {
        Ticket::factory()->count(2)->create(['workspace_id' => $this->workspace->id]);
        $this->as($this->viewer);
        $response = $this->getJson('/api/tickets');
        $response->assertOk();
    }

    // =========================================================================
    //  SECTION 7: Products (owner/admin only)
    // =========================================================================

    public function test_owner_can_create_product(): void
    {
        $this->as($this->owner);
        $response = $this->postJson('/api/products', [
            'name' => 'Widget',
            'unit_price' => 29.99,
        ]);
        $response->assertStatus(201);
    }

    public function test_admin_can_create_product(): void
    {
        $this->as($this->admin);
        $response = $this->postJson('/api/products', [
            'name' => 'Gadget',
            'unit_price' => 49.99,
        ]);
        $response->assertStatus(201);
    }

    public function test_member_cannot_create_product(): void
    {
        $this->as($this->member);
        $response = $this->postJson('/api/products', [
            'name' => 'No Widget',
        ]);
        $response->assertStatus(403);
    }

    public function test_viewer_cannot_create_product(): void
    {
        $this->as($this->viewer);
        $response = $this->postJson('/api/products', [
            'name' => 'No Product',
        ]);
        $response->assertStatus(403);
    }

    public function test_viewer_can_list_products(): void
    {
        Product::factory()->create(['workspace_id' => $this->workspace->id, 'name' => 'P1']);
        $this->as($this->viewer);
        $response = $this->getJson('/api/products');
        $response->assertOk();
    }

    public function test_admin_can_edit_product(): void
    {
        $product = Product::factory()->create(['workspace_id' => $this->workspace->id]);
        $this->as($this->admin);
        $response = $this->putJson("/api/products/{$product->id}", [
            'name' => 'Updated Product',
        ]);
        $response->assertOk();
    }

    public function test_member_cannot_edit_product(): void
    {
        $product = Product::factory()->create(['workspace_id' => $this->workspace->id]);
        $this->as($this->member);
        $response = $this->putJson("/api/products/{$product->id}", [
            'name' => 'Hacked Product',
        ]);
        $response->assertStatus(403);
    }

    // =========================================================================
    //  SECTION 8: Orders
    // =========================================================================

    public function test_owner_can_create_order(): void
    {
        $this->as($this->owner);
        $response = $this->postJson('/api/orders', [
            'title' => 'Order 100',
        ]);
        $response->assertStatus(201);
    }

    public function test_member_can_create_order(): void
    {
        $this->as($this->member);
        $response = $this->postJson('/api/orders', [
            'title' => 'My Order',
        ]);
        $response->assertStatus(201);
    }

    public function test_viewer_cannot_create_order(): void
    {
        $this->as($this->viewer);
        $response = $this->postJson('/api/orders', [
            'title' => 'No Order',
        ]);
        $response->assertStatus(403);
    }

    public function test_member_can_edit_own_order(): void
    {
        $order = Order::factory()->create([
            'workspace_id' => $this->workspace->id,
            'owner_id' => $this->member->id,
        ]);

        $this->as($this->member);
        $response = $this->putJson("/api/orders/{$order->id}", [
            'title' => 'Updated Order',
        ]);
        $response->assertOk();
    }

    public function test_member_cannot_edit_others_order(): void
    {
        $order = Order::factory()->create([
            'workspace_id' => $this->workspace->id,
            'owner_id' => $this->admin->id,
        ]);

        $this->as($this->member);
        $response = $this->putJson("/api/orders/{$order->id}", [
            'title' => 'Hacked Order',
        ]);
        $response->assertStatus(403);
    }

    // =========================================================================
    //  SECTION 9: Notes
    // =========================================================================

    public function test_owner_can_create_note(): void
    {
        $this->as($this->owner);
        $response = $this->postJson('/api/notes', [
            'content' => 'Important note',
        ]);
        $response->assertStatus(201);
    }

    public function test_member_can_create_note(): void
    {
        $this->as($this->member);
        $response = $this->postJson('/api/notes', [
            'content' => 'My note',
        ]);
        $response->assertStatus(201);
    }

    public function test_viewer_cannot_create_note(): void
    {
        $this->as($this->viewer);
        $response = $this->postJson('/api/notes', [
            'content' => 'No note',
        ]);
        $response->assertStatus(403);
    }

    public function test_member_can_edit_own_note(): void
    {
        $note = Note::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->member->id,
        ]);

        $this->as($this->member);
        $response = $this->putJson("/api/notes/{$note->id}", [
            'content' => 'Updated note',
        ]);
        $response->assertOk();
    }

    public function test_member_cannot_edit_others_note(): void
    {
        $note = Note::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->admin->id,
        ]);

        $this->as($this->member);
        $response = $this->putJson("/api/notes/{$note->id}", [
            'content' => 'Hacked note',
        ]);
        $response->assertStatus(403);
    }

    // =========================================================================
    //  SECTION 10: Activities
    // =========================================================================

    public function test_owner_can_create_activity(): void
    {
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
            'created_by' => $this->owner->id,
        ]);

        $this->as($this->owner);
        $response = $this->postJson('/api/activities', [
            'type' => 'call',
            'title' => 'Sales call',
            'contact_id' => $contact->id,
        ]);
        $response->assertStatus(201);
    }

    public function test_member_can_create_activity(): void
    {
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
            'created_by' => $this->member->id,
        ]);

        $this->as($this->member);
        $response = $this->postJson('/api/activities', [
            'type' => 'email',
            'title' => 'Follow up',
            'contact_id' => $contact->id,
        ]);
        $response->assertStatus(201);
    }

    public function test_viewer_cannot_create_activity(): void
    {
        $this->as($this->viewer);
        $response = $this->postJson('/api/activities', [
            'type' => 'call',
            'title' => 'No activity',
        ]);
        $response->assertStatus(403);
    }

    public function test_member_can_edit_own_activity(): void
    {
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
            'created_by' => $this->member->id,
        ]);
        $activity = Activity::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->member->id,
            'activitable_type' => Contact::class,
            'activitable_id' => $contact->id,
        ]);

        $this->as($this->member);
        $response = $this->patchJson("/api/activities/{$activity->id}", [
            'title' => 'Updated activity',
        ]);
        $response->assertOk();
    }

    public function test_member_cannot_edit_others_activity(): void
    {
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
            'created_by' => $this->admin->id,
        ]);
        $activity = Activity::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->admin->id,
            'activitable_type' => Contact::class,
            'activitable_id' => $contact->id,
        ]);

        $this->as($this->member);
        $response = $this->patchJson("/api/activities/{$activity->id}", [
            'title' => 'Hacked activity',
        ]);
        $response->assertStatus(403);
    }

    public function test_viewer_can_list_activities(): void
    {
        Activity::factory()->create(['workspace_id' => $this->workspace->id]);
        $this->as($this->viewer);
        $response = $this->getJson('/api/activities');
        $response->assertOk();
    }

    // =========================================================================
    //  SECTION 11: Activity Comments
    // =========================================================================

    public function test_member_can_create_comment(): void
    {
        $activity = Activity::factory()->create(['workspace_id' => $this->workspace->id]);

        $this->as($this->member);
        $response = $this->postJson('/api/activity-comments', [
            'activity_id' => $activity->id,
            'content' => 'Good call',
        ]);
        $response->assertStatus(201);
    }

    public function test_viewer_cannot_create_comment(): void
    {
        $activity = Activity::factory()->create(['workspace_id' => $this->workspace->id]);

        $this->as($this->viewer);
        $response = $this->postJson('/api/activity-comments', [
            'activity_id' => $activity->id,
            'content' => 'No comment',
        ]);
        $response->assertStatus(403);
    }

    public function test_member_can_edit_own_comment(): void
    {
        $activity = Activity::factory()->create(['workspace_id' => $this->workspace->id]);
        $comment = ActivityComment::factory()->create([
            'activity_id' => $activity->id,
            'user_id' => $this->member->id,
            'workspace_id' => $this->workspace->id,
        ]);

        $this->as($this->member);
        $response = $this->putJson("/api/activity-comments/{$comment->id}", [
            'content' => 'Updated comment',
        ]);
        $response->assertOk();
    }

    public function test_member_cannot_edit_others_comment(): void
    {
        $activity = Activity::factory()->create(['workspace_id' => $this->workspace->id]);
        $comment = ActivityComment::factory()->create([
            'activity_id' => $activity->id,
            'user_id' => $this->admin->id,
            'workspace_id' => $this->workspace->id,
        ]);

        $this->as($this->member);
        $response = $this->putJson("/api/activity-comments/{$comment->id}", [
            'content' => 'Hacked comment',
        ]);
        $response->assertStatus(403);
    }

    // =========================================================================
    //  SECTION 12: Pipelines (owner/admin only)
    // =========================================================================

    public function test_owner_can_create_pipeline(): void
    {
        $this->as($this->owner);
        $response = $this->postJson('/api/pipelines', [
            'name' => 'Sales Pipeline',
        ]);
        $response->assertStatus(201);
    }

    public function test_admin_can_create_pipeline(): void
    {
        $this->as($this->admin);
        $response = $this->postJson('/api/pipelines', [
            'name' => 'Admin Pipeline',
        ]);
        $response->assertStatus(201);
    }

    public function test_member_cannot_create_pipeline(): void
    {
        $this->as($this->member);
        $response = $this->postJson('/api/pipelines', [
            'name' => 'No Pipeline',
        ]);
        $response->assertStatus(403);
    }

    public function test_viewer_cannot_create_pipeline(): void
    {
        $this->as($this->viewer);
        $response = $this->postJson('/api/pipelines', [
            'name' => 'Viewer Pipeline',
        ]);
        $response->assertStatus(403);
    }

    public function test_viewer_can_list_pipelines(): void
    {
        Pipeline::factory()->create(['workspace_id' => $this->workspace->id]);
        $this->as($this->viewer);
        $response = $this->getJson('/api/pipelines');
        $response->assertOk();
    }

    // =========================================================================
    //  SECTION 13: UserViewPreference (own only)
    // =========================================================================

    public function test_member_can_create_own_preference(): void
    {
        $this->as($this->member);
        $response = $this->postJson('/api/preferences', [
            'object_type' => 'contacts',
            'visible_columns' => ['first_name', 'last_name'],
        ]);
        $response->assertStatus(201);
    }

    public function test_member_can_list_own_preferences(): void
    {
        UserViewPreference::create([
            'user_id' => $this->member->id,
            'object_type' => 'contacts',
            'visible_columns' => ['first_name'],
            'column_order' => ['first_name'],
        ]);

        $this->as($this->member);
        $response = $this->getJson('/api/preferences');
        $response->assertOk();
    }

    public function test_member_cannot_view_others_preference(): void
    {
        $pref = UserViewPreference::create([
            'user_id' => $this->admin->id,
            'object_type' => 'contacts',
            'visible_columns' => ['first_name'],
            'column_order' => ['first_name'],
        ]);

        $this->as($this->member);
        $response = $this->getJson("/api/preferences/{$pref->id}");
        $response->assertStatus(403);
    }

    public function test_member_cannot_update_others_preference(): void
    {
        $pref = UserViewPreference::create([
            'user_id' => $this->admin->id,
            'object_type' => 'contacts',
            'visible_columns' => ['first_name'],
            'column_order' => ['first_name'],
        ]);

        $this->as($this->member);
        $response = $this->putJson("/api/preferences/{$pref->id}", [
            'visible_columns' => ['email'],
        ]);
        $response->assertStatus(403);
    }

    // =========================================================================
    //  SECTION 14: Dashboard
    // =========================================================================

    public function test_owner_can_view_dashboard(): void
    {
        $this->as($this->owner);
        $response = $this->getJson('/api/dashboard/overview');
        $response->assertOk();
    }

    public function test_member_can_view_dashboard(): void
    {
        $this->as($this->member);
        $response = $this->getJson('/api/dashboard/overview');
        $response->assertOk();
    }

    public function test_viewer_can_view_dashboard(): void
    {
        $this->as($this->viewer);
        $response = $this->getJson('/api/dashboard/overview');
        $response->assertOk();
    }

    public function test_unauthenticated_cannot_view_dashboard(): void
    {
        $response = $this->getJson('/api/dashboard/overview');
        $response->assertStatus(401);
    }

    // =========================================================================
    //  SECTION 15: Reports
    // =========================================================================

    public function test_owner_can_view_reports(): void
    {
        $this->as($this->owner);
        $response = $this->getJson('/api/reports/executive');
        // Authorization passes (not 403). ReportController uses MySQL DATE_FORMAT
        // which crashes on SQLite in-memory test DB (500). We only verify auth here.
        $this->assertNotEquals(403, $response->status());
    }

    public function test_member_can_view_reports(): void
    {
        $this->as($this->member);
        $response = $this->getJson('/api/reports/executive');
        $this->assertNotEquals(403, $response->status());
    }

    public function test_viewer_can_view_reports(): void
    {
        $this->as($this->viewer);
        $response = $this->getJson('/api/reports/executive');
        $this->assertNotEquals(403, $response->status());
    }

    // =========================================================================
    //  SECTION 16: Audit Log
    // =========================================================================

    public function test_owner_can_view_audit_log(): void
    {
        $this->as($this->owner);
        $response = $this->getJson('/api/audit-log');
        $response->assertOk();
    }

    public function test_admin_can_view_audit_log(): void
    {
        $this->as($this->admin);
        $response = $this->getJson('/api/audit-log');
        $response->assertOk();
    }

    public function test_member_cannot_view_audit_log(): void
    {
        $this->as($this->member);
        $response = $this->getJson('/api/audit-log');
        $response->assertStatus(403);
    }

    public function test_viewer_cannot_view_audit_log(): void
    {
        $this->as($this->viewer);
        $response = $this->getJson('/api/audit-log');
        $response->assertStatus(403);
    }

    // =========================================================================
    //  SECTION 17: Backups
    // =========================================================================

    public function test_owner_can_view_backups(): void
    {
        $this->as($this->owner);
        $response = $this->getJson('/api/settings/backups');
        $response->assertOk();
    }

    public function test_admin_can_view_backups(): void
    {
        $this->as($this->admin);
        $response = $this->getJson('/api/settings/backups');
        $response->assertOk();
    }

    public function test_member_cannot_view_backups(): void
    {
        $this->as($this->member);
        $response = $this->getJson('/api/settings/backups');
        $response->assertStatus(403);
    }

    public function test_viewer_cannot_view_backups(): void
    {
        $this->as($this->viewer);
        $response = $this->getJson('/api/settings/backups');
        $response->assertStatus(403);
    }

    // =========================================================================
    //  SECTION 18: Workspace Settings
    // =========================================================================

    public function test_owner_can_view_settings(): void
    {
        $this->as($this->owner);
        $response = $this->getJson('/api/workspace/settings');
        $response->assertOk();
    }

    public function test_admin_can_view_settings(): void
    {
        $this->as($this->admin);
        $response = $this->getJson('/api/workspace/settings');
        $response->assertOk();
    }

    public function test_member_cannot_view_settings(): void
    {
        $this->as($this->member);
        $response = $this->getJson('/api/workspace/settings');
        $response->assertStatus(403);
    }

    public function test_viewer_cannot_view_settings(): void
    {
        $this->as($this->viewer);
        $response = $this->getJson('/api/workspace/settings');
        $response->assertStatus(403);
    }

    // =========================================================================
    //  SECTION 19: Invitations
    // =========================================================================

    public function test_owner_can_send_invitation(): void
    {
        $this->as($this->owner);
        $response = $this->postJson('/api/invitations', [
            'email' => 'newuser@example.com',
            'role_name' => 'Workspace Member',
        ]);
        $response->assertStatus(201);
    }

    public function test_admin_can_send_invitation(): void
    {
        $this->as($this->admin);
        $response = $this->postJson('/api/invitations', [
            'email' => 'admininvite@example.com',
            'role_name' => 'Workspace Member',
        ]);
        $response->assertStatus(201);
    }

    public function test_member_cannot_send_invitation(): void
    {
        $this->as($this->member);
        $response = $this->postJson('/api/invitations', [
            'email' => 'noaccess@example.com',
            'role_name' => 'Workspace Member',
        ]);
        $response->assertStatus(403);
    }

    public function test_viewer_cannot_send_invitation(): void
    {
        $this->as($this->viewer);
        $response = $this->postJson('/api/invitations', [
            'email' => 'viewer@example.com',
            'role_name' => 'Workspace Viewer',
        ]);
        $response->assertStatus(403);
    }

    public function test_owner_can_list_invitations(): void
    {
        $this->as($this->owner);
        $response = $this->getJson('/api/invitations');
        $response->assertOk();
    }

    public function test_admin_can_list_invitations(): void
    {
        $this->as($this->admin);
        $response = $this->getJson('/api/invitations');
        $response->assertOk();
    }

    public function test_member_cannot_list_invitations(): void
    {
        $this->as($this->member);
        $response = $this->getJson('/api/invitations');
        $response->assertStatus(403);
    }

    public function test_viewer_cannot_list_invitations(): void
    {
        $this->as($this->viewer);
        $response = $this->getJson('/api/invitations');
        $response->assertStatus(403);
    }

    // =========================================================================
    //  SECTION 20: Workspace Members
    // =========================================================================

    public function test_owner_can_view_members(): void
    {
        $this->as($this->owner);
        $response = $this->getJson('/api/workspace/members');
        $response->assertOk();
    }

    public function test_admin_can_view_members(): void
    {
        $this->as($this->admin);
        $response = $this->getJson('/api/workspace/members');
        $response->assertOk();
    }

    public function test_member_can_view_members(): void
    {
        $this->as($this->member);
        $response = $this->getJson('/api/workspace/members');
        $response->assertOk();
    }

    public function test_viewer_can_view_members(): void
    {
        $this->as($this->viewer);
        $response = $this->getJson('/api/workspace/members');
        $response->assertOk();
    }

    // =========================================================================
    //  SECTION 21: Super Admin Endpoints
    // =========================================================================

    public function test_super_admin_can_access_super_admin_routes(): void
    {
        $superAdmin = User::factory()->superAdmin()->create();
        Sanctum::actingAs($superAdmin);

        $response = $this->getJson('/api/super-admin/workspaces');
        $response->assertOk();
    }

    public function test_owner_cannot_access_super_admin_routes(): void
    {
        $this->as($this->owner);
        $response = $this->getJson('/api/super-admin/workspaces');
        $response->assertStatus(403);
    }

    public function test_admin_cannot_access_super_admin_routes(): void
    {
        $this->as($this->admin);
        $response = $this->getJson('/api/super-admin/workspaces');
        $response->assertStatus(403);
    }

    public function test_member_cannot_access_super_admin_routes(): void
    {
        $this->as($this->member);
        $response = $this->getJson('/api/super-admin/workspaces');
        $response->assertStatus(403);
    }

    public function test_viewer_cannot_access_super_admin_routes(): void
    {
        $this->as($this->viewer);
        $response = $this->getJson('/api/super-admin/workspaces');
        $response->assertStatus(403);
    }

    public function test_super_admin_bypasses_all_policies(): void
    {
        $superAdmin = User::factory()->superAdmin()->create();
        Sanctum::actingAs($superAdmin);

        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->putJson("/api/contacts/{$contact->id}", [
            'first_name' => 'Super Updated',
        ]);

        $this->assertNotEquals(403, $response->status(), 'Super admin should NOT get 403');
    }

    // =========================================================================
    //  SECTION 22: Cross-Workspace Isolation
    // =========================================================================

    public function test_member_cannot_access_other_workspace_contact(): void
    {
        $otherWorkspace = Workspace::factory()->create(['status' => 'active']);
        $otherContact = Contact::factory()->create(['workspace_id' => $otherWorkspace->id]);

        $this->as($this->member);
        $response = $this->getJson("/api/contacts/{$otherContact->id}");
        $response->assertStatus(404);
    }

    public function test_member_cannot_update_other_workspace_contact(): void
    {
        $otherWorkspace = Workspace::factory()->create(['status' => 'active']);
        $otherContact = Contact::factory()->create(['workspace_id' => $otherWorkspace->id]);

        $this->as($this->member);
        $response = $this->putJson("/api/contacts/{$otherContact->id}", [
            'first_name' => 'Hacked',
        ]);
        $response->assertStatus(404);
    }

    public function test_member_cannot_delete_other_workspace_contact(): void
    {
        $otherWorkspace = Workspace::factory()->create(['status' => 'active']);
        $otherContact = Contact::factory()->create(['workspace_id' => $otherWorkspace->id]);

        $this->as($this->member);
        $response = $this->deleteJson("/api/contacts/{$otherContact->id}");
        $response->assertStatus(404);
    }

    // =========================================================================
    //  SECTION 23: Search (permission-gated per entity)
    // =========================================================================

    public function test_owner_can_use_global_search(): void
    {
        $this->as($this->owner);
        $response = $this->getJson('/api/search?q=test');
        $response->assertOk();
    }

    public function test_viewer_can_use_global_search(): void
    {
        $this->as($this->viewer);
        $response = $this->getJson('/api/search?q=test');
        $response->assertOk();
    }

    // =========================================================================
    //  SECTION 24: Panel Configs (manage_panel_configs)
    // =========================================================================

    public function test_owner_can_view_panel_configs(): void
    {
        $this->as($this->owner);
        $response = $this->getJson('/api/panel-configs/contacts');
        $response->assertOk();
    }

    public function test_admin_can_view_panel_configs(): void
    {
        $this->as($this->admin);
        $response = $this->getJson('/api/panel-configs/contacts');
        $response->assertOk();
    }

    public function test_member_cannot_view_panel_configs(): void
    {
        $this->as($this->member);
        $response = $this->getJson('/api/panel-configs/contacts');
        $response->assertStatus(403);
    }

    // =========================================================================
    //  SECTION 25: Roles listing
    // =========================================================================

    public function test_admin_can_list_roles(): void
    {
        $this->as($this->admin);
        $response = $this->getJson('/api/roles');
        $response->assertOk();
    }

    public function test_viewer_cannot_list_roles(): void
    {
        $this->as($this->viewer);
        $response = $this->getJson('/api/roles');
        $response->assertStatus(403);
    }
}
