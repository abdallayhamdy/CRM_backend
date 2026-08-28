<?php

namespace App\Http\Controllers\Workspace;

use App\Http\Controllers\Controller;
use App\Http\Requests\BulkDeactivateMembersRequest;
use App\Http\Requests\UpdateMemberRoleRequest;
use App\Http\Resources\WorkspaceMemberResource;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MemberController extends Controller
{
    use AuthorizesRequests;

    private const ROLE_LEVELS = [
        'Workspace Viewer' => 1,
        'Workspace Member' => 2,
        'Workspace Admin'  => 3,
        'Workspace Owner'  => 4,
    ];

    private function roleLevel(string $roleName): int
    {
        return self::ROLE_LEVELS[$roleName] ?? 0;
    }

    private function memberRole(User $member, string $workspaceId): ?string
    {
        return $member->workspaces()->where('workspace_id', $workspaceId)->first()?->pivot->role_name;
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', User::class);

        $workspaceId = auth()->user()->workspace_id;
        setPermissionsTeamId($workspaceId);

        $query = User::whereHas('workspaces', function ($q) use ($workspaceId) {
            $q->where('workspace_id', $workspaceId);
        })->with(['workspaces' => function ($q) use ($workspaceId) {
            $q->where('workspace_id', $workspaceId);
        }])->with('roles');

        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('is_active')) {
            $query->whereHas('workspaces', function ($q) use ($workspaceId, $request) {
                $q->where('workspace_id', $workspaceId)
                  ->where('is_active', $request->boolean('is_active'));
            });
        }

        $members = $query->paginate($this->paginationLimit($request));

        return WorkspaceMemberResource::collection($members);
    }

    public function updateRole(UpdateMemberRoleRequest $request, User $member)
    {
        $this->authorize('update', $member);

        $workspaceId = auth()->user()->workspace_id;
        $authUser = auth()->user();

        if ($member->is_super_admin) {
            return response()->json(['status' => 'error', 'message' => 'Cannot modify Super Admin.'], 403);
        }

        if (!$member->workspaces()->where('workspace_id', $workspaceId)->exists()) {
            return response()->json(['status' => 'error', 'message' => 'Member not found in workspace.'], 404);
        }

        $currentRole = $this->memberRole($member, $workspaceId);
        $authRole = $this->memberRole($authUser, $workspaceId);

        $targetLevel = $this->roleLevel($request->role_name);
        $currentLevel = $this->roleLevel($currentRole);
        $authLevel = $this->roleLevel($authRole);

        if ($targetLevel > $authLevel) {
            return response()->json(['status' => 'error', 'message' => 'You cannot assign a role higher than your own.'], 403);
        }

        if ($member->id === $authUser->id && $targetLevel > $currentLevel) {
            return response()->json(['status' => 'error', 'message' => 'You cannot promote yourself.'], 403);
        }

        if ($currentRole === 'Workspace Owner' && $request->role_name !== 'Workspace Owner') {
            $remainingOwners = DB::table('workspace_user')
                ->where('workspace_id', $workspaceId)
                ->where('role_name', 'Workspace Owner')
                ->where('is_active', true)
                ->where('user_id', '!=', $member->id)
                ->count();

            if ($remainingOwners < 1) {
                return response()->json(['status' => 'error', 'message' => 'Cannot demote the last Workspace Owner.'], 403);
            }
        }

        setPermissionsTeamId($workspaceId);
        $member->syncRoles([$request->role_name]);

        $member->workspaces()->updateExistingPivot($workspaceId, [
            'role_name' => $request->role_name,
        ]);

        return response()->json(['status' => 'success', 'message' => 'Role updated successfully.']);
    }

    public function deactivate(User $member)
    {
        $this->authorize('update', $member);

        $workspaceId = auth()->user()->workspace_id;
        $authUser = auth()->user();

        if ($member->is_super_admin) {
            return response()->json(['status' => 'error', 'message' => 'Cannot modify Super Admin.'], 403);
        }

        $workspace = $member->workspaces()->where('workspace_id', $workspaceId)->first();

        if (!$workspace) {
            return response()->json(['status' => 'error', 'message' => 'Member not found in workspace.'], 404);
        }

        if ($workspace->pivot->role_name === 'Workspace Owner') {
            $activeOwnerCount = DB::table('workspace_user')
                ->where('workspace_id', $workspaceId)
                ->where('role_name', 'Workspace Owner')
                ->where('is_active', true)
                ->count();

            if ($activeOwnerCount <= 1) {
                return response()->json(['status' => 'error', 'message' => 'Cannot deactivate the last Workspace Owner.'], 403);
            }
        }

        $member->workspaces()->updateExistingPivot($workspaceId, [
            'is_active' => false,
        ]);

        $member->tokens()->delete();

        return response()->json(['status' => 'success', 'message' => 'Member deactivated.']);
    }

    public function activate(User $member)
    {
        $this->authorize('update', $member);

        $workspaceId = auth()->user()->workspace_id;

        if (!$member->workspaces()->where('workspace_id', $workspaceId)->exists()) {
            return response()->json(['status' => 'error', 'message' => 'Member not found in workspace.'], 404);
        }

        $member->workspaces()->updateExistingPivot($workspaceId, [
            'is_active' => true,
        ]);

        return response()->json(['status' => 'success', 'message' => 'Member activated.']);
    }

    public function bulkDeactivate(BulkDeactivateMembersRequest $request)
    {
        $workspaceId = auth()->user()->workspace_id;

        $requestedIds = array_values(array_unique($request->input('user_ids')));

        $members = User::query()
            ->whereIn('id', $requestedIds)
            ->whereHas('workspaces', function ($q) use ($workspaceId) {
                $q->where('workspace_id', $workspaceId);
            })
            ->get();

        if ($members->count() !== count($requestedIds)) {
            return response()->json(['status' => 'error', 'message' => 'One or more users are not members of this workspace.'], 422);
        }

        if ($members->where('is_super_admin', true)->isNotEmpty()) {
            return response()->json(['status' => 'error', 'message' => 'Cannot modify Super Admin.'], 403);
        }

        foreach ($members as $member) {
            $this->authorize('update', $member);
        }

        $memberIds = $members->pluck('id');

        $activeOwners = DB::table('workspace_user')
            ->where('workspace_id', $workspaceId)
            ->where('role_name', 'Workspace Owner')
            ->where('is_active', true)
            ->count();

        $activeOwnersInSelection = DB::table('workspace_user')
            ->where('workspace_id', $workspaceId)
            ->where('role_name', 'Workspace Owner')
            ->where('is_active', true)
            ->whereIn('user_id', $memberIds)
            ->count();

        if ($activeOwners - $activeOwnersInSelection < 1) {
            return response()->json(['status' => 'error', 'message' => 'Cannot deactivate the last active Workspace Owner.'], 403);
        }

        DB::transaction(function () use ($members, $workspaceId) {
            foreach ($members as $member) {
                $member->workspaces()->updateExistingPivot($workspaceId, [
                    'is_active' => false,
                ]);

                $member->tokens()->delete();
            }
        });

        $count = $members->count();

        return response()->json([
            'status' => 'success',
            'message' => $count . ' member' . ($count === 1 ? '' : 's') . ' deactivated.',
        ]);
    }

    public function remove(User $member)
    {
        $this->authorize('delete', $member);

        $workspaceId = auth()->user()->workspace_id;

        if ($member->is_super_admin) {
            return response()->json(['status' => 'error', 'message' => 'Cannot remove Super Admin.'], 403);
        }

        $workspace = $member->workspaces()->where('workspace_id', $workspaceId)->first();

        if (!$workspace) {
            return response()->json(['status' => 'error', 'message' => 'Member not found in workspace.'], 404);
        }

        if ($workspace->pivot->role_name === 'Workspace Owner') {
            $ownerCount = DB::table('workspace_user')
                ->where('workspace_id', $workspaceId)
                ->where('role_name', 'Workspace Owner')
                ->count();

            if ($ownerCount <= 1) {
                return response()->json(['status' => 'error', 'message' => 'Cannot remove the last Workspace Owner.'], 403);
            }
        }

        DB::transaction(function () use ($member, $workspaceId) {
            $member->workspaces()->detach($workspaceId);

            if ($member->workspace_id === $workspaceId) {
                $member->update(['workspace_id' => null]);
            }
        });

        return response()->json(['status' => 'success', 'message' => 'Member removed from workspace.']);
    }
}
