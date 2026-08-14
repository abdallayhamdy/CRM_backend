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
        Schema::create('activities', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete(); // ✅ ضروري للـ Global Scope
    $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
    $table->string('type');                     // call, meeting, email
    $table->string('subject');
    $table->text('description')->nullable();
    $table->timestamp('activity_date');
    $table->nullableUuidMorphs('activitable');          // contact, deal, company
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};
