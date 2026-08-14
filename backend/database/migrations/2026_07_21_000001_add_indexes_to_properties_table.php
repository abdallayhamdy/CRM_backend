<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->unique(['workspace_id', 'object_type', 'name']);
            $table->index(['workspace_id', 'object_type']);
            $table->index(['workspace_id', 'is_archived']);
            $table->index(['workspace_id', 'object_type', 'is_archived']);
        });
    }

    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->dropUnique(['workspace_id', 'object_type', 'name']);
            $table->dropIndex(['workspace_id', 'object_type']);
            $table->dropIndex(['workspace_id', 'is_archived']);
            $table->dropIndex(['workspace_id', 'object_type', 'is_archived']);
        });
    }
};
