<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pipeline_stages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pipeline_id')->constrained('pipelines')->cascadeOnDelete();
            
            $table->string('name');
            $table->integer('display_order')->default(0); // ترتيب المرحلة (1، 2، 3...)
            $table->integer('win_probability')->default(0); // نسبة احتمالية البيع (0 إلى 100)
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pipeline_stages');
    }
};