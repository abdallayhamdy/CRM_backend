<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\QueryFilters\ContactLeadStatusFilter;
use App\QueryFilters\ContactLifecycleStageFilter;
use App\Traits\HasCustomDataFilter;
use Illuminate\Http\Request;
use App\Http\Requests\StoreContactRequest;
use App\Http\Requests\UpdateContactRequest;
use App\Http\Resources\ContactResource;
use App\Models\Contact;
use App\Services\ContactStageService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;
use Spatie\QueryBuilder\QueryBuilder;

class ContactController extends Controller
{
    use AuthorizesRequests, HasCustomDataFilter;

    protected ContactStageService $contactStageService;

    public function __construct(ContactStageService $contactStageService)
    {
        $this->contactStageService = $contactStageService;
    }

    public function index(Request $request)
    {
        $user = auth('sanctum')->user();

        $this->authorize('viewAny', Contact::class);

        $workspaceId = $user?->workspace_id;
        if (!$workspaceId) {
            return response()->json([
                'status' => 'error',
                'message' => 'workspace_id is required.',
            ], 400);
        }

        $this->contactStageService->ensureStagesExist($workspaceId);

        $query = QueryBuilder::for(Contact::class)
            ->allowedFilters(...[
                AllowedFilter::custom('lead_status', new ContactLeadStatusFilter()),
                AllowedFilter::custom('lifecycle_stage', new ContactLifecycleStageFilter()),
                AllowedFilter::callback('assigned_to', function (Builder $query, $value) {
                    if ($value === 'null' || $value === null) {
                        $query->whereNull('contacts.assigned_to');
                    } elseif (is_string($value) && str_contains($value, ',')) {
                        $ids = array_map('trim', explode(',', $value));
                        $query->whereIn('contacts.assigned_to', $ids);
                    } else {
                        $query->where('contacts.assigned_to', $value);
                    }
                }),
                AllowedFilter::callback('created_at', function (Builder $query, $value) {
                    if (is_array($value)) {
                        if (!empty($value['from'])) {
                            $query->where('contacts.created_at', '>=', $value['from']);
                        }
                        if (!empty($value['to'])) {
                            $query->where('contacts.created_at', '<=', $value['to'] . ' 23:59:59');
                        }
                    } elseif (is_string($value)) {
                        $query->whereDate('contacts.created_at', $value);
                    }
                }),
                AllowedFilter::callback('updated_at', function (Builder $query, $value) {
                    if (is_array($value)) {
                        if (!empty($value['from'])) {
                            $query->where('contacts.updated_at', '>=', $value['from']);
                        }
                        if (!empty($value['to'])) {
                            $query->where('contacts.updated_at', '<=', $value['to'] . ' 23:59:59');
                        }
                    } elseif (is_string($value)) {
                        $query->whereDate('contacts.updated_at', $value);
                    }
                }),
                ...$this->customDataFilters('contact', 'contacts'),
                AllowedFilter::callback('last_activity_at', function (Builder $query, $value) {
                    if (is_array($value)) {
                        if (!empty($value['from'])) {
                            $query->whereHas('activities', function (Builder $aq) use ($value) {
                                $aq->where('activity_date', '>=', $value['from']);
                            });
                        }
                        if (!empty($value['to'])) {
                            $query->whereHas('activities', function (Builder $aq) use ($value) {
                                $aq->where('activity_date', '<=', $value['to'] . ' 23:59:59');
                            });
                        }
                    } elseif (is_string($value)) {
                        $query->whereHas('activities', function (Builder $aq) use ($value) {
                            $aq->whereDate('activity_date', $value);
                        });
                    }
                }),
            ])
            ->allowedSorts(...[
                AllowedSort::field('first_name', 'contacts.first_name'),
                AllowedSort::field('last_name', 'contacts.last_name'),
                AllowedSort::field('email', 'contacts.email'),
                AllowedSort::field('phone', 'contacts.phone'),
                AllowedSort::field('created_at', 'contacts.created_at'),
                AllowedSort::field('updated_at', 'contacts.updated_at'),
                AllowedSort::callback('lifecycle_stage', function (Builder $query, bool $descending, string $property) {
                    $direction = $descending ? 'DESC' : 'ASC';
                    $query->leftJoin('stages', 'contacts.stage_id', '=', 'stages.id')
                        ->orderBy('stages.order', $direction)
                        ->select('contacts.*');
                }),
            ])
            ->allowedIncludes('company', 'assignee', 'stage')
            ->with(['company', 'assignee', 'stage']);

        // Permission-based scoping (resolves role baseline + permission-set scopes)
        $query->applyRecordScope($user, 'contacts', 'view');

        // Search query (backwards-compatible ?q= parameter)
        if ($request->q) {
            $query->where(function (Builder $q) use ($request) {
                $q->where('contacts.first_name', 'like', "%{$request->q}%")
                  ->orWhere('contacts.last_name', 'like', "%{$request->q}%")
                  ->orWhere('contacts.email', 'like', "%{$request->q}%")
                  ->orWhere('contacts.phone', 'like', "%{$request->q}%");
            });
        }

        // Sorting: fall back to created_at desc if no sort specified via Spatie
        if ($request->has('sort')) {
            // Spatie handles sort from ?sort[field] params
        } elseif ($request->has('sort_by')) {
            // Legacy: support sort_by/sort_dir from frontend
            $sortField = in_array($request->sort_by, ['first_name', 'last_name', 'email', 'phone', 'created_at', 'updated_at'])
                ? "contacts.{$request->sort_by}" : 'contacts.created_at';
            $sortDir = $request->sort_dir === 'asc' ? 'asc' : 'desc';
            $query->orderBy($sortField, $sortDir);
        } else {
            $query->orderBy('contacts.created_at', 'desc');
        }

        $contacts = $query->paginate($this->paginationLimit($request));
        return ContactResource::collection($contacts);
    }

