<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Http\Resources\ActivityResource;
use App\Http\Resources\ActivityCollection;
use App\Http\Requests\StoreActivityRequest;
use App\Http\Requests\UpdateActivityRequest;
use App\Support\ActivityChangeParser;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class ActivityController extends Controller
{
    use AuthorizesRequests;

    private const ENTITY_TYPE_MAP = [
        'contact' => \App\Models\Contact::class,
        'deal' => \App\Models\Deal::class,
        'ticket' => \App\Models\Ticket::class,
        'company' => \App\Models\Company::class,
        'task' => \App\Models\Task::class,
        'order' => \App\Models\Order::class,
        'product' => \App\Models\Product::class,
        'note' => \App\Models\Note::class,
        'document' => \App\Models\Document::class,
    ];

    public function index(Request $request)
    {
        $this->authorize('viewAny', Activity::class);

        $user = auth('sanctum')->user();

        $query = Activity::with('user', 'activitable');

        $query->applyRecordScope($user, 'activities', 'view');

        if ($request->q) {
            $query->where(function ($q) use ($request) {
                $q->where('subject', 'like', "%{$request->q}%")
                  ->orWhere('description', 'like', "%{$request->q}%");
            });
        }

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->owner_id) {
            $query->where('user_id', $request->owner_id);
        }

        if ($request->completed !== null && $request->completed !== undefined) {
            $completed = filter_var($request->completed, FILTER_VALIDATE_BOOLEAN);
            $query->where('status', $completed ? 'completed' : 'pending');
        }

        if ($request->deal_id) {
            $query->where('activitable_type', 'App\Models\Deal')
                  ->where('activitable_id', $request->deal_id);
        }

        if ($request->contact_id) {
            $query->where('activitable_type', 'App\Models\Contact')
                  ->where('activitable_id', $request->contact_id);
        }

        if ($request->company_id) {
            $query->where('activitable_type', 'App\Models\Company')
                  ->where('activitable_id', $request->company_id);
        }

        if ($request->ticket_id) {
            $query->where('activitable_type', 'App\Models\Ticket')
                ->where('activitable_id', $request->ticket_id);
        }
        if ($request->entity_type) {
            $type = strtolower(trim($request->entity_type));
            if (isset(self::ENTITY_TYPE_MAP[$type])) {
                $query->where('activitable_type', self::ENTITY_TYPE_MAP[$type]);
            }
        }
        if ($request->record_id) {
            $query->where('activitable_id', $request->record_id);
        }
        $sortBy = in_array($request->sort_by, ['subject', 'type', 'created_at', 'activity_date']) ? $request->sort_by : 'created_at';
        $sortDir = $request->sort_dir === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDir);

        $activities = $query->paginate($this->paginationLimit($request, 20));

        $nameMap = $this->buildNameMap($activities->items());

        return response()->json([
            'status' => 'success',
            'data' => new ActivityCollection($activities, $nameMap),
            'meta' => [
                'page' => $activities->currentPage(),
                'limit' => $activities->perPage(),
                'total' => $activities->total(),
                'last_page' => $activities->lastPage(),
            ],
        ]);
    }

    public function store(StoreActivityRequest $request)
    {
        $this->authorize('create', Activity::class);

        $validated = $request->validated();

        $activitableType = null;
        $activitableId = null;

        if (isset($validated['contact_id'])) {
            $activitableType = 'App\Models\Contact';
            $activitableId = $validated['contact_id'];
        } elseif (isset($validated['deal_id'])) {
            $activitableType = 'App\Models\Deal';
            $activitableId = $validated['deal_id'];
        } elseif (isset($validated['ticket_id'])) {
            $activitableType = 'App\Models\Ticket';
            $activitableId = $validated['ticket_id'];
        } elseif (isset($validated['company_id'])) {
            $activitableType = 'App\Models\Company';
            $activitableId = $validated['company_id'];
        }

        $activity = Activity::create([
            'workspace_id' => auth('sanctum')->user()->workspace_id,
            'user_id' => $validated['owner_id'] ?? auth('sanctum')->id(),
            'type' => $validated['type'],
            'subject' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'activity_date' => $validated['activity_date'] ?? now(),
            'call_outcome' => $validated['call_outcome'] ?? null,
            'activitable_type' => $activitableType,
            'activitable_id' => $activitableId,
        ]);

        $activity->load('user', 'activitable');
        $nameMap = $this->buildNameMap([$activity]);

        return response()->json([
            'status' => 'success',
            'message' => 'Activity created successfully',
            'data' => new ActivityResource($activity, $nameMap),
        ], 201);
    }

    public function show(Activity $activity)
    {
        $this->authorize('view', $activity);

        $activity->load('user', 'activitable');
        $nameMap = $this->buildNameMap([$activity]);

        return response()->json([
            'status' => 'success',
            'data' => new ActivityResource($activity, $nameMap),
        ]);
    }

    public function update(UpdateActivityRequest $request, Activity $activity)
    {
        $this->authorize('update', $activity);

        $validated = $request->validated();

        $data = [];

        if (isset($validated['type'])) $data['type'] = $validated['type'];
        if (isset($validated['title'])) $data['subject'] = $validated['title'];
        if (array_key_exists('description', $validated)) $data['description'] = $validated['description'];
        if (isset($validated['owner_id'])) $data['user_id'] = $validated['owner_id'];
        if (array_key_exists('activity_date', $validated)) $data['activity_date'] = $validated['activity_date'];
        if (array_key_exists('call_outcome', $validated)) $data['call_outcome'] = $validated['call_outcome'];

        if (isset($validated['contact_id'])) {
            $data['activitable_type'] = 'App\Models\Contact';
            $data['activitable_id'] = $validated['contact_id'];
        } elseif (isset($validated['deal_id'])) {
            $data['activitable_type'] = 'App\Models\Deal';
            $data['activitable_id'] = $validated['deal_id'];
        } elseif (isset($validated['ticket_id'])) {
            $data['activitable_type'] = 'App\Models\Ticket';
            $data['activitable_id'] = $validated['ticket_id'];
        } elseif (isset($validated['company_id'])) {
            $data['activitable_type'] = 'App\Models\Company';
            $data['activitable_id'] = $validated['company_id'];
        }

        $activity->update($data);
        $activity->load('user', 'activitable');
        $nameMap = $this->buildNameMap([$activity]);

        return response()->json([
            'status' => 'success',
            'message' => 'Activity updated successfully',
            'data' => new ActivityResource($activity, $nameMap),
        ]);
    }

    public function destroy(Activity $activity)
    {
        $this->authorize('delete', $activity);

        $activity->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Activity deleted successfully',
            'data' => null,
        ]);
    }

    /**
     * Collect all UUIDs from activity changes and bulk-fetch referenced entities.
     *
     * @param  \Illuminate\Database\Eloquent\Collection<int, Activity>  $activities
     * @return array<string, string>  UUID → display name
     */
    private function buildNameMap($activities): array
    {
        $allUuids = [];

        foreach ($activities as $activity) {
            $changes = ActivityChangeParser::parse($activity->description);
            if ($changes === []) {
                continue;
            }
            $uuidsByField = ActivityChangeParser::collectEntityUuids($changes);
            foreach ($uuidsByField as $field => $uuids) {
                foreach ($uuids as $uuid) {
                    $allUuids[$uuid] = $field;
                }
            }
        }

        if ($allUuids === []) {
            return [];
        }

        $uuidsByModel = [
            \App\Models\User::class => [],
            \App\Models\Contact::class => [],
            \App\Models\Company::class => [],
            \App\Models\Deal::class => [],
            \App\Models\Ticket::class => [],
        ];

        $userFields = ['assigned_to', 'owner_id', 'assignee_id', 'user_id'];

        foreach ($allUuids as $uuid => $field) {
            if (in_array($field, $userFields, true)) {
                $uuidsByModel[\App\Models\User::class][] = $uuid;
            } elseif ($field === 'contact_id') {
                $uuidsByModel[\App\Models\Contact::class][] = $uuid;
            } elseif ($field === 'company_id') {
                $uuidsByModel[\App\Models\Company::class][] = $uuid;
            } elseif ($field === 'deal_id') {
                $uuidsByModel[\App\Models\Deal::class][] = $uuid;
            } elseif ($field === 'ticket_id') {
                $uuidsByModel[\App\Models\Ticket::class][] = $uuid;
            }
        }

        $nameMap = [];

        // Users
        $userUuids = array_unique($uuidsByModel[\App\Models\User::class]);
        if ($userUuids !== []) {
            $users = \App\Models\User::whereIn('id', $userUuids)->get(['id', 'name']);
            foreach ($users as $user) {
                $nameMap[$user->id] = $user->name;
            }
        }

        // Contacts
        $contactUuids = array_unique($uuidsByModel[\App\Models\Contact::class]);
        if ($contactUuids !== []) {
            $contacts = \App\Models\Contact::whereIn('id', $contactUuids)->get(['id', 'first_name', 'last_name']);
            foreach ($contacts as $contact) {
                $nameMap[$contact->id] = trim("{$contact->first_name} {$contact->last_name}");
            }
        }

        // Companies
        $companyUuids = array_unique($uuidsByModel[\App\Models\Company::class]);
        if ($companyUuids !== []) {
            $companies = \App\Models\Company::whereIn('id', $companyUuids)->get(['id', 'name']);
            foreach ($companies as $company) {
                $nameMap[$company->id] = $company->name;
            }
        }

        // Deals
        $dealUuids = array_unique($uuidsByModel[\App\Models\Deal::class]);
        if ($dealUuids !== []) {
            $deals = \App\Models\Deal::whereIn('id', $dealUuids)->get(['id', 'title']);
            foreach ($deals as $deal) {
                $nameMap[$deal->id] = $deal->title;
            }
        }

        // Tickets
        $ticketUuids = array_unique($uuidsByModel[\App\Models\Ticket::class]);
        if ($ticketUuids !== []) {
            $tickets = \App\Models\Ticket::whereIn('id', $ticketUuids)->get(['id', 'subject']);
            foreach ($tickets as $ticket) {
                $nameMap[$ticket->id] = $ticket->subject;
            }
        }

        return $nameMap;
    }
}
