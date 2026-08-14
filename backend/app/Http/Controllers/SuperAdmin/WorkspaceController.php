<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTenantRequest;
use App\Http\Requests\SuperAdmin\UpdateTenantRequest;
use App\Http\Resources\SuperAdmin\TenantResource;
use App\Services\TenantOnboardingService;
use App\Models\AuditLog;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;

class WorkspaceController extends Controller
{
    // ═══════════════════════════════════════════════════════════════
    // Legacy /workspaces endpoints — kept for backward compatibility
    // ═══════════════════════════════════════════════════════════════

    public function index()
    {
        $workspaces = Workspace::withCount('users')->latest()->paginate(15);

        return response()->json([
            'status' => 'success',
            'data' => $workspaces
        ]);
    }

    public function store(StoreTenantRequest $request, TenantOnboardingService $onboardingService)
    {
        $result = $onboardingService->createTenant($request->validated());

        AuditLog::create([
            'workspace_id' => $result['workspace']->id,
            'user_id' => $request->user()->id,
            'action' => 'workspace_created',
            'auditable_type' => Workspace::class,
            'auditable_id' => $result['workspace']->id,
            'category' => 'workspace',
            'subcategory' => 'super_admin',
            'source' => 'super_admin_panel',
            'changes' => ['workspace_name' => $result['workspace']->name],
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Workspace and Owner created successfully. Password reset link sent.',
            'data' => $result
        ], 201);
    }

    public function destroy(Workspace $workspace)
    {
        $workspaceName = $workspace->name;
        $workspaceId = $workspace->id;
        $workspace->delete();

        AuditLog::create([
            'workspace_id' => $workspaceId,
            'user_id' => auth('sanctum')->id(),
            'action' => 'workspace_suspended',
            'auditable_type' => Workspace::class,
            'auditable_id' => $workspaceId,
            'category' => 'workspace',
            'subcategory' => 'super_admin',
            'source' => 'super_admin_panel',
            'changes' => ['workspace_name' => $workspaceName],
        ]);

        return response()->json(['status' => 'success', 'message' => 'Workspace suspended']);
    }

    // ═══════════════════════════════════════════════════════════════
    // New /tenants endpoints — frontend-aligned contract
    // ═══════════════════════════════════════════════════════════════

