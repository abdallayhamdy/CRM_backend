<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Deal;

class ReportExportCsvInjectionTest extends TestCase
{
    use TestHelpers;

    public function test_export_sales_neutralizes_formula_injection_in_titles(): void
    {
        $this->authenticateAsAdmin();

        Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
            'title' => '=2+2',
        ]);
        Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
            'title' => '@SUM(1,1)',
        ]);
        Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
            'title' => '-1+2',
        ]);

        $response = $this->getJson('/api/reports/export?section=sales');

        $response->assertStatus(200);
        $content = $response->streamedContent();

        $this->assertStringContainsString("'=2+2", $content);
        $this->assertStringContainsString("'@SUM(1,1)", $content);
        $this->assertStringContainsString("'-1+2", $content);

        // No raw formula cell survives at a field boundary.
        $this->assertStringNotContainsString(',=2+2,', $content);
        $this->assertStringNotContainsString(',@SUM(1,1),', $content);
        $this->assertStringNotContainsString(',-1+2,', $content);
    }

    public function test_export_sales_keeps_normal_and_numeric_values_unchanged(): void
    {
        $this->authenticateAsAdmin();

        Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
            'title' => 'Normal Deal',
            'amount' => -5000,
        ]);

        $response = $this->getJson('/api/reports/export?section=sales');

        $response->assertStatus(200);
        $content = $response->streamedContent();

        $this->assertStringContainsString('Normal Deal', $content);

        // Pure negative numbers are legitimate values, not formulas.
        $this->assertStringContainsString(',-5000,', $content);
        $this->assertStringNotContainsString("'-5000", $content);
    }

    public function test_export_sales_sanitizes_leading_tab_and_equals_combined(): void
    {
        $this->authenticateAsAdmin();

        Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
            'title' => "\t=CMD",
        ]);

        $response = $this->getJson('/api/reports/export?section=sales');

        $response->assertStatus(200);
        $this->assertStringContainsString("'\t=CMD", $response->streamedContent());
    }
}
