<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserViewPreferenceRequest;
use App\Http\Requests\UpdateUserViewPreferenceRequest;
use App\Http\Resources\UserViewPreferenceResource;
use App\Models\UserViewPreference;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

class UserViewPreferenceController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', UserViewPreference::class);

        $preferences = auth()->user()->viewPreferences()->paginate($this->paginationLimit($request));

        return UserViewPreferenceResource::collection($preferences);
    }

    public function store(StoreUserViewPreferenceRequest $request)
    {
        $this->authorize('create', UserViewPreference::class);

        $preference = UserViewPreference::updateOrCreate(
            [
                'user_id' => auth()->id(),
                'object_type' => $request->object_type,
            ],
            [
                'visible_columns' => $request->visible_columns,
                'column_order' => $request->column_order,
            ]
        );

        return new UserViewPreferenceResource($preference);
    }

    public function show(UserViewPreference $preference)
    {
        $this->authorize('view', $preference);

        return new UserViewPreferenceResource($preference);
    }

    public function update(UpdateUserViewPreferenceRequest $request, UserViewPreference $preference)
    {
        $this->authorize('update', $preference);

        $preference->update($request->validated());

        return new UserViewPreferenceResource($preference);
    }

    public function destroy(UserViewPreference $preference)
    {
        $this->authorize('delete', $preference);

        $preference->delete();

        return response()->json(['status' => 'success', 'message' => 'Preference deleted.']);
    }
}
