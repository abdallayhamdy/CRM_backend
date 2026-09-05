<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Contact;
use App\Models\Company;
use App\Models\Deal;
use App\Models\PermissionSet;
use App\Models\Task;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class PermissionSetEnforcementTest extends TestCase
{
    use TestHelpers;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpWorkspace();
        $this->adminUser->syncRoles('Workspace Owner');
        $this->standardUser->syncRoles('Workspace Member');
    }

    private function makeDeal(User $owner): Deal
    {
        return Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
            'assigned_to' => $owner->id,
        ]);
    }

    private function makeContact(User $owner): Contact
    {
        return Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
            'assigned_to' => $owner->id,
            'created_by' => $owner->id,
        ]);
    }

    private function makeCompany(User $owner): Company
    {
        return Company::factory()->create([
            'workspace_id' => $this->workspace->id,
            'assigned_to' => $owner->id,
            'created_by' => $owner->id,
        ]);
    }

    private function makeTask(User $owner): Task
    {
        return Task::factory()->create([
            'workspace_id' => $this->workspace->id,
            'assigned_to' => $owner->id,
            'created_by' => $owner->id,
            'taskable_type' => \App\Models\Company::class,
            'taskable_id' => $this->makeCompany($owner)->id,
        ]);
    }

    private function assignSet(User $user, array $permissions): PermissionSet
    {
        $set = PermissionSet::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Set ' . fake()->unique()->words(2, true),
            'created_by' => $this->adminUser->id,
        ]);

        foreach ($permissions as $permission) {
            $set->permissions()->create($permission);
        }

        $set->users()->attach($user->id);

        return $set;
    }

    // ── Control: baseline behaviour without any permission set ────────────

    public function test_owner_sees_all_deals_without_permission_set(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $bob = User::factory()->create(['workspace_id' => $this->workspace->id]);
        $this->makeDeal($this->adminUser);
        $bobDeal = $this->makeDeal($bob);

        $response = $this->getJson('/api/deals');

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $bobDeal->id]);
    }

    // ── 'their' scope ──────────────────────────────────────────────────────

    public function test_owner_with_their_deals_scope_cannot_see_other_users_deal_in_index(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $bob = User::factory()->create(['workspace_id' => $this->workspace->id]);
        $myDeal = $this->makeDeal($this->adminUser);
        $bobDeal = $this->makeDeal($bob);

        $this->assignSet($this->adminUser, [
            ['object' => 'deals', 'key' => 'view', 'value' => 'their', 'scope' => 'CRM objects'],
            ['object' => 'deals', 'key' => 'edit', 'value' => 'their', 'scope' => 'CRM objects'],
            ['object' => 'deals', 'key' => 'delete', 'value' => 'their', 'scope' => 'CRM objects'],
        ]);

        $response = $this->getJson('/api/deals');

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $myDeal->id]);
        $response->assertJsonMissing(['id' => $bobDeal->id]);
    }

    public function test_owner_with_their_deals_scope_cannot_show_other_users_deal(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $bob = User::factory()->create(['workspace_id' => $this->workspace->id]);
        $bobDeal = $this->makeDeal($bob);

        $this->assignSet($this->adminUser, [
            ['object' => 'deals', 'key' => 'view', 'value' => 'their'],
        ]);

        $response = $this->getJson('/api/deals/' . $bobDeal->id);

        $this->assertForbidden($response);
    }

    public function test_owner_with_their_deals_scope_cannot_update_other_users_deal(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $bob = User::factory()->create(['workspace_id' => $this->workspace->id]);
        $bobDeal = $this->makeDeal($bob);

        $this->assignSet($this->adminUser, [
            ['object' => 'deals', 'key' => 'edit', 'value' => 'their'],
        ]);

        $response = $this->putJson('/api/deals/' . $bobDeal->id, ['title' => 'Hacked']);

        $this->assertForbidden($response);
        $this->assertDatabaseMissing('deals', ['id' => $bobDeal->id, 'title' => 'Hacked']);
    }

    public function test_owner_with_their_deals_scope_cannot_delete_other_users_deal(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $bob = User::factory()->create(['workspace_id' => $this->workspace->id]);
        $bobDeal = $this->makeDeal($bob);

        $this->assignSet($this->adminUser, [
            ['object' => 'deals', 'key' => 'delete', 'value' => 'their'],
        ]);

        $response = $this->deleteJson('/api/deals/' . $bobDeal->id);

        $this->assertForbidden($response);
        $this->assertDatabaseHas('deals', ['id' => $bobDeal->id]);
    }

    public function test_owner_with_their_deals_scope_can_view_and_update_own_deal(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $myDeal = $this->makeDeal($this->adminUser);

        $this->assignSet($this->adminUser, [
            ['object' => 'deals', 'key' => 'view', 'value' => 'their'],
            ['object' => 'deals', 'key' => 'edit', 'value' => 'their'],
        ]);

        $show = $this->getJson('/api/deals/' . $myDeal->id);
        $show->assertStatus(200);

        $update = $this->putJson('/api/deals/' . $myDeal->id, ['title' => 'Mine']);
        $update->assertStatus(200);
    }

    public function test_their_deals_scope_considers_created_records_unowned(): void
    {
        // A deal created inside the workspace but assigned to nobody is not
        // visible under the 'their' scope.
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $orphanDeal = Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
            'assigned_to' => null,
        ]);

        $this->assignSet($this->adminUser, [
            ['object' => 'deals', 'key' => 'view', 'value' => 'their'],
        ]);

        $response = $this->getJson('/api/deals');

        $response->assertStatus(200);
        $response->assertJsonMissing(['id' => $orphanDeal->id]);
    }

    // ── 'none' scope ───────────────────────────────────────────────────────

    public function test_none_deals_scope_denies_module_access_entirely(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $myDeal = $this->makeDeal($this->adminUser);

        $this->assignSet($this->adminUser, [
            ['object' => 'deals', 'key' => 'view', 'value' => 'none'],
        ]);

        $this->assertForbidden($this->getJson('/api/deals'));
        $this->assertForbidden($this->getJson('/api/deals/' . $myDeal->id));
    }

    // ── 'team' scope ───────────────────────────────────────────────────────

    public function test_team_deals_scope_exposes_teammates_records_only(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $bob = User::factory()->create(['workspace_id' => $this->workspace->id]);
        $carol = User::factory()->create(['workspace_id' => $this->workspace->id]);

        $teamA = Team::factory()->create(['workspace_id' => $this->workspace->id]);
        $teamA->users()->attach([$this->adminUser->id, $bob->id]);
        $teamB = Team::factory()->create(['workspace_id' => $this->workspace->id]);
        $teamB->users()->attach($carol->id);

        $myDeal = $this->makeDeal($this->adminUser);
        $bobDeal = $this->makeDeal($bob);
        $carolDeal = $this->makeDeal($carol);

        $this->assignSet($this->adminUser, [
            ['object' => 'deals', 'key' => 'view', 'value' => 'team'],
            ['object' => 'deals', 'key' => 'edit', 'value' => 'team'],
        ]);

        $response = $this->getJson('/api/deals');

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $myDeal->id]);
        $response->assertJsonFragment(['id' => $bobDeal->id]);
        $response->assertJsonMissing(['id' => $carolDeal->id]);

        $this->getJson('/api/deals/' . $bobDeal->id)->assertStatus(200);
        $this->assertForbidden($this->getJson('/api/deals/' . $carolDeal->id));
    }

    // ── Role baseline cannot be expanded by a permission set ───────────────

    public function test_member_cannot_expand_beyond_role_baseline_with_all_scope(): void
    {
        // Workspace Member baseline: view_deals_all + edit_deals_own.
        // An 'edit: all' set must not extend editing beyond the 'own' baseline.
        \Laravel\Sanctum\Sanctum::actingAs($this->standardUser);
        $bob = User::factory()->create(['workspace_id' => $this->workspace->id]);
        $bobDeal = $this->makeDeal($bob);

        $this->assignSet($this->standardUser, [
            ['object' => 'deals', 'key' => 'view', 'value' => 'all'],
            ['object' => 'deals', 'key' => 'edit', 'value' => 'all'],
        ]);

        // View: baseline is 'all' and the set agrees -> Bob's deal is visible.
        $index = $this->getJson('/api/deals');
        $index->assertStatus(200);
        $index->assertJsonFragment(['id' => $bobDeal->id]);

        // Edit: most restrictive wins -> stays at the 'own' baseline.
        $this->assertForbidden($this->putJson('/api/deals/' . $bobDeal->id, ['title' => 'Hacked']));
    }

    // ── Contacts proof-of-concept ──────────────────────────────────────────

    public function test_contact_their_scope_restricts_index_and_show(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $bob = User::factory()->create(['workspace_id' => $this->workspace->id]);
        $myContact = $this->makeContact($this->adminUser);
        $bobContact = $this->makeContact($bob);

        $this->assignSet($this->adminUser, [
            ['object' => 'contacts', 'key' => 'view', 'value' => 'their'],
            ['object' => 'contacts', 'key' => 'edit', 'value' => 'their'],
        ]);

        $response = $this->getJson('/api/contacts');

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $myContact->id]);
        $response->assertJsonMissing(['id' => $bobContact->id]);

        $this->getJson('/api/contacts/' . $myContact->id)->assertStatus(200);
        $this->assertForbidden($this->getJson('/api/contacts/' . $bobContact->id));

        $this->assertForbidden($this->putJson('/api/contacts/' . $bobContact->id, ['first_name' => 'Hacked']));
    }

    // ── Companies: record-level scoping ────────────────────────────────────

    public function test_company_their_scope_restricts_index(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $bob = User::factory()->create(['workspace_id' => $this->workspace->id]);
        $myCompany = $this->makeCompany($this->adminUser);
        $bobCompany = $this->makeCompany($bob);

        $this->assignSet($this->adminUser, [
            ['object' => 'companies', 'key' => 'view', 'value' => 'their'],
            ['object' => 'companies', 'key' => 'edit', 'value' => 'their'],
        ]);

        $response = $this->getJson('/api/companies');

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $myCompany->id]);
        $response->assertJsonMissing(['id' => $bobCompany->id]);
    }

    public function test_company_their_scope_denies_other_users_company_record(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $bob = User::factory()->create(['workspace_id' => $this->workspace->id]);
        $bobCompany = $this->makeCompany($bob);

        $this->assignSet($this->adminUser, [
            ['object' => 'companies', 'key' => 'view', 'value' => 'their'],
            ['object' => 'companies', 'key' => 'edit', 'value' => 'their'],
            ['object' => 'companies', 'key' => 'delete', 'value' => 'their'],
        ]);

        $this->assertForbidden($this->getJson('/api/companies/' . $bobCompany->id));
        $this->assertForbidden($this->putJson('/api/companies/' . $bobCompany->id, ['name' => 'Hacked']));
        $this->assertForbidden($this->deleteJson('/api/companies/' . $bobCompany->id));
    }

    public function test_company_none_scope_denies_module_access_entirely(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $myCompany = $this->makeCompany($this->adminUser);

        $this->assignSet($this->adminUser, [
            ['object' => 'companies', 'key' => 'view', 'value' => 'none'],
        ]);

        $this->assertForbidden($this->getJson('/api/companies'));
        $this->assertForbidden($this->getJson('/api/companies/' . $myCompany->id));
    }

    // ── Tasks: record-level scoping ────────────────────────────────────────

    public function test_task_their_scope_restricts_index(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $bob = User::factory()->create(['workspace_id' => $this->workspace->id]);
        $myTask = $this->makeTask($this->adminUser);
        $bobTask = $this->makeTask($bob);

        $this->assignSet($this->adminUser, [
            ['object' => 'tasks', 'key' => 'view', 'value' => 'their'],
            ['object' => 'tasks', 'key' => 'edit', 'value' => 'their'],
        ]);

        $response = $this->getJson('/api/tasks');

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $myTask->id]);
        $response->assertJsonMissing(['id' => $bobTask->id]);
    }

    public function test_task_their_scope_denies_other_users_task_record(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $bob = User::factory()->create(['workspace_id' => $this->workspace->id]);
        $bobTask = $this->makeTask($bob);

        $this->assignSet($this->adminUser, [
            ['object' => 'tasks', 'key' => 'view', 'value' => 'their'],
            ['object' => 'tasks', 'key' => 'edit', 'value' => 'their'],
            ['object' => 'tasks', 'key' => 'delete', 'value' => 'their'],
        ]);

        $this->assertForbidden($this->getJson('/api/tasks/' . $bobTask->id));
        $this->assertForbidden($this->putJson('/api/tasks/' . $bobTask->id, ['title' => 'Hacked']));
        $this->assertForbidden($this->deleteJson('/api/tasks/' . $bobTask->id));
    }

    public function test_task_none_scope_denies_module_access_entirely(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $myTask = $this->makeTask($this->adminUser);

        $this->assignSet($this->adminUser, [
            ['object' => 'tasks', 'key' => 'view', 'value' => 'none'],
        ]);

        $this->assertForbidden($this->getJson('/api/tasks'));
        $this->assertForbidden($this->getJson('/api/tasks/' . $myTask->id));
    }

    // ── Fail-closed: record-level scope with no ownership columns ──────────

    public function test_apply_record_scope_fails_closed_when_no_ownership_columns(): void
    {
        $this->assignSet($this->adminUser, [
            ['object' => 'deals', 'key' => 'view', 'value' => 'their'],
        ]);

        $model = new class extends Deal {
            protected $table = 'deals';

            protected function getOwnershipColumns(): ?array
            {
                return null;
            }
        };

        $query = $model->newQuery();

        $scoped = $query->applyRecordScope($this->adminUser, 'deals', 'their');

        $seenWhere = $scoped->toSql();

        // 1 = 0 must be present so a 'their' scope on a column-less model
        // returns zero records rather than leaking everything.
        $this->assertStringContainsString('1 = 0', $seenWhere);

        $result = $scoped->get();
        $this->assertEmpty($result);
    }
}