<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Pipeline;
use App\Models\PipelineStage;

class PipelineTest extends TestCase
{
    use TestHelpers;

    public function test_admin_can_list_pipelines(): void
    {
        $this->authenticateAsAdmin();
        Pipeline::factory()->count(2)->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson('/api/pipelines');

        $response->assertStatus(200);
    }

    public function test_admin_can_create_pipeline_with_stages(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/pipelines', [
            'name' => 'Sales Pipeline',
            'is_default' => true,
            'stages' => [
                ['name' => 'Lead', 'win_probability' => 10],
                ['name' => 'Qualified', 'win_probability' => 30],
                ['name' => 'Closed Won', 'win_probability' => 100],
            ],
        ]);

        $this->assertResourceCreated($response);
        $this->assertDatabaseHas('pipelines', [
            'name' => 'Sales Pipeline',
            'workspace_id' => $this->workspace->id,
        ]);
        $this->assertDatabaseCount('pipeline_stages', 3);
    }

    public function test_admin_can_show_pipeline(): void
    {
        $this->authenticateAsAdmin();
        $pipeline = Pipeline::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson('/api/pipelines/' . $pipeline->id);

        $this->assertResourceShown($response);
    }

    public function test_admin_can_update_pipeline(): void
    {
        $this->authenticateAsAdmin();
        $pipeline = Pipeline::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->putJson('/api/pipelines/' . $pipeline->id, [
            'name' => 'Updated Pipeline',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('pipelines', [
            'id' => $pipeline->id,
            'name' => 'Updated Pipeline',
        ]);
    }

    public function test_admin_can_delete_pipeline(): void
    {
        $this->authenticateAsAdmin();
        $pipeline = Pipeline::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->deleteJson('/api/pipelines/' . $pipeline->id);

        $this->assertResourceDeleted($response);
        $this->assertDatabaseMissing('pipelines', ['id' => $pipeline->id]);
    }

    public function test_cannot_delete_default_pipeline(): void
    {
        $this->authenticateAsAdmin();
        $pipeline = Pipeline::factory()->create([
            'workspace_id' => $this->workspace->id,
            'is_default' => true,
        ]);

        $response = $this->deleteJson('/api/pipelines/' . $pipeline->id);

        $response->assertStatus(403);
    }

    public function test_create_pipeline_requires_name(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/pipelines', []);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_user_cannot_view_another_workspace_pipeline(): void
    {
        $this->authenticateAsAdmin();
        $otherPipeline = Pipeline::factory()->create();

        $response = $this->getJson('/api/pipelines/' . $otherPipeline->id);

        $this->assertNotFound($response);
    }
}
