<?php

namespace App\Http\Middleware;

use App\Models\ApiKey;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateWithApiKey
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $apiKey = $request->header('X-API-Key');
        
        if (!$apiKey) {
            return response()->json(['message' => 'API key is missing'], 401);
        }
        
        // Find all API keys in the database
        $keys = ApiKey::all();
        $validKey = null;
        
        // Check if the provided key matches any of the hashed keys
        foreach ($keys as $key) {
            if (Hash::check($apiKey, $key->key)) {
                $validKey = $key;
                break;
            }
        }
        
        if (!$validKey) {
            return response()->json(['message' => 'Invalid API key'], 401);
        }
        
        // Update the last used timestamp
        $validKey->update(['last_used_at' => now()]);
        
        // Set the authenticated user for this request
        $request->setUserResolver(function () use ($validKey) {
            return $validKey->user;
        });
        
        return $next($request);
    }
} 