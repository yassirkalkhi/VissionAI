<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\ApiKey;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ApiKeyController extends Controller
{
   
    public function index(Request $request): Response
    {
        return Inertia::render('settings/api', [
            'apiKeys' => $request->user()->apiKeys,
            'newApiKey' => session('newApiKey'),
        ]);
    }

    
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $plainTextKey = ApiKey::generateKey();
        
        $request->user()->apiKeys()->create([
            'name' => $request->name,
            'key' => Hash::make($plainTextKey),
        ]);

        return Redirect::route('api-keys.index')->with('newApiKey', $plainTextKey);
    }

    
    public function destroy(Request $request, ApiKey $apiKey): RedirectResponse
    {
        if ($request->user()->id !== $apiKey->user_id) {
            abort(403);
        }

        $apiKey->delete();

        return Redirect::route('api-keys.index');
    }
} 