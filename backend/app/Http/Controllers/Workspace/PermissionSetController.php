<?php

namespace App\Http\Controllers\Workspace;

use App\Http\Controllers\Controller;
use App\Http\Requests\AssignPermissionSetRequest;
use App\Http\Requests\StorePermissionSetRequest;
use App\Http\Requests\UpdatePermissionSetRequest;
use App\Http\Resources\PermissionSetResource;
use App\Models\PermissionSet;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;

class PermissionSetController extends Controller
{
    private function authorizeWorkspace(Workspace $workspace): void
    {
        $user = auth()->user();

        if ($user && $user->is_super_admin) {
            return;
        }

        $canManage = $user
            && Permission::query()
                ->where('name', 'manage_permission_sets')
                ->where('guard_name', 'sanctum')
                ->exists()
            && $user->hasPermissionTo('manage_permission_sets');

        if (!$canManage) {
            abort(response()->json(['status' => 'error', 'message' => 'Forbidden.'], 403));
        }

        if ((string) $user->workspace_id !== (string) $workspace->id) {
            abort(response()->json(['status' => 'error', 'message' => 'Workspace not found.'], 403));
        }
    }

    public function index(Request $request, Workspace $workspace)
    {
        $this->authorizeWorkspace($workspace);

        $sets = PermissionSet::query()
            ->where('workspace_id', $workspace->id)
            ->withCount('users')
            ->with('permissions')
            ->orderBy('name')
            ->paginate($this->paginationLimit($request, 20));

        return PermissionSetResource::collection($sets);
    }

    public function store(StorePermissionSetRequest $request, Workspace $workspace)
    {
        $this->authorizeWorkspace($workspace);

        $data = $request->validated();

        $set = new PermissionSet([
            'workspace_id' => $workspace->id,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'locked' => $data['locked'] ?? false,
            'created_by' => $request->user()->id,
        ]);
        $set->save();

        if (!empty($data['permissions'])) {
            $this->syncPermissions($set, $data['permissions']);
        }

        return (new PermissionSetResource($set->load('permissions', 'users')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Workspace $workspace, PermissionSet $permissionSet)
    {
        $this->authorizeWorkspace($workspace);

        $permissionSet->load('permissions', 'users');

        return new PermissionSetResource($permissionSet);
    }

    public function update(UpdatePermissionSetRequest $request, Workspace $workspace, PermissionSet $permissionSet)
    {
        $this->authorizeWorkspace($workspace);

        $data = $request->validated();

        $permissionSet->fill([
            'name' => $data['name'] ?? $permissionSet->name,
            'description' => array_key_exists('description', $data)
                ? $data['description']
                : $permissionSet->description,
            'locked' => $data['locked'] ?? $permissionSet->locked,
        ]);
        $permissionSet->save();

        if (array_key_exists('permissions', $data)) {
            $this->syncPermissions($permissionSet, $data['permissions'] ?? []);
        }

        return new PermissionSetResource($permissionSet->load('permissions', 'users'));
    }

    public function destroy(Request $request, Workspace $workspace, PermissionSet $permissionSet): JsonResponse
    {
        $this->authorizeWorkspace($workspace);

        $permissionSet->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Permission set deleted.',
        ]);
    }

    public function assign(AssignPermissionSetRequest $request, Workspace $workspace, PermissionSet $permissionSet)
    {
        $this->authorizeWorkspace($workspace);

        $requestedIds = $request->input('user_ids');

        $validIds = User::query()
            ->whereIn('id', $requestedIds)
            ->whereHas('workspaces', function ($q) use ($workspace) {
                $q->where('workspace_id', $workspace->id);
            })
            ->pluck('id');

        abort_unless(
            $validIds->count() === count($requestedIds),
            response()->json(['status' => 'error', 'message' => 'One or more users are not members of this workspace.'], 422)
        );

        $permissionSet->users()->sync($validIds);

        return new PermissionSetResource($permissionSet->load('users'));
    }

    private function syncPermissions(PermissionSet $set, array $permissions): void
    {
        $set->permissions()->delete();

        foreach ($permissions as $permission) {
            $set->permissions()->create([
                'object' => $permission['object'],
                'key' => $permission['key'],
                'value' => $permission['value'] ?? null,
                'scope' => $permission['scope'] ?? null,
            ]);
        }
    }
}