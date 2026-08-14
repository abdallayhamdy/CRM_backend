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
       Schema::create('user_view_preferences', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
    $table->string('object_type'); // 'contacts', 'deals', 'companies'
    $table->json('visible_columns')->nullable();
    $table->json('column_order')->nullable();
    $table->timestamps();

    $table->unique(['user_id', 'object_type']); // ✅ كل يوزر له إعداد واحد لكل object
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_view_preferences');
    }
};
