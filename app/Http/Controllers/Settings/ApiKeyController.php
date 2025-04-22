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
    /**
     * Display the API keys management view.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('settings/api', [
            'apiKeys' => $request->user()->apiKeys,
            'newApiKey' => session('newApiKey'),
        ]);
    }

    /**
     * Store a newly created API key in storage.
     */
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

    /**
     * Remove the specified API key from storage.
     */
    public function destroy(Request $request, ApiKey $apiKey): RedirectResponse
    {
        if ($request->user()->id !== $apiKey->user_id) {
            abort(403);
        }

        $apiKey->delete();

        return Redirect::route('api-keys.index');
    }
} 