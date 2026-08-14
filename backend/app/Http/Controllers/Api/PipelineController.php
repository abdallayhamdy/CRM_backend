<?php

namespace App\Http\Controllers\Api;

use App\Models\Pipeline;
use App\Http\Requests\StorePipelineRequest;
use App\Http\Requests\UpdatePipelineRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class PipelineController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Pipeline::class);

        $pipelines = Pipeline::with(['stages' => function ($query) {
            $query->orderBy('display_order');
        }])->paginate($this->paginationLimit($request));

        return response()->json(['pipelines' => $pipelines]);
    }

    public function store(StorePipelineRequest $request)
    {
        $this->authorize('create', Pipeline::class);

        $validated = $request->validated();
        $stages = $validated['stages'] ?? [];
        unset($validated['stages']);

        $pipeline = DB::transaction(function () use ($validated, $stages) {
            
            // لو ده المسار الافتراضي، نخلي الباقي مش افتراضي
            if (!empty($validated['is_default']) && $validated['is_default']) {
                Pipeline::where('workspace_id', auth()->user()->workspace_id)
                        ->update(['is_default' => false]);
            } else {
                // لو مفيش ولا مسار في الداتا بيز، نخلي ده الافتراضي غصب
                $count = Pipeline::where('workspace_id', auth()->user()->workspace_id)->count();
                if ($count === 0) $validated['is_default'] = true;
            }

            // 1. إنشاء المسار
            $validated['workspace_id'] = auth('sanctum')->user()->workspace_id;
            $pipeline = Pipeline::create($validated);

            // 2. إنشاء المراحل المرفقة (لو موجودة)
            if (!empty($stages)) {
                $stagesToInsert = [];
                $now = now();
                foreach ($stages as $index => $stage) {
                    $stagesToInsert[] = [
                        'id' => (string) \Illuminate\Support\Str::uuid(),
                        'pipeline_id' => $pipeline->id,
                        'name' => $stage['name'],
                        'win_probability' => $stage['win_probability'] ?? 0,
                        'display_order' => $index,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
                \App\Models\PipelineStage::insert($stagesToInsert);
            }

            return $pipeline->load('stages');
        });

        return response()->json([
            'status' => 'success',
            'pipeline' => $pipeline
        ], 201);
    }

    public function show(Pipeline $pipeline)
    {
        $this->authorize('view', $pipeline);

        // بنحمل المراحل ومعاها الصفقات اللي جواها عشان شاشة الـ Kanban
        $pipeline->load(['stages.deals' => function ($query) {
            $query->select('id', 'pipeline_stage_id', 'title', 'amount', 'contact_id', 'company_id')
                  ->with('contact:id,first_name,last_name', 'company:id,name');
        }]);

        return response()->json(['pipeline' => $pipeline]);
    }

    public function update(UpdatePipelineRequest $request, Pipeline $pipeline)
    {
        $this->authorize('update', $pipeline);

        $validated = $request->validated();

        DB::transaction(function () use ($validated, $pipeline) {
            if (!empty($validated['is_default']) && $validated['is_default'] && !$pipeline->is_default) {
                Pipeline::where('workspace_id', $pipeline->workspace_id)
                        ->where('id', '!=', $pipeline->id)
                        ->update(['is_default' => false]);
            }

            $pipeline->update($validated);
        });

        return response()->json([
            'status' => 'success',
            'pipeline' => $pipeline->load('stages')
        ]);
    }

    public function destroy(Pipeline $pipeline)
    {
        $this->authorize('delete', $pipeline);

        // حماية: مينفعش نمسح المسار الافتراضي
        if ($pipeline->is_default) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot delete the default pipeline.'
            ], 403);
        }

        $pipeline->delete();
        return response()->json(['status' => 'success']);
    }
}