<?php

namespace App\Http\Controllers\Workspace;

use App\Http\Controllers\Controller;
use App\Mail\InvitationMail;
use App\Models\Invitation;
use App\Models\User;
use App\Http\Requests\StoreInvitationRequest;
use App\Http\Requests\AcceptInvitationRequest;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class InvitationController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Invitation::class);

        $invitations = Invitation::where('workspace_id', auth()->user()->workspace_id)
            ->latest()
            ->paginate($this->paginationLimit($request, 20));

        return response()->json([
            'status' => 'success',
            'data' => $invitations->items(),
            'meta' => [
                'page' => $invitations->currentPage(),
                'limit' => $invitations->perPage(),
                'total' => $invitations->total(),
                'last_page' => $invitations->lastPage(),
            ],
        ]);
    }

    public function indexRoles()
    {
        $this->authorize('viewAny', Invitation::class);

        $roles = Role::whereNotIn('name', ['Super Admin'])->get(['id', 'name']);

        return response()->json(['status' => 'success', 'data' => $roles]);
    }

    public function store(StoreInvitationRequest $request)
    {
        $this->authorize('create', Invitation::class);

        $validated = $request->validated();
        $validated['workspace_id'] = auth()->user()->workspace_id;

        $invitation = DB::transaction(function () use ($validated) {
            return Invitation::create($validated);
        });

        $acceptUrl = config('app.frontend_url') . '/accept-invite?token=' . $invitation->token;

        Mail::to($invitation->email)
            ->queue(new InvitationMail(
                $invitation,
                auth()->user()->name,
                $acceptUrl,
            ));

        return response()->json([
            'status' => 'success',
            'message' => 'Invitation sent successfully.',
            'invitation' => $invitation,
        ], 201);
    }

    // 3. قبول الدعوة (من قبل الموظف الجديد)
    public function accept(AcceptInvitationRequest $request)
    {
        $validated = $request->validated();
        
        $invitation = Invitation::where('token', $validated['token'])->firstOrFail();

        // التحقق من صلاحية الدعوة
        if ($invitation->expires_at->isPast()) {
            return response()->json(['status' => 'error', 'message' => 'Invitation token has expired.'], 400);
        }

        $user = DB::transaction(function () use ($validated, $invitation) {
            // 1. إنشاء المستخدم الجديد
            $user = User::create([
                'name' => $validated['name'],
                'email' => $invitation->email,
                'password' => Hash::make($validated['password']),
                'workspace_id' => $invitation->workspace_id, // تحديد مساحة العمل النشطة
            ]);

            // 2. ربط المستخدم بمساحة العمل في جدول (workspace_user)
            $invitation->workspace->users()->attach($user->id, [
                'role_name' => $invitation->role_name,
                'is_active' => true,
            ]);

            // 3. تعيين الدور (Role) الخاص به في هذه الشركة فقط
            setPermissionsTeamId($invitation->workspace_id);
            $user->assignRole($invitation->role_name);

            // 4. حذف الدعوة لعدم استخدامها مرة أخرى
            $invitation->delete();

            return $user;
        });

        // إصدار توكن الدخول عشان الموظف يدخل على حسابه فوراً
        $authToken = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Account created and joined workspace successfully.',
            'data' => [
                'user' => $user,
                'token' => $authToken
            ]
        ]);
    }
}