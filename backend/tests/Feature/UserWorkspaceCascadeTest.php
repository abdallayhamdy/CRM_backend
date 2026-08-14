<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Facades\DB;

class UserWorkspaceCascadeTest extends TestCase
{
    public function test_hard_deleting_workspace_preserves_users_and_nulls_workspace_id(): void
    {
        $workspace = Workspace::factory()->create();
        $user = User::factory()->create(['workspace_id' => $workspace->id]);

        DB::table('workspaces')->where('id', $workspace->id)->delete();

        $this->assertDatabaseHas('users', ['id' => $user->id]);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'workspace_id' => null]);
    }

    public function test_soft_deleting_workspace_keeps_user_membership(): void
    {
        $workspace = Workspace::factory()->create();
        $user = User::factory()->create(['workspace_id' => $workspace->id]);
        $user->workspaces()->attach($workspace->id, [
            'role_name' => 'Workspace Owner',
            'is_active' => true,
        ]);

        $workspace->delete();

        $this->assertSoftDeleted('workspaces', ['id' => $workspace->id]);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'workspace_id' => $workspace->id]);
    }
}
