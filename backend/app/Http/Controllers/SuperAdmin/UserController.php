<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\UpdateUserStatusRequest;
use App\Http\Resources\SuperAdmin\SuperAdminUserResource;
use App\Models\AuditLog;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $query = DB::table('workspace_user')
            ->join('users', 'users.id', '=', 'workspace_user.user_id')
            ->join('workspaces', 'workspaces.id', '=', 'workspace_user.workspace_id')
            ->where('users.is_super_admin', false)
            ->whereNull('users.deleted_at')
            ->select(
                'users.id as user_id',
                'users.name',
                'users.email',
                'users.created_at',
                'workspaces.id as tenant_id',
                'workspaces.company_name',
                'workspaces.name as workspace_name',
                'workspace_user.is_active',
                'workspace_user.role_name'
            );

        if ($q = request('q')) {
            $search = "%{$q}%";
            $query->where(function ($sub) use ($search) {
                $sub->where('users.name', 'LIKE', $search)
                    ->orWhere('users.email', 'LIKE', $search);
            });
        }

        if ($tenantId = request('tenant_id')) {
            $query->where('workspace_user.workspace_id', $tenantId);
        }

        if ($status = request('status')) {
            $query->where('workspace_user.is_active', $status === 'Active');
        }

        if ($role = request('role')) {
            if ($role === 'Admin') {
                $query->where('workspace_user.role_name', 'Workspace Owner');
            } else {
                $query->where(function ($sub) {
                    $sub->where('workspace_user.role_name', '!=', 'Workspace Owner')
                        ->orWhereNull('workspace_user.role_name');
                });
            }
        }

        $limit = (int) request('limit', 15);
        $paginator = $query->orderBy('users.name')->paginate($limit);

        $items = collect($paginator->items())->map(function ($row) {
            $obj = new \stdClass();
            $obj->user_id = $row->user_id;
            $obj->name = $row->name;
            $obj->email = $row->email;
            $obj->tenant_id = $row->tenant_id;
            $obj->company_name = $row->company_name;
            $obj->workspace_name = $row->workspace_name;
            $obj->is_active = $row->is_active;
            $obj->role_name = $row->role_name;
            $obj->created_at = $row->created_at;
            return $obj;
        });

        return response()->json([
            'data' => SuperAdminUserResource::collection($items),
            'meta' => [
                'page' => $paginator->currentPage(),
                'limit' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(User $user): JsonResponse
    {
        if ($user->is_super_admin) {
            abort(404);
        }

        $user->load('workspaces');

        if ($user->workspaces->isEmpty()) {
            abort(404);
        }

        $workspaceId = request('workspace_id');

        $workspace = $workspaceId
            ? $user->workspaces->firstWhere('id', $workspaceId)
            : $user->workspaces->first();

        if (!$workspace) {
            return response()->json([
                'message' => 'User not found in this workspace.',
            ], 404);
        }

        $membership = new \stdClass();
        $membership->user_id = $user->id;
        $membership->name = $user->name;
        $membership->email = $user->email;
        $membership->tenant_id = $workspace->id;
        $membership->company_name = $workspace->company_name;
        $membership->workspace_name = $workspace->name;
        $membership->is_active = $workspace->pivot->is_active;
        $membership->role_name = $workspace->pivot->role_name;
        $membership->created_at = $user->created_at;

        return response()->json([
            'data' => new SuperAdminUserResource($membership),
        ]);
    }

    public function updateWorkspaceStatus(
        UpdateUserStatusRequest $request,
        User $user,
        Workspace $workspace
    ): JsonResponse {
        if ($user->is_super_admin) {
            return response()->json([
                'message' => 'Cannot modify a super admin.',
            ], 403);
        }

        if ($user->id === auth('sanctum')->id()) {
            return response()->json([
                'message' => 'Cannot modify your own status.',
            ], 403);
        }

        $pivotRow = DB::table('workspace_user')
            ->where('user_id', $user->id)
            ->where('workspace_id', $workspace->id)
            ->first();

        if (!$pivotRow) {
            return response()->json([
                'message' => 'User not found in this workspace.',
            ], 404);
        }

        $isActive = $request->validated('status') === 'Active';

        if ((bool) $pivotRow->is_active === $isActive) {
            $membership = new \stdClass();
            $membership->user_id = $user->id;
            $membership->name = $user->name;
            $membership->email = $user->email;
            $membership->tenant_id = $workspace->id;
            $membership->company_name = $workspace->company_name;
            $membership->workspace_name = $workspace->name;
            $membership->is_active = $pivotRow->is_active;
            $membership->role_name = $pivotRow->role_name;
            $membership->created_at = $user->created_at;

            return response()->json([
                'data' => new SuperAdminUserResource($membership),
            ]);
        }

        $user->workspaces()->updateExistingPivot($workspace->id, [
            'is_active' => $isActive,
        ]);

        AuditLog::create([
            'workspace_id' => $workspace->id,
            'user_id' => auth('sanctum')->id(),
            'action' => $isActive ? 'user_activated' : 'user_deactivated',
            'auditable_type' => User::class,
            'auditable_id' => $user->id,
            'category' => 'user',
            'subcategory' => 'super_admin',
            'source' => 'super_admin_panel',
            'changes' => [
                'previous_status' => $pivotRow->is_active ? 'Active' : 'Deactivated',
                'new_status' => $request->validated('status'),
            ],
        ]);

        $membership = new \stdClass();
        $membership->user_id = $user->id;
        $membership->name = $user->name;
        $membership->email = $user->email;
        $membership->tenant_id = $workspace->id;
        $membership->company_name = $workspace->company_name;
        $membership->workspace_name = $workspace->name;
        $membership->is_active = $isActive;
        $membership->role_name = $pivotRow->role_name;
        $membership->created_at = $user->created_at;

        return response()->json([
            'data' => new SuperAdminUserResource($membership),
        ]);
    }
}
