<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained()->onDelete('cascade');
            $table->text('question_text');
            $table->string('question_type')->default('multiple_choice'); // multiple_choice, true_false, short_answer, etc.
            $table->json('options')->nullable(); // For multiple choice options
            $table->text('correct_answer');
            $table->text('explanation')->nullable();
            $table->integer('order')->default(0);
            $table->json('settings')->nullable(); // For additional question settings
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
}; 