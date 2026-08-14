<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreActivityCommentRequest;
use App\Http\Requests\UpdateActivityCommentRequest;
use App\Http\Resources\ActivityCommentResource;
use App\Models\Activity;
use App\Models\ActivityComment;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class ActivityCommentController extends Controller
{
    use AuthorizesRequests;

    public function index(Activity $activity)
    {
        $this->authorize('view', $activity);

        $comments = ActivityComment::with('user')
            ->where('activity_id', $activity->id)
            ->latest()
            ->paginate(20);

        return response()->json([
            'status' => 'success',
            'data' => ActivityCommentResource::collection($comments),
            'meta' => [
                'page' => $comments->currentPage(),
                'limit' => $comments->perPage(),
                'total' => $comments->total(),
                'last_page' => $comments->lastPage(),
            ],
        ]);
    }

    public function store(StoreActivityCommentRequest $request)
    {
        $activity = Activity::findOrFail($request->activity_id);

        $this->authorize('view', $activity);
        $this->authorize('create', ActivityComment::class);

        $comment = ActivityComment::create([
            'workspace_id' => auth('sanctum')->user()->workspace_id,
            'activity_id' => $activity->id,
            'user_id' => auth()->id(),
            'content' => $request->content,
        ]);

        $comment->load('user');

        return response()->json([
            'status' => 'success',
            'message' => 'Comment created successfully',
            'data' => new ActivityCommentResource($comment),
        ], 201);
    }

    public function show(ActivityComment $activityComment)
    {
        $activityComment->load('activity');
        $this->authorize('view', $activityComment);

        $activityComment->load('user');

        return response()->json([
            'status' => 'success',
            'data' => new ActivityCommentResource($activityComment),
        ]);
    }

    public function update(UpdateActivityCommentRequest $request, ActivityComment $activityComment)
    {
        $activityComment->load('activity');
        $this->authorize('update', $activityComment);

        $activityComment->update($request->validated());

        return response()->json([
            'status' => 'success',
            'message' => 'Comment updated successfully',
            'data' => new ActivityCommentResource($activityComment),
        ]);
    }

    public function destroy(ActivityComment $activityComment)
    {
        $activityComment->load('activity');
        $this->authorize('delete', $activityComment);

        $activityComment->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Comment deleted successfully',
            'data' => null,
        ]);
    }
}
