<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('property_groups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('object_type');
            $table->string('name');
            $table->integer('display_order')->default(0);
            $table->timestamps();

            $table->unique(['workspace_id', 'object_type', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_groups');
    }
};
