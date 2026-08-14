<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_email_unique');
        });

        DB::statement('ALTER TABLE users ADD COLUMN active_email VARCHAR(255) GENERATED ALWAYS AS (IF(deleted_at IS NULL, email, NULL)) STORED');
        DB::statement('CREATE UNIQUE INDEX users_active_email_unique ON users (active_email)');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement('ALTER TABLE users DROP INDEX users_active_email_unique');
        DB::statement('ALTER TABLE users DROP COLUMN active_email');

        Schema::table('users', function (Blueprint $table) {
            $table->unique('email');
        });
    }
};
