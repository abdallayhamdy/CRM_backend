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
       Schema::create('tasks', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();
    $table->foreignUuid('assigned_to')->nullable()->constrained('users')->nullOnDelete();
    $table->string('title');
    $table->foreignUuid('created_by')->constrained('users')->cascadeOnDelete();
    $table->timestamp('due_date')->nullable();
    $table->string('status')->default('pending'); // pending, completed
    $table->nullableUuidMorphs('taskable'); // contact, deal, company
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
