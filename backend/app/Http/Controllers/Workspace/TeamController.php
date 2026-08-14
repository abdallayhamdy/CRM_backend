<?php

namespace App\Http\Controllers\Workspace;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTeamRequest;
use App\Http\Requests\UpdateTeamRequest;
use App\Http\Resources\TeamResource;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user->hasPermissionTo('manage_teams')) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $teams = Team::withCount('users')
            ->orderBy('name')
            ->paginate($this->paginationLimit($request, 20));

        return TeamResource::collection($teams);
    }

    public function store(StoreTeamRequest $request)
    {
        $user = $request->user();
        if (!$user->hasPermissionTo('manage_teams')) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $team = Team::create($request->validated());

        return response()->json([
            'data' => new TeamResource($team),
            'message' => 'Team created.',
        ], 201);
    }

    public function show(Team $team)
    {
        $user = auth()->user();
        if (!$user->hasPermissionTo('manage_teams')) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $team->loadCount('users');

        return response()->json([
            'data' => new TeamResource($team),
        ]);
    }

    public function update(UpdateTeamRequest $request, Team $team)
    {
        $user = $request->user();
        if (!$user->hasPermissionTo('manage_teams')) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $team->update($request->validated());

        return response()->json([
            'data' => new TeamResource($team->fresh()->loadCount('users')),
            'message' => 'Team updated.',
        ]);
    }

    public function destroy(Team $team)
    {
        $user = auth()->user();
        if (!$user->hasPermissionTo('manage_teams')) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $team->delete();

        return response()->json([
            'message' => 'Team deleted.',
        ]);
    }

    public function members(Team $team)
    {
        $user = auth()->user();
        if (!$user->hasPermissionTo('manage_teams')) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $members = $team->users()
            ->orderBy('name')
            ->get()
            ->map(fn (User $member) => [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
            ]);

        return response()->json(['data' => $members]);
    }

    public function addMember(Team $team, User $user)
    {
        $authUser = auth()->user();
        if (!$authUser->hasPermissionTo('manage_teams')) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $workspaceId = $authUser->workspace_id;

        if (!$user->workspaces()->where('workspace_id', $workspaceId)->exists()) {
            return response()->json(['message' => 'User is not a member of this workspace.'], 422);
        }

        $team->users()->syncWithoutDetaching([$user->id]);

        return response()->json([
            'data' => $team->users()->count(),
            'message' => 'Member added to team.',
        ]);
    }

    public function removeMember(Team $team, User $user)
    {
        $authUser = auth()->user();
        if (!$authUser->hasPermissionTo('manage_teams')) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $team->users()->detach($user->id);

        return response()->json([
            'data' => $team->users()->count(),
            'message' => 'Member removed from team.',
        ]);
    }
}
