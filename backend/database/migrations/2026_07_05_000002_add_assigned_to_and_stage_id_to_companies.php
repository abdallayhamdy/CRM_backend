<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->foreignUuid('assigned_to')->nullable()->constrained('users')->nullOnDelete()->after('industry');
            $table->foreignUuid('stage_id')->nullable()->constrained('stages')->nullOnDelete()->after('assigned_to');
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropConstrainedForeignId('stage_id');
            $table->dropConstrainedForeignId('assigned_to');
        });
    }
};