    public function tenantsIndex()
    {
        $query = Workspace::withCount('users')->with('ownerUsers')->latest();

        if ($q = request('q')) {
            $search = "%{$q}%";
            $query->where(function ($sub) use ($search) {
                $sub->where('workspaces.company_name', 'LIKE', $search)
                    ->orWhereHas('ownerUsers', function ($ownerQuery) use ($search) {
                        $ownerQuery->where('email', 'LIKE', $search);
                    });
            });
        }

        if ($status = request('status')) {
            $query->where('workspaces.status', $status);
        }

        $limit = (int) request('limit', 15);
        $paginator = $query->paginate($limit);

        return response()->json([
            'data' => TenantResource::collection($paginator),
            'meta' => [
                'page' => $paginator->currentPage(),
                'limit' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function tenantsStore(StoreTenantRequest $request, TenantOnboardingService $onboardingService)
    {
        $result = $onboardingService->createTenant($request->validated());

        $workspace = $result['workspace']->load('ownerUsers')->loadCount('users');

        AuditLog::create([
            'workspace_id' => $workspace->id,
            'user_id' => $request->user()->id,
            'action' => 'workspace_created',
            'auditable_type' => Workspace::class,
            'auditable_id' => $workspace->id,
            'category' => 'workspace',
            'subcategory' => 'super_admin',
            'source' => 'super_admin_panel',
            'changes' => ['workspace_name' => $workspace->name],
        ]);

        // TODO: Add platform-level audit logging when platform audit infrastructure is built.

        return response()->json([
            'data' => new TenantResource($workspace),
        ], 201);
    }

    public function show(Workspace $workspace)
    {
        $workspace->loadCount('users')->load('ownerUsers');

        return response()->json([
            'data' => new TenantResource($workspace),
        ]);
    }

    public function update(UpdateTenantRequest $request, Workspace $workspace)
    {
        $validated = $request->validated();
        $previousStatus = $workspace->status;
        $newStatus = $validated['status'] ?? $workspace->status;

        $workspace->update([
            'company_name' => $validated['company_name'] ?? $workspace->company_name,
            'plan' => $validated['plan'] ?? $workspace->plan,
            'max_users' => $validated['user_limit'] ?? $workspace->max_users,
            'status' => $newStatus,
            'trial_end_date' => isset($validated['trial_end_date'])
                ? $validated['trial_end_date']
                : ($newStatus !== 'trial' ? null : $workspace->trial_end_date),
        ]);

        $owner = $workspace->getOwner();
        if ($owner) {
            $ownerUpdates = [];
            foreach (['name' => 'admin_full_name', 'email' => 'admin_email', 'phone_number' => 'admin_phone'] as $userField => $validatedField) {
                if (array_key_exists($validatedField, $validated)) {
                    $ownerUpdates[$userField] = $validated[$validatedField];
                }
            }
            if ($ownerUpdates) {
                $owner->update($ownerUpdates);
            }
        }

        if (isset($validated['status']) && $validated['status'] !== 'trial') {
            $workspace->update(['trial_end_date' => null]);
        }

        if ($newStatus !== $previousStatus) {
            $action = match ($newStatus) {
                'suspended' => 'workspace_suspended',
                'activated' => 'workspace_activated',
                'active' => $previousStatus === 'suspended' ? 'workspace_activated' : 'workspace_updated',
                'churned' => 'workspace_churned',
                default => 'workspace_updated',
            };

            if ($newStatus === 'suspended' || $newStatus === 'churned') {
                $workspace->users()->updateExistingPivot(
                    $workspace->users()->pluck('users.id')->toArray(),
                    ['is_active' => false]
                );
            } elseif ($newStatus === 'active' && $previousStatus === 'suspended') {
                $workspace->users()->updateExistingPivot(
                    $workspace->users()->pluck('users.id')->toArray(),
                    ['is_active' => true]
                );
            }

            AuditLog::create([
                'workspace_id' => $workspace->id,
                'user_id' => auth('sanctum')->id(),
                'action' => $action,
                'auditable_type' => Workspace::class,
                'auditable_id' => $workspace->id,
                'category' => 'workspace',
                'subcategory' => 'super_admin',
                'source' => 'super_admin_panel',
                'changes' => array_merge($validated, ['previous_status' => $previousStatus]),
            ]);
        } else {
            AuditLog::create([
                'workspace_id' => $workspace->id,
                'user_id' => auth('sanctum')->id(),
                'action' => 'workspace_updated',
                'auditable_type' => Workspace::class,
                'auditable_id' => $workspace->id,
                'category' => 'workspace',
                'subcategory' => 'super_admin',
                'source' => 'super_admin_panel',
                'changes' => $validated,
            ]);
        }

        // TODO: Add platform-level audit logging when platform audit infrastructure is built.

        $workspace->refresh()->loadCount('users')->load('ownerUsers');

        return response()->json([
            'data' => new TenantResource($workspace),
        ]);
    }

    public function destroyTenant(Workspace $workspace)
    {
        $workspaceId = $workspace->id;
        $workspaceName = $workspace->name;

        $workspace->users()->get()->each->delete();

        $workspace->delete();

        AuditLog::create([
            'workspace_id' => $workspaceId,
            'user_id' => auth('sanctum')->id(),
            'action' => 'workspace_deleted',
            'auditable_type' => Workspace::class,
            'auditable_id' => $workspaceId,
            'category' => 'workspace',
            'subcategory' => 'super_admin',
            'source' => 'super_admin_panel',
            'changes' => ['workspace_name' => $workspaceName],
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Tenant deleted.',
        ]);
    }
}