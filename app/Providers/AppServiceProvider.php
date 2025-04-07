<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */ 
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Http::macro('ollama', function () {
            return Http::baseUrl('http://localhost:11434')
                ->timeout(120)
                ->retry(3, 1000);
        });
    }
}
