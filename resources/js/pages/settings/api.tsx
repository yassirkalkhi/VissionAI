import { type BreadcrumbItem, type SharedData } from '@/types/index';
import { Transition } from '@headlessui/react';
import { Head, useForm, usePage ,router} from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CopyIcon, EyeIcon, EyeOffIcon, KeyIcon, RefreshCwIcon, TrashIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'API settings',
        href: '/settings/api',
    },
];

type ApiKeyForm = {
    name: string;
}

type ApiKey = {
    id: string;
    name: string;
    created_at: string;
    last_used_at: string | null;
}

export default function ApiSettings() {
    const { auth, apiKeys, newApiKey } = usePage<SharedData & { 
        apiKeys: ApiKey[], 
        newApiKey: string | null 
    }>().props;

    const [showApiKey, setShowApiKey] = useState(true);
    const [copied, setCopied] = useState(false);

    const { data, setData, post, errors, processing, recentlySuccessful, reset } = useForm<Required<ApiKeyForm>>({
        name: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('api-keys.store'), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const deleteApiKey = (id: string) => {
        if (confirm('Are you sure you want to delete this API key?')) {
            router.delete(route('api-keys.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="API settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="API Keys" description="Manage your API keys for accessing the quiz API" />

                    {newApiKey && (
                        <Alert className="mb-6  ">
                            <AlertDescription className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold  text-black dark:text-white/80">Your new API key</span>
                                    
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => setShowApiKey(!showApiKey)}
                                        >
                                            {showApiKey ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => copyToClipboard(newApiKey)}
                                        >
                                            <CopyIcon size={16} />
                                            {copied ? "Copied!" : "Copy"}
                                        </Button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <pre className="p-2 bg-accent rounded text-sm">
                                        {showApiKey ? newApiKey : newApiKey.replace(/./g, '•')}
                                    </pre>
                                </div>
                                <p className="text-sm text-red-400 dark:text-red-400 ">
                                    Make sure to copy this key now. You won't be able to see it again!
                                </p>
                            </AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name">API Key Name</Label>
                            <Input
                                id="name"
                                className="mt-1 block w-full"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                placeholder="e.g. Production Key"
                            />
                            <InputError className="mt-2" message={errors.name} />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>
                                <KeyIcon size={16} className="mr-2" />
                                Generate API Key
                            </Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">Key Generated</p>
                            </Transition>
                        </div>
                    </form>

                    {apiKeys && apiKeys.length > 0 && (
                        <Card className="mt-8">
                            <CardHeader>
                                <CardTitle>Your API Keys</CardTitle>
                                <CardDescription>Manage your existing API keys</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {apiKeys.map((key : any) => (
                                        <div key={key.id} className="flex items-center justify-between p-3 border rounded-md ">
                                            <div>
                                                <div className="font-medium">{key.name}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    Created: {new Date(key.created_at).toLocaleDateString()}
                                                    {key.last_used_at && (
                                                        <> • Last used: {new Date(key.last_used_at).toLocaleDateString()}</>
                                                    )}
                                                </div>
                                            </div>
                                            <Button 
                                                variant="destructive" 
                                                size="sm" 
                                                onClick={() => deleteApiKey(key.id)}
                                            >
                                                <TrashIcon size={16} />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>API Documentation</CardTitle>
                            <CardDescription>Learn how to interact with the Quiz API</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="authentication">
                                <TabsList className="mb-6">
                                    <TabsTrigger value="authentication">Authentication</TabsTrigger>
                                    <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                                    <TabsTrigger value="examples">Examples</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="authentication" className="space-y-4">
                                    <h3 className="text-lg font-semibold">Authentication</h3>
                                    <p>To authenticate with the API, include your API key in the request headers:</p>
                                    <pre className="p-3 bg-gray-100 dark:bg-accent rounded-md overflow-x-auto whitespace-pre-wrap">
{`// Include this header in all API requests
X-API-Key: your_api_key_here`}
                                    </pre>
                                    <Alert className="mt-4">
                                        <AlertDescription>
                                            Keep your API key secure. Don't expose it in client-side code.
                                        </AlertDescription>
                                    </Alert>
                                </TabsContent>
                                
                                <TabsContent value="endpoints" className="space-y-4">
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold">List Quizzes</h3>
                                            <p className="text-sm text-white/60 mb-2">GET /api/quizzes</p>
                                            <p>Retrieves a paginated list of your quizzes.</p>
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-lg font-semibold">Get Quiz</h3>
                                            <p className="text-sm text-white/60 mb-2">GET /api/quizzes/{'{id}'}</p>
                                            <p>Retrieves a specific quiz with all questions and answers.</p>
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-lg font-semibold">Create Quiz</h3>
                                            <p className="text-sm text-white/60  mb-2">POST /api/quizzes</p>
                                            <p>Creates a new quiz with questions and answers.</p>
                                            <br />
                                            <p className="text-gray-500 dark:text-gray-200 mb-2">// Example request body</p>
                                            <pre className="p-3 bg-gray-100 dark:bg-accent text-green-600/90 rounded-md overflow-x-auto mt-2 whitespace-pre-wrap">
{`{ 
      "images" : [
        "Base64-encoded-image-string",
        "https://example.com/image.jpg"],
        "question_count" : 8,
        "difficulty" : "hard",
        "enable_timer" : 1,
        "user_message" : "quiz from that extracted text",
        "time_limit" : 100 // in seconds
                }`}
                                            </pre>
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-lg font-semibold">Update Quiz</h3>
                                            <p className="text-sm text-white/60 mb-2">PUT /api/quizzes/{'{id}'}</p>
                                            <p className="text-gray-500 dark:text-gray-200 mb-2">// Example request body</p>
                                            <pre className="p-3 bg-gray-100 dark:bg-accent text-green-600/90 rounded-md overflow-x-auto mt-2 whitespace-pre-wrap">
{`{
    "title": "New Quiz Title",
    "description": "Updated description",
    "difficulty": "easy",
    "settings": {
        "layout": "ltr",
        "language": "en",
        "time_limit": 900,
        "enable_timer": true,
        "question_count": "15"
    }
} 
`}
                                            </pre>
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-lg font-semibold">Delete Quiz</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">DELETE /api/quizzes/{'{id}'}</p>
                                            <p>Deletes a quiz and all associated questions and answers.</p>
                                        </div>
                                    </div>
                                </TabsContent>
                                
                                <TabsContent value="examples" className="space-y-4">
                                    <h3 className="text-lg font-semibold">API Usage Examples</h3>
                                    
                                    <div className="space-y-2">
                                        <h4 className="font-medium">cURL Example (Create Quiz)</h4>
                                        <pre className="p-3 bg-gray-100 dark:bg-black  rounded-md overflow-x-auto whitespace-pre-wrap">
{`curl -X POST \\
  https://quizzy.aidweb.ma/api/quizzes \\
  -H 'Content-Type: application/json' \\
  -H 'X-API-Key: your_api_key_here' \\
  -d '  "images" : ["data:image/png;base64,iV....",
        "https://commons.wikimedia.org/wiki/media.jpg"],
        "question_count" : 8,
        "difficulty" : "hard",
        "enable_timer" : 1,
        "user_message" : "quiz from that extracted text",
        "time_limit" : 120 // 2 minutes'`}
                                        </pre>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <h4 className="font-medium">JavaScript (Fetch API) Example</h4>
                                        <pre className="p-3 bg-gray-100 dark:bg-accent text-green-600/80 rounded-md overflow-x-auto whitespace-pre-wrap">
{`// Get all quizzes
fetch('https://yourdomain.com/api/quizzes', {
  method: 'GET',
  headers: {
    'X-API-Key': 'your_api_key_here',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`}
                                        </pre>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
} 



