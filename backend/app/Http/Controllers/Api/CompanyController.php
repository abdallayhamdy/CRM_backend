<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Contact;
use App\Http\Requests\StoreCompanyRequest;
use App\Http\Requests\UpdateCompanyRequest;
use App\Http\Resources\CompanyResource;
use App\Services\CompanyStageService;
use App\Traits\HasCustomDataFilter;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;
use Spatie\QueryBuilder\QueryBuilder;

class CompanyController extends Controller
{
    use AuthorizesRequests, HasCustomDataFilter;

    protected CompanyStageService $companyStageService;

    public function __construct(CompanyStageService $companyStageService)
    {
        $this->companyStageService = $companyStageService;
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', Company::class);

        $user = auth('sanctum')->user();
        $this->companyStageService->ensureStagesExist($user->workspace_id);

        $companies = QueryBuilder::for(Company::class)
            ->with(['assignee', 'stage'])
            ->allowedFilters(
                AllowedFilter::callback('assigned_to', function ($query, $value) {
                    if ($value === 'null') {
                        $query->whereNull('assigned_to');
                    } else {
                        $ids = is_array($value) ? $value : explode(',', $value);
                        $query->whereIn('assigned_to', $ids);
                    }
                }),
                AllowedFilter::callback('created_at', function ($query, $value) {
                    if (is_array($value)) {
                        if (isset($value['from'])) {
                            $query->where('companies.created_at', '>=', $value['from']);
                        }
                        if (isset($value['to'])) {
                            $query->where('companies.created_at', '<=', $value['to']);
                        }
                    }
                }),
                AllowedFilter::callback('lifecycle_stage', function ($query, $value) {
                    $values = is_array($value) ? $value : array_map('trim', explode(',', $value));
                    $query->whereHas('stage', function ($q) use ($values) {
                        $q->where(function ($inner) use ($values) {
                            foreach ($values as $val) {
                                $inner->orWhere('stages.slug', $val)
                                    ->orWhereRaw('LOWER(stages.name) = ?', [mb_strtolower(trim($val))]);
                            }
                        });
                    });
                }),
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
                ...$this->customDataFilters('company', 'companies', ['lifecycle_stage']),
            )
            ->allowedSorts(
                AllowedSort::field('name', 'companies.name'),
                AllowedSort::field('email', 'companies.email'),
                AllowedSort::field('phone', 'companies.phone'),
                AllowedSort::field('website', 'companies.website'),
                AllowedSort::field('created_at', 'companies.created_at'),
                AllowedSort::field('updated_at', 'companies.updated_at'),
                AllowedSort::callback('lifecycle_stage', function ($query, $descending, $property) {
                    $direction = $descending ? 'DESC' : 'ASC';
                    $query->leftJoin('stages', 'companies.stage_id', '=', 'stages.id')
                        ->orderBy('stages.order', $direction);
                }),
                AllowedSort::callback('last_activity_at', function (Builder $query, bool $descending, string $property) {
                    $direction = $descending ? 'DESC' : 'ASC';
                    $query->leftJoin('activities', function ($join) {
                        $join->on('companies.id', '=', 'activities.activitable_id')
                            ->where('activities.activitable_type', '=', Company::class);
                    })
                    ->groupBy('companies.id')
                    ->orderByRaw("MAX(activities.activity_date) {$direction} NULLS LAST");
                }),
            );

        // Permission-based scoping (resolves role baseline + permission-set scopes)
        $companies->applyRecordScope($user, 'companies', 'view');

        if ($request->q) {
            $companies->where(function ($q) use ($request) {
                $q->where('companies.name', 'like', "%{$request->q}%")
                ->orWhere('companies.email', 'like', "%{$request->q}%")
                ->orWhere('companies.phone', 'like', "%{$request->q}%")
                ->orWhere('companies.website', 'like', "%{$request->q}%");
            });
        }

        if (!$request->has('sort') && !$request->has('sort_by')) {
            $companies->defaultSort('-companies.created_at');
        }

        $paginated = $companies->paginate($this->paginationLimit($request));
        return CompanyResource::collection($paginated);
    }

    public function store(StoreCompanyRequest $request)
    {
        $this->authorize('create', Company::class);

        $data = $this->mapRequestFields($request->validated());
        $data['created_by'] = auth('sanctum')->id();

        $company = Company::create($data);
        $company->load(['assignee', 'stage']);

        return response()->json([
            'status' => 'success',
            'message' => 'added successfully',
            'data' => new CompanyResource($company)
        ], 201);
    }

    public function show(Company $company)
    {
        $this->authorize('view', $company);
        $company->load([
            'assignee', 'stage',
            'activities',
            'notes.user',
            'tasks.assignee',
        ]);

        return response()->json([
            'status' => 'success',
            'data' => new CompanyResource($company)
        ]);
    }

    public function update(UpdateCompanyRequest $request, Company $company)
    {
        $this->authorize('update', $company);

        $data = $this->mapRequestFields($request->validated(), $company->custom_data ?? []);

        $this->handleContactsAssociation($request, $company);

        $company->update($data);
        $company->load(['assignee', 'stage']);

        return response()->json([
            'status' => 'success',
            'message' => 'updated successfully',
            'data' => new CompanyResource($company)
        ]);
    }

    public function destroy(Company $company)
    {
        $this->authorize('delete', $company);

        $company->delete();

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

        if (isset($validated['name'])) $mapped['name'] = $validated['name'];
        if (isset($validated['industry'])) $mapped['industry'] = $validated['industry'];
        if (isset($validated['phone'])) $mapped['phone'] = $validated['phone'];
        if (isset($validated['email'])) $mapped['email'] = $validated['email'];

        if (isset($validated['domain'])) {
            $mapped['website'] = $validated['domain'];
        }

        if (isset($validated['owner_id'])) {
            $mapped['assigned_to'] = $validated['owner_id'];
        }

        if (isset($validated['lifecycle_stage'])) {
            $stageId = $this->companyStageService->resolveStageId($workspaceId, $validated['lifecycle_stage']);
            if ($stageId) {
                $mapped['stage_id'] = $stageId;
            }
        }

        $extraFields = [];
        foreach (['size', 'description', 'address'] as $field) {
            if (isset($validated[$field])) {
                $extraFields[$field] = $validated[$field];
            }
        }

        if (isset($validated['custom_fields'])) {
            $mapped['custom_data'] = array_merge($existingCustomData, $validated['custom_fields'], $extraFields);
        } elseif (!empty($extraFields)) {
            $mapped['custom_data'] = array_merge($existingCustomData, $extraFields);
        }

        return $mapped;
    }

    private function handleContactsAssociation(Request $request, Company $company): void
    {
        if (!$request->has('contacts')) return;

        $contacts = $request->input('contacts', []);
        $workspaceId = auth('sanctum')->user()->workspace_id;

        $contactIds = collect($contacts)->pluck('id')->filter()->all();
        if (!empty($contactIds)) {
            Contact::where('workspace_id', $workspaceId)
                ->whereIn('id', $contactIds)
                ->update(['company_id' => $company->id]);
        }
    }
}
