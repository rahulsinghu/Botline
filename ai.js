document.getElementById('start-btn').addEventListener('click', async () => {
    const responseContainer = document.getElementById('response');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        addMessage('error', 'Speech recognition is not supported in this browser.');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        addMessage('system', 'Recognition started.');
        startButton.disabled = true; // Disable button when starting recognition
    };

    recognition.onspeechend = () => {
        setTimeout(() => {
            recognition.stop();
        }, 4000); // stops recognition after 4 seconds of silence
    };

    recognition.onresult = async (event) => {
        const userQuery = event.results[0][0].transcript;
        addMessage('user', userQuery);

        // Check if the query is related to consumers or rights
        if (isConsumerOrRightsRelated(userQuery)) {
            try {
                const aiResponse = await getResponseFromAPI(userQuery);
                addMessage('ai', aiResponse);
                speakText(aiResponse);
            } catch (error) {
                addMessage('error', 'Error fetching API response: ' + error.message);
            }
        } else {
            addMessage('error', 'Your query must be related to consumers or their rights.');
        }
    };

    recognition.onerror = (event) => {
        addMessage('error', 'Error occurred in recognition: ' + event.error);
    };

    recognition.onend = () => {
        addMessage('system', 'Recognition ended.');
        startButton.disabled = false; // Re-enable button when recognition ends
    };

    recognition.start();
});

// Function to check if the user query is related to consumers or rights
function isConsumerOrRightsRelated(query) {
    const keywords = ['consumer', 'rights', 'consumer rights', 'protection', 'complaint', 'service', 'product'];
    return keywords.some(keyword => query.toLowerCase().includes(keyword));
}

async function getResponseFromAPI(userQuery) {
    try {
        const response = await fetch('https://jamsapi.hackclub.dev/openai/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer A2FLLX4NGG1JEEAHH9JCEM9RD4Z1U1L1U5X28YC2RG16PO8TEZDLTEYBDUIQMDW4' // Your API key
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: `Provide a brief and concise answer: ${userQuery}` }],
                max_tokens: 100
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content.trim();
        } else {
            throw new Error('Unexpected API response structure');
        }
    } catch (error) {
        throw new Error('Network error: ' + error.message);
    }
}

function addMessage(role, message) {
    const responseContainer = document.getElementById('response');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${role}`;
    messageElement.textContent = message;
    responseContainer.appendChild(messageElement);
    responseContainer.scrollTop = responseContainer.scrollHeight;
}

function speakText(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
}
