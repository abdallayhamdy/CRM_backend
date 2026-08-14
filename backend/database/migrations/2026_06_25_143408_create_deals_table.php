<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
       Schema::create('deals', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();
    $table->foreignUuid('contact_id')->constrained()->cascadeOnDelete();
    $table->foreignUuid('company_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignUuid('stage_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignUuid('assigned_to')->nullable()->constrained('users')->nullOnDelete();
    $table->string('title');
    $table->decimal('amount', 15, 2)->default(0); 
    $table->string('status')->default('open');
    $table->decimal('value', 15, 2)->default(0);
    $table->date('expected_close_date')->nullable();
    $table->json('custom_data')->nullable();
    $table->timestamps();
    $table->softDeletes();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deals');
    }
};