    public function store(StoreContactRequest $request)
    {
        $this->authorize('create', Contact::class);

        $data = $this->mapRequestFields($request->validated(), []);

        $data['created_by'] = auth('sanctum')->id();

        $contact = Contact::create($data);

        $contact->load(['company', 'assignee', 'stage']);

        return response()->json([
            'status' => 'success',
            'message' => 'added successfully',
            'data' => new ContactResource($contact)
        ], 201);
    }

    public function show(Contact $contact)
    {
        $this->authorize('view', $contact);
        $contact->load([
            'company', 'assignee', 'stage',
            'activities',
            'notes.user',
            'deals.pipelineStage',
            'tasks.assignee',
        ]);

        return response()->json([
            'status' => 'success',
            'data' => new ContactResource($contact)
        ]);
    }

    public function update(UpdateContactRequest $request, Contact $contact)
    {
        $this->authorize('update', $contact);

        $data = $this->mapRequestFields($request->validated(), $contact->custom_data ?? []);

        $contact->update($data);
        $contact->load(['company', 'assignee', 'stage']);

        return response()->json([
            'status' => 'success',
            'message' => 'updated successfully',
            'data' => new ContactResource($contact)
        ]);
    }

    public function destroy(Contact $contact)
    {
        $this->authorize('delete', $contact);
        $contact->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'deleted successfully'
        ]);
    }

    private function mapRequestFields(array $validated, array $existingCustomData = []): array
    {
        $user = auth('sanctum')->user();
        $workspaceId = $user->workspace_id;

        $mapped = [
            'workspace_id' => $workspaceId,
        ];

        if (isset($validated['first_name'])) {
            $mapped['first_name'] = $validated['first_name'];
        }
        if (isset($validated['last_name'])) {
            $mapped['last_name'] = $validated['last_name'];
        }
        if (isset($validated['email'])) {
            $mapped['email'] = $validated['email'];
        }
        if (isset($validated['phone'])) {
            $mapped['phone'] = $validated['phone'];
        }
        if (isset($validated['company_id'])) {
            $mapped['company_id'] = $validated['company_id'];
        }
        if (isset($validated['company_name'])) {
            $mapped['company_name'] = $validated['company_name'];
        }

        if (isset($validated['owner_id'])) {
            $mapped['assigned_to'] = $validated['owner_id'];
        }

        if (isset($validated['lifecycle_stage'])) {
            $stageId = $this->contactStageService->resolveStageId($workspaceId, $validated['lifecycle_stage']);
            if ($stageId) {
                $mapped['stage_id'] = $stageId;
            }
        }

        // Merge custom fields onto existing custom_data so partial updates
        // (e.g. email opt-out) never wipe previously stored values.
        $customData = $existingCustomData;

        if (isset($validated['custom_fields'])) {
            $customData = array_merge($existingCustomData, $validated['custom_fields']);
        }

        if (isset($validated['emailOptOut'])) {
            $customData['email_opt_out'] = (bool) $validated['emailOptOut'];
        }

        if (isset($validated['source'])) {
            $customData['source'] = $validated['source'];
        }

        if (isset($validated['custom_fields']) || isset($validated['emailOptOut']) || isset($validated['source']) || !empty($customData)) {
            $mapped['custom_data'] = $customData;
        }

        return $mapped;
    }
}
