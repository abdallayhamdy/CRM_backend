<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class TaskController extends Controller
{
    use AuthorizesRequests;

    protected $typeMap = [
        'company' => \App\Models\Company::class,
        'contact' => \App\Models\Contact::class,
        'deal'    => \App\Models\Deal::class,
    ];

    public function index(Request $request)
    {
        $this->authorize('viewAny', Task::class);

        $query = Task::with(['assignee', 'taskable']);

        if ($request->q) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', "%{$request->q}%")
                  ->orWhere('description', 'like', "%{$request->q}%");
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->assigned_to === 'me') {
            $query->where('assigned_to', auth('sanctum')->id());
        } elseif ($request->assigned_to) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->due_date_from) {
            $query->where('due_date', '>=', $request->due_date_from);
        }
        if ($request->due_date_to) {
            $query->where('due_date', '<=', $request->due_date_to);
        }

        if ($request->contact_id) {
            $query->where('taskable_type', \App\Models\Contact::class)
                  ->where('taskable_id', $request->contact_id);
        }
        if ($request->company_id) {
            $query->where('taskable_type', \App\Models\Company::class)
                  ->where('taskable_id', $request->company_id);
        }
        if ($request->deal_id) {
            $query->where('taskable_type', \App\Models\Deal::class)
                  ->where('taskable_id', $request->deal_id);
        }

        $sortBy = in_array($request->sort_by, ['title', 'status', 'due_date', 'created_at', 'updated_at']) ? $request->sort_by : 'created_at';
        $sortDir = $request->sort_dir === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDir);

        $tasks = $query->paginate($this->paginationLimit($request));

        return response()->json([
            'status' => 'success',
            'data' => TaskResource::collection($tasks),
        ]);
    }

    public function store(StoreTaskRequest $request)
    {
        $this->authorize('create', Task::class);

        $data = $request->validated();
        
        $user = auth('sanctum')->user();
        if (!$user || !$user->workspace_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not associated with a workspace.'
            ], 400);
        }
        $data['workspace_id'] = $user->workspace_id;
        $data['created_by'] = $user->id;
        if (!empty($data['assigned_to']) && $data['assigned_to'] === $user->id) {
            // Allow assigning to self
        } elseif (empty($data['assigned_to'])) {
            unset($data['assigned_to']);
        }
        if (isset($data['taskable_type'])) {
            $data['taskable_type'] = $this->typeMap[$data['taskable_type']];
        }

        $task = Task::create($data);
        $task->load(['assignee', 'taskable']);

        return response()->json([
            'status' => 'success',
            'message' => 'added successfully',
            'data' => new TaskResource($task)
        ], 201);
    }

    public function show(Task $task)
    {
        $this->authorize('view', $task);

        $task->load(['assignee', 'taskable']);
        return response()->json([
            'status' => 'success',
            'data' => new TaskResource($task)
        ]);
    }

    public function update(UpdateTaskRequest $request, Task $task)
    {
        $this->authorize('update', $task);

        $data = $request->validated();
        
        if (isset($data['taskable_type'])) {
            $data['taskable_type'] = $this->typeMap[$data['taskable_type']];
        }

        $task->update($data);
        $task->load(['assignee', 'taskable']);

        return response()->json([
            'status' => 'success',
            'message' => 'updated successfully',
            'data' => new TaskResource($task)
        ]);
    }

    public function destroy(Task $task)
    {
        $this->authorize('delete', $task);

        $task->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'deleted successfully'
        ]);
    }
}