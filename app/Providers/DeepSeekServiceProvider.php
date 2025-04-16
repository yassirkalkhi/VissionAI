<?php

namespace App\Providers;

use App\Http\Controllers\DeepSeekController;
use Illuminate\Support\ServiceProvider;

class DeepSeekServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(DeepSeekController::class, function ($app) {
            return new DeepSeekController();
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
} 