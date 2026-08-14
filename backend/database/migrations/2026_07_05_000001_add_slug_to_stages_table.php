<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stages', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('name');
            $table->unique(['workspace_id', 'object_type', 'slug'], 'stages_workspace_type_slug_unique');
        });
    }

    public function down(): void
    {
        Schema::table('stages', function (Blueprint $table) {
            $table->dropUnique('stages_workspace_type_slug_unique');
            $table->dropColumn('slug');
        });
    }
};
