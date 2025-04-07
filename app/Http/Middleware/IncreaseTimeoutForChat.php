<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class IncreaseTimeoutForChat
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Increase PHP execution time limit for chat routes
        set_time_limit(1000); // 2 minutes
        
        // Increase memory limit if needed
        ini_set('memory_limit', '256M');
        
        return $next($request);
    }
}

