<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'workspace_id')) {
                $table->foreignUuid('workspace_id')->nullable()->constrained('workspaces')->cascadeOnDelete();
            } else {
                $table->uuid('workspace_id')->nullable()->change();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'workspace_id')) {
                $table->dropForeign(['workspace_id']);
                $table->dropColumn('workspace_id');
            }
        });
    }
};
