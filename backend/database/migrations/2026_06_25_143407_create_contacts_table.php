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
      Schema::create('contacts', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();
    $table->foreignUuid('company_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignUuid('stage_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignUuid('assigned_to')->nullable()->constrained('users')->nullOnDelete(); // ✅ مين المسؤول
    $table->string('first_name');
    $table->string('last_name')->nullable();
    $table->string('email')->nullable();
    $table->string('phone')->nullable();
    $table->json('custom_data')->nullable(); // جاهز للـ Phase 2
    $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamps();
    $table->softDeletes();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contacts');
    }
};
