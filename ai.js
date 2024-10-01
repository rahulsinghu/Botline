document.getElementById('start-btn').addEventListener('click', async () => {
  const responseContainer = document.getElementById('response');
  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
      addMessage('system', 'Recognition started.');
  };

  recognition.onspeechend = () => {
      setTimeout(() => {
          recognition.stop();
      }, 4000); // stops recognition after 4 seconds of silence
  };

  recognition.onresult = async (event) => {
      const userQuery = event.results[0][0].transcript;
      addMessage('user', userQuery);
      try {
          const aiResponse = await getResponseFromAPI(userQuery);
          addMessage('ai', aiResponse);
          speakText(aiResponse);
      } catch (error) {
          addMessage('error', 'Error fetching API response: ' + error.message);
      }
  };

  recognition.onerror = (event) => {
      addMessage('error', 'Error occurred in recognition: ' + event.error);
  };

  recognition.onend = () => {
      addMessage('system', 'Recognition ended.');
  };

  recognition.start();
});

async function getResponseFromAPI(userQuery) {
  const response = await fetch('https://jamsapi.hackclub.dev/openai/chat/completions', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer R0MVZE112IY9088KSRDV191KZDKG4FGHRB255FBOT097PW2CXJBZHGZJBRKUU2VZ'
      },
      body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: `Provide a brief and concise answer: ${userQuery}` }],
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

function speakText(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  window.speechSynthesis.speak(utterance);
}
