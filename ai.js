document.getElementById('start-btn').addEventListener('click', async () => {
  const responseContainer = document.getElementById('response');
  const recognition = new webkitSpeechRecognition();
  
  // Set the default language; you can also allow users to select this.
  recognition.lang = 'en-US'; // Default language
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
      addMessage('system', 'Please start speaking.');
  };

  recognition.onspeechend = () => {
      setTimeout(() => {
          recognition.stop();
      }, 4000); // stops recognition after 4 seconds of silence
  };

  recognition.onresult = async (event) => {
      const userQuery = event.results[0][0].transcript;
      const detectedLanguage = detectLanguage(userQuery); // Detect the language of userQuery
      addMessage('user', userQuery);
      try {
          const aiResponse = await getResponseFromAPI(userQuery, detectedLanguage); // Pass detected language
          addMessage('ai', aiResponse);
          speakText(aiResponse, detectedLanguage); // Pass detected language for TTS
      } catch (error) {
          addMessage('error', 'Error fetching API response: ' + error.message);
      }
  };

  recognition.onerror = (event) => {
      addMessage('error', 'Error occurred in recognition: ' + event.error);
  };

  recognition.onend = () => {
      addMessage('system', 'Please wait for response.');
  };

  recognition.start();
});

async function getResponseFromAPI(userQuery, language) {
  const response = await fetch('https://jamsapi.hackclub.dev/openai/chat/completions', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer A2FLLX4NGG1JEEAHH9JCEM9RD4Z1U1L1U5X28YC2RG16PO8TEZDLTEYBDUIQMDW4'
      },
      body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: `Provide a brief and concise answer in ${language}: ${userQuery}` }],
          max_tokens: 100
      })
  });

  const data = await response.json();
  if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content.trim();
  } else {
      throw new Error('Unexpected API response structure');
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

// Function to detect language from the input (implement your own logic)
function detectLanguage(text) {
  // Placeholder for language detection logic. For example, you can use 'franc-min' here.
  const franc = require('franc-min'); // Ensure you have installed franc-min
  const langCode = franc(text);
  return langCode === 'und' ? 'en' : langCode; // Default to 'en' if undetermined
}

function speakText(text, language) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language; // Set the language for the speech synthesis
  window.speechSynthesis.speak(utterance);
}
