<?php

namespace App\Http\Controllers\Api;

use App\Models\Deal;
use App\Models\Pipeline;
use App\Models\PipelineStage;
use App\Http\Requests\StoreDealRequest;
use App\Http\Requests\UpdateDealRequest;
use App\Http\Resources\DealResource;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DealController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Deal::class);

        $query = Deal::with(['stage', 'pipelineStage.pipeline', 'contact', 'company', 'assignee']);

        if ($request->q) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', "%{$request->q}%");
            });
        }

        if ($request->pipeline_id) {
            $query->whereHas('pipelineStage', function ($q) use ($request) {
                $q->where('pipeline_id', $request->pipeline_id);
            });
        }

        if ($request->stage) {
            $query->whereHas('pipelineStage', function ($q) use ($request) {
                $q->where('name', $request->stage);
            });
        }

        if ($request->pipeline_stage_id) {
            $query->where('pipeline_stage_id', $request->pipeline_stage_id);
        }

        if ($request->company_id) {
            $query->where('company_id', $request->company_id);
        }

        if ($request->contact_id) {
            $query->where('contact_id', $request->contact_id);
        }

        if ($request->owner_id) {
            $query->where('assigned_to', $request->owner_id);
        }

        $sortBy = in_array($request->sort_by, ['title', 'amount', 'status', 'created_at', 'updated_at', 'expected_close_date']) ? $request->sort_by : 'created_at';
        $sortDir = $request->sort_dir === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDir);

        $deals = $query->paginate($this->paginationLimit($request));

        return response()->json([
            'status' => 'success',
            'data' => DealResource::collection($deals),
            'meta' => [
                'page' => $deals->currentPage(),
                'limit' => $deals->perPage(),
                'total' => $deals->total(),
                'last_page' => $deals->lastPage(),
            ],
        ]);
    }

    public function store(StoreDealRequest $request)
    {
        $this->authorize('create', Deal::class);

        $data = $this->mapRequestFields($request->validated());

        if (empty($data['pipeline_stage_id'])) {
            $defaultPipeline = Pipeline::where('workspace_id', auth()->user()->workspace_id)
                ->where('is_default', true)
                ->with(['stages' => function ($query) {
                    $query->orderBy('display_order')->limit(1);
                }])
                ->first();

            if ($defaultPipeline && $defaultPipeline->stages->isNotEmpty()) {
                $data['pipeline_stage_id'] = $defaultPipeline->stages->first()->id;
            }
        }

        $deal = Deal::create($data);

        return response()->json([
            'status' => 'success',
            'data' => new DealResource($deal->load(['stage', 'pipelineStage.pipeline', 'contact', 'company', 'assignee']))
        ], 201);
    }

    public function show(Deal $deal)
    {
        $this->authorize('view', $deal);

        return response()->json([
            'status' => 'success', 
            'data' => new DealResource($deal->load([
                'stage', 'pipelineStage.pipeline', 'contact', 'company', 'assignee',
                'activities',
                'notes.user',
                'tasks.assignee',
            ]))
        ]);
    }

    public function update(UpdateDealRequest $request, Deal $deal)
    {
        $this->authorize('update', $deal);

        $data = $this->mapRequestFields($request->validated());

        $deal->update($data);

        return response()->json([
            'status' => 'success',
            'data' => new DealResource($deal->load(['stage', 'pipelineStage.pipeline', 'contact', 'company', 'assignee']))
        ]);
    }

    public function moveStage(Request $request, Deal $deal)
    {
        $this->authorize('update', $deal);

        $request->validate([
            'pipeline_stage_id' => [
                'nullable',
                Rule::exists('pipeline_stages', 'id')->where(function ($query) use ($request) {
                    if ($request->user()?->is_super_admin) {
                        return;
                    }
                    $query->whereExists(function ($q) use ($request) {
                        $q->select(DB::raw(1))
                            ->from('pipelines')
                            ->whereColumn('pipelines.id', 'pipeline_stages.pipeline_id')
                            ->where('pipelines.workspace_id', $request->user()?->workspace_id);
                    });
                }),
            ],
            'stage_id' => [
                'nullable',
                Rule::exists('pipeline_stages', 'id')->where(function ($query) use ($request) {
                    if ($request->user()?->is_super_admin) {
                        return;
                    }
                    $query->whereExists(function ($q) use ($request) {
                        $q->select(DB::raw(1))
                            ->from('pipelines')
                            ->whereColumn('pipelines.id', 'pipeline_stages.pipeline_id')
                            ->where('pipelines.workspace_id', $request->user()?->workspace_id);
                    });
                }),
            ],
            'stage' => 'nullable|string|max:255',
        ]);

        $stageId = $request->pipeline_stage_id ?? $request->stage_id;

        if (!$stageId && $request->stage) {
            $stageId = $this->resolvePipelineStageId($request->stage);
        }

        if ($stageId) {
            $deal->update(['pipeline_stage_id' => $stageId]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Deal moved successfully',
            'data' => new DealResource($deal->load(['stage', 'pipelineStage.pipeline', 'contact', 'company', 'assignee']))
        ]);
    }

    public function associateContact(Request $request, Deal $deal)
    {
        $this->authorize('update', $deal);

        $request->validate([
            'contact_id' => [
                'required',
                'uuid',
                Rule::exists('contacts', 'id')->where(function ($query) use ($request) {
                    if ($request->user()?->is_super_admin) {
                        return;
                    }
                    $query->where('workspace_id', $request->user()?->workspace_id);
                }),
            ],
        ]);

        $deal->update([
            'contact_id' => $request->contact_id
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Contact associated successfully',
            'data' => new DealResource($deal->load(['stage', 'pipelineStage.pipeline', 'contact', 'company', 'assignee']))
        ]);
    }

    public function destroy(Deal $deal)
    {
        $this->authorize('delete', $deal);

        $deal->delete();
        return response()->json(['status' => 'success']);
    }

    protected function mapRequestFields(array $data): array
    {
        $user = auth('sanctum')->user();
        $mapped = [
            'workspace_id' => $user->workspace_id,
        ];

        if (isset($data['title'])) $mapped['title'] = $data['title'];
        if (isset($data['amount'])) $mapped['amount'] = $data['amount'];
        if (isset($data['company_id'])) $mapped['company_id'] = $data['company_id'];
        if (isset($data['contact_id'])) $mapped['contact_id'] = $data['contact_id'];
        if (isset($data['status'])) $mapped['status'] = $data['status'];
        if (isset($data['custom_data'])) $mapped['custom_data'] = $data['custom_data'];
        if (isset($data['custom_fields'])) $mapped['custom_data'] = $data['custom_fields'];

        // owner_id -> assigned_to
        if (isset($data['owner_id'])) {
            $mapped['assigned_to'] = $data['owner_id'];
        }
        if (isset($data['assigned_to'])) {
            $mapped['assigned_to'] = $data['assigned_to'];
        }

        // close_date -> expected_close_date
        if (isset($data['close_date'])) {
            $mapped['expected_close_date'] = $data['close_date'];
        }
        if (isset($data['expected_close_date'])) {
            $mapped['expected_close_date'] = $data['expected_close_date'];
        }

        // stage_id (frontend means pipeline_stage_id) -> pipeline_stage_id
        if (isset($data['stage_id'])) {
            $mapped['pipeline_stage_id'] = $data['stage_id'];
        }
        if (isset($data['pipeline_stage_id'])) {
            $mapped['pipeline_stage_id'] = $data['pipeline_stage_id'];
        }

        // stage string -> pipeline_stage_id (for board drag & preview edits)
        if (isset($data['stage']) && !isset($data['stage_id']) && !isset($data['pipeline_stage_id'])) {
            $resolvedId = $this->resolvePipelineStageId($data['stage']);
            if ($resolvedId) {
                $mapped['pipeline_stage_id'] = $resolvedId;
            }
        }

        // Store deal_type and priority in custom_data
        $customData = $mapped['custom_data'] ?? $data['custom_data'] ?? [];
        if (isset($data['deal_type'])) {
            $customData['deal_type'] = $data['deal_type'];
        }
        if (isset($data['priority'])) {
            $customData['priority'] = $data['priority'];
        }
        if (isset($data['probability'])) {
            $customData['probability'] = $data['probability'];
        }
        if (!empty($customData)) {
            $mapped['custom_data'] = $customData;
        }

        return $mapped;
    }

    protected function resolvePipelineStageId(string $stageSlug): ?string
    {
        $stageName = str_replace('_', ' ', $stageSlug);
        $stageName = ucwords($stageName);

        $workspaceId = auth()->user()->workspace_id;

        $stage = PipelineStage::whereHas('pipeline', function ($q) use ($workspaceId) {
            $q->where('workspace_id', $workspaceId);
        })->where('name', $stageName)->first();

        return $stage?->id;
    }
}
