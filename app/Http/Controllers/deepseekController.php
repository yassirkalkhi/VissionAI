<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Conversation;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class DeepSeekController extends Controller
{
    public function callDeepseek(Request $request, callable $onChunk, callable $onComplete)
    {
        set_time_limit(1000);

        $extractedText = $request->extracted_text ?? '';
        $hasExtractedText = !empty($extractedText);
        $userMessage = $request->message ?? 'Please analyze this document';

        $systemPrompt = $hasExtractedText
            ? "You ARE VisionAI Assistant that can help generate responses, The user may have uploaded an images, and the text has been extracted from it. The extracted text is provided in a separate message. If the user asks about the text in the image, refer to the extracted text in your response."
            : "You ARE VisionAI Assistant that can help generate responses.";

        $messages = [
            [
                'role' => 'system',
                'content' => $systemPrompt
            ]
        ];

        if ($request->has('conversation_id')) {
            $conversation = Conversation::find($request->conversation_id);
            if ($conversation) {
                $historyMessages = $conversation->messages()
                    ->orderBy('created_at')
                    ->get();

                foreach ($historyMessages as $historyMessage) {
                    $messageContent = $historyMessage->content;

                    if ($historyMessage->role === 'user' && !empty($historyMessage->extracted_text)) {
                        $messages[] = [
                            "role" => "user",
                            "content" => $messageContent
                        ];

                        $messages[] = [
                            "role" => "user",
                            "content" => "Here is the text extracted from the image:\n" . $historyMessage->extracted_text
                        ];
                    } else {
                        $messages[] = [
                            "role" => $historyMessage->role,
                            "content" => $messageContent
                        ];
                    }
                }
            }
        }

        // Add the current user message
        $messages[] = [
            'role' => 'user',
            'content' => $userMessage
        ];

        // Add extracted text if present
        if ($hasExtractedText) {
            $messages[] = [
                'role' => 'user',
                'content' => "Here is the text extracted from the images:\n" . $extractedText
            ];
        }

        try {
            // Make the API call
            $response = Http::timeout(600)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . env('DEEPSEEK_API_KEY'),
                    'Content-Type' => 'application/json',
                    'Accept' => 'text/event-stream'
                ])
                ->withOptions(['stream' => true])
                ->post(env('DEEPSEEK_API_URL'), [
                    'model' => 'deepseek-chat',
                    'messages' => $messages,
                    'temperature' => 0.7,
                    'max_tokens' => 2000,
                    'stream' => true,
                ]);

            // Check if the API call was successful
            if (!$response->successful()) {
                Log::error('API request failed', [
                    'status' => $response->status()
                ]);
                throw new \Exception('API request failed: ' . $response->status());
            }

            // Get the response body
            $body = $response->toPsrResponse()->getBody();
            $contentBuffer = '';
            $buffer = '';

            // Process streaming response
            while (!$body->eof()) {
                try {
                    // Read a chunk of data
                    $chunk = $body->read(1024);
                    if (empty($chunk)) {
                        continue;
                    }
                    $buffer .= $chunk;

                    // Process complete events in the buffer
                    while (($pos = strpos($buffer, "\n\n")) !== false) {
                        $event = substr($buffer, 0, $pos);
                        $buffer = substr($buffer, $pos + 2);

                        // Process data events
                        if (strpos($event, 'data: ') === 0) {
                            $jsonData = trim(substr($event, 6));

                            if ($jsonData === '[DONE]') {
                                break;
                            }

                            try {
                                // Parse the JSON data
                                $data = json_decode($jsonData, true);
                                if (json_last_error() !== JSON_ERROR_NONE) {
                                    Log::warning('Invalid JSON in stream', ['data' => $jsonData]);
                                    continue;
                                }

                                // Handle content chunks
                                if (isset($data['choices'][0]['delta']['content'])) {
                                    $contentChunk = $data['choices'][0]['delta']['content'];
                                    if (!empty($contentChunk)) {
                                        $contentBuffer .= $contentChunk;
                                        $onChunk($contentChunk);
                                    }
                                }
                            } catch (\Exception $e) {
                                Log::error('Error processing chunk data', [
                                    'error' => $e->getMessage(),
                                    'data' => $jsonData
                                ]);
                                continue;
                            }
                        }
                    }
                } catch (\Exception $e) {
                    Log::error('Error reading from stream', ['error' => $e->getMessage()]);
                    break;
                }
            }

            // Return the content
            if (!empty($contentBuffer)) {
                $onComplete($contentBuffer);
                return $contentBuffer;
            }

            $defaultMessage = "I apologize, but I couldn't process your request. Please try again with a different wording.";
            $onComplete($defaultMessage);
            return $defaultMessage;

        } catch (\Exception $e) {
            Log::error('Error in callDeepseek', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            $errorMessage = "I apologize, but there was an error processing your request. Please try again.";
            $onComplete($errorMessage);
            return $errorMessage;
        }
    }
}