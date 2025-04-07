<!-- Blade View (chat.blade.php) -->
<!DOCTYPE html>
<html>
<head>
    <title>Chat Stream</title>
    <style>
        #chat-container { max-width: 800px; margin: 0 auto; }
        #response { border: 1px solid #ccc; padding: 20px; min-height: 200px; margin: 20px 0; }
    </style>
</head>
<body>
    <div id="chat-container">
        <form id="chat-form">
            <input type="text" id="message" name="message" placeholder="Type your message" style="width: 80%">
            <button type="submit">Send</button>
        </form>
        <div id="response"></div>
    </div>

    <script>
        const responseDiv = document.getElementById('response');
        const form = document.getElementById('chat-form');

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            responseDiv.innerHTML = '';
            
            const eventSource = new EventSource(`/stream-chat?message=${encodeURIComponent(document.getElementById('message').value)}`);
            
            eventSource.onmessage = function(e) {
                const data = JSON.parse(e.data);
                responseDiv.innerHTML += data.content;
                responseDiv.scrollTop = responseDiv.scrollHeight;
            };

            eventSource.onerror = function() {
                eventSource.close();
            };
        });
    </script>
</body>
</html>