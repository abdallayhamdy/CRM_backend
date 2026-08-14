<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('form_layouts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('object_type', 100);
            $table->json('groups');
            $table->timestamps();

            $table->unique(['workspace_id', 'object_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('form_layouts');
    }
};
