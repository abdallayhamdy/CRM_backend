<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Task;
use App\Models\Company;
use App\Models\User;

class TaskTest extends TestCase
{
    use TestHelpers;

    public function test_admin_can_list_tasks(): void
    {
        $this->authenticateAsAdmin();
        Task::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson('/api/tasks');

        $response->assertStatus(200);
    }

    public function test_admin_can_create_task(): void
    {
        $this->authenticateAsAdmin();
        $company = Company::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->postJson('/api/tasks', [
            'title' => 'Test Task',
            'taskable_type' => 'company',
            'taskable_id' => $company->id,
        ]);

        $this->assertResourceCreated($response);
        $this->assertDatabaseHas('tasks', [
            'title' => 'Test Task',
            'workspace_id' => $this->workspace->id,
        ]);
    }

    public function test_admin_can_show_task(): void
    {
        $this->authenticateAsAdmin();
        $task = Task::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson('/api/tasks/' . $task->id);

        $this->assertResourceShown($response);
    }

    public function test_admin_can_update_task(): void
    {
        $this->authenticateAsAdmin();
        $task = Task::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->putJson('/api/tasks/' . $task->id, [
            'title' => 'Updated Task',
        ]);

        $this->assertResourceUpdated($response);
        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'title' => 'Updated Task',
        ]);
    }

    public function test_admin_can_delete_task(): void
    {
        $this->authenticateAsAdmin();
        $task = Task::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->deleteJson('/api/tasks/' . $task->id);

        $this->assertResourceDeleted($response);
        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
    }

    public function test_create_task_requires_title(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/tasks', []);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['title']);
    }

    public function test_create_task_without_taskable_type(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/tasks', [
            'title' => 'Test',
        ]);

        $this->assertResourceCreated($response);
        $this->assertDatabaseHas('tasks', [
            'title' => 'Test',
            'taskable_type' => null,
        ]);
    }

    public function test_create_task_invalid_status(): void
    {
        $this->authenticateAsAdmin();
        $company = Company::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->postJson('/api/tasks', [
            'title' => 'Test',
            'taskable_type' => 'company',
            'taskable_id' => $company->id,
            'status' => 'invalid_status',
        ]);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['status']);
    }

    public function test_user_cannot_view_another_workspace_task(): void
    {
        $this->authenticateAsAdmin();
        $otherTask = Task::factory()->create();

        $response = $this->getJson('/api/tasks/' . $otherTask->id);

        $this->assertNotFound($response);
    }
}
