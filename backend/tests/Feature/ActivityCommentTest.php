<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Activity;
use App\Models\ActivityComment;

class ActivityCommentTest extends TestCase
{
    use TestHelpers;

    public function test_admin_can_list_activity_comments(): void
    {
        $this->authenticateAsAdmin();
        $activity = Activity::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
        ]);

        ActivityComment::factory()->count(2)->create([
            'workspace_id' => $this->workspace->id,
            'activity_id' => $activity->id,
            'user_id' => $this->adminUser->id,
        ]);

        $response = $this->getJson('/api/activities/' . $activity->id . '/comments');

        $response->assertStatus(200);
    }

    public function test_admin_can_create_activity_comment(): void
    {
        $this->authenticateAsAdmin();
        $activity = Activity::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
        ]);

        $response = $this->postJson('/api/activity-comments', [
            'activity_id' => $activity->id,
            'content' => 'Test comment',
        ]);

        $this->assertResourceCreated($response);
        $this->assertDatabaseHas('activity_comments', [
            'content' => 'Test comment',
        ]);
    }

    public function test_admin_can_show_activity_comment(): void
    {
        $this->authenticateAsAdmin();
        $activity = Activity::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
        ]);
        $comment = ActivityComment::factory()->create([
            'workspace_id' => $this->workspace->id,
            'activity_id' => $activity->id,
            'user_id' => $this->adminUser->id,
        ]);

        $response = $this->getJson('/api/activity-comments/' . $comment->id);

        $this->assertResourceShown($response);
    }

    public function test_admin_can_update_activity_comment(): void
    {
        $this->authenticateAsAdmin();
        $activity = Activity::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
        ]);
        $comment = ActivityComment::factory()->create([
            'workspace_id' => $this->workspace->id,
            'activity_id' => $activity->id,
            'user_id' => $this->adminUser->id,
        ]);

        $response = $this->putJson('/api/activity-comments/' . $comment->id, [
            'content' => 'Updated comment',
        ]);

        $this->assertResourceUpdated($response);
        $this->assertDatabaseHas('activity_comments', [
            'id' => $comment->id,
            'content' => 'Updated comment',
        ]);
    }

    public function test_admin_can_delete_activity_comment(): void
    {
        $this->authenticateAsAdmin();
        $activity = Activity::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
        ]);
        $comment = ActivityComment::factory()->create([
            'workspace_id' => $this->workspace->id,
            'activity_id' => $activity->id,
            'user_id' => $this->adminUser->id,
        ]);

        $response = $this->deleteJson('/api/activity-comments/' . $comment->id);

        $this->assertResourceDeleted($response);
        $this->assertDatabaseMissing('activity_comments', ['id' => $comment->id]);
    }

    public function test_create_activity_comment_requires_content(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/activity-comments', []);

        $this->assertValidationError($response);
    }

    public function test_user_cannot_view_another_workspace_activity_comment(): void
    {
        $this->authenticateAsAdmin();
        $otherComment = ActivityComment::factory()->create();

        $response = $this->getJson('/api/activity-comments/' . $otherComment->id);

        $this->assertNotFound($response);
    }
}
