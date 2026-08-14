<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityResource;
use App\Http\Resources\CompanyResource;
use App\Http\Resources\ContactResource;
use App\Models\Activity;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Document;
use App\Models\Note;
use App\Models\Order;
use App\Models\Product;
use App\Models\Task;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Gate;

class SearchController extends Controller
{
    use AuthorizesRequests;

    public function contacts(Request $request)
    {
        $this->authorize('viewAny', Contact::class);

        $query = Contact::with(['company:id,name', 'assignee:id,name'])
            ->where(function ($q) use ($request) {
                $search = $request->q;
                if ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                }
            });

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        $contacts = $query->paginate($this->paginationLimit($request));

        return ContactResource::collection($contacts);
    }

    public function companies(Request $request)
    {
        $this->authorize('viewAny', Company::class);

        $query = Company::query();

        if ($search = $request->q) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('website', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $companies = $query->paginate($this->paginationLimit($request));

        return CompanyResource::collection($companies);
    }

    public function deals(Request $request)
    {
        $this->authorize('viewAny', Deal::class);

        $query = Deal::with(['stage', 'contact:id,first_name,last_name', 'company:id,name']);

        if ($search = $request->q) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('stage_id')) {
            $query->where('stage_id', $request->stage_id);
        }

        $deals = $query->paginate($this->paginationLimit($request));

        return response()->json($deals);
    }

    public function products(Request $request)
    {
        $this->authorize('viewAny', Product::class);

        $query = Product::query();

        if ($search = $request->q) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $products = $query->paginate($this->paginationLimit($request));

        return response()->json($products);
    }

    public function search(Request $request)
    {
        $search = trim($request->q ?? '');

        if ($search === '') {
            return response()->json([
                'contacts' => [],
                'companies' => [],
                'deals' => [],
                'products' => [],
                'tasks' => [],
                'activities' => [],
                'notes' => [],
                'tickets' => [],
                'orders' => [],
                'documents' => [],
            ]);
        }

        $contacts = collect();
        try {
            if ($search && Gate::allows('viewAny', Contact::class)) {
                $contacts = ContactResource::collection(
                    Contact::with(['company:id,name', 'assignee:id,name'])
                        ->where(function ($q) use ($search) {
                            $q->where('first_name', 'like', "%{$search}%")
                              ->orWhere('last_name', 'like', "%{$search}%")
                              ->orWhere('email', 'like', "%{$search}%");
                        })
                        ->limit(5)
                        ->get()
                );
            }
        } catch (\Throwable $e) {
            $contacts = collect();
        }

        $companies = collect();
        try {
            if ($search && Gate::allows('viewAny', Company::class)) {
                $companies = CompanyResource::collection(
                    Company::query()->where(function ($q) use ($search) {
                            $q->where('name', 'like', "%{$search}%")
                              ->orWhere('website', 'like', "%{$search}%")
                              ->orWhere('phone', 'like', "%{$search}%");
                        })
                        ->limit(5)
                        ->get()
                );
            }
        } catch (\Throwable $e) {
            $companies = collect();
        }

        $deals = collect();
        try {
            if ($search && Gate::allows('viewAny', Deal::class)) {
                $deals = Deal::with(['stage', 'contact:id,first_name,last_name', 'company:id,name'])
                    ->where('title', 'like', "%{$search}%")
                    ->limit(5)
                    ->get()
                    ->toArray();
            }
        } catch (\Throwable $e) {
            $deals = collect();
        }

        $products = collect();
        try {
            if ($search && Gate::allows('viewAny', Product::class)) {
                $products = Product::where(function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                          ->orWhere('sku', 'like', "%{$search}%");
                    })
                    ->limit(5)
                    ->get()
                    ->toArray();
            }
        } catch (\Throwable $e) {
            $products = collect();
        }

        $tasks = collect();
        try {
            if ($search && Gate::allows('viewAny', Task::class)) {
                $tasks = Task::with('assignee:id,name')
                    ->where(function ($q) use ($search) {
                        $q->where('title', 'like', "%{$search}%")
                          ->orWhere('description', 'like', "%{$search}%");
                    })
                    ->limit(5)
                    ->get()
                    ->toArray();
            }
        } catch (\Throwable $e) {
            $tasks = collect();
        }

        $activities = collect();
        try {
            if ($search && Gate::allows('viewAny', Activity::class)) {
                $activities = ActivityResource::collection(
                    Activity::with(['user:id,first_name,last_name,name', 'activitable'])
                        ->where(function ($q) use ($search) {
                            $q->where('subject', 'like', "%{$search}%")
                              ->orWhere('description', 'like', "%{$search}%");
                        })
                        ->limit(5)
                        ->get()
                );
            }
        } catch (\Throwable $e) {
            $activities = collect();
        }

        $notes = collect();
        try {
            if ($search && Gate::allows('viewAny', Note::class)) {
                $notes = Note::with('user:id,first_name,last_name,name')
                    ->where('content', 'like', "%{$search}%")
                    ->limit(5)
                    ->get()
                    ->toArray();
            }
        } catch (\Throwable $e) {
            $notes = collect();
        }

        $tickets = collect();
        try {
            if ($search && Gate::allows('viewAny', Ticket::class)) {
                $tickets = Ticket::with('contact:id,first_name,last_name')
                    ->where(function ($q) use ($search) {
                        $q->where('subject', 'like', "%{$search}%")
                          ->orWhere('description', 'like', "%{$search}%");
                    })
                    ->limit(5)
                    ->get()
                    ->toArray();
            }
        } catch (\Throwable $e) {
            $tickets = collect();
        }

        $orders = collect();
        try {
            if ($search && Gate::allows('viewAny', Order::class)) {
                $orders = Order::with(['contact:id,first_name,last_name', 'company:id,name'])
                    ->where(function ($q) use ($search) {
                        $q->where('order_number', 'like', "%{$search}%")
                          ->orWhere('title', 'like', "%{$search}%");
                    })
                    ->limit(5)
                    ->get()
                    ->toArray();
            }
        } catch (\Throwable $e) {
            $orders = collect();
        }

        $documents = collect();
        try {
            if ($search && Gate::allows('viewAny', Document::class)) {
                $documents = Document::with('uploader:id,name')
                    ->where('name', 'like', "%{$search}%")
                    ->limit(5)
                    ->get()
                    ->toArray();
            }
        } catch (\Throwable $e) {
            $documents = collect();
        }

        return response()->json([
            'contacts' => $contacts,
            'companies' => $companies,
            'deals' => $deals,
            'products' => $products,
            'tasks' => $tasks,
            'activities' => $activities,
            'notes' => $notes,
            'tickets' => $tickets,
            'orders' => $orders,
            'documents' => $documents,
        ]);
    }
}
