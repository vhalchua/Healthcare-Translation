const startRecordBtn = document.getElementById('start-record-btn');
const speakBtn = document.getElementById('speak-btn');
const originalTranscript = document.getElementById('original-transcript');
const translatedTranscript = document.getElementById('translated-transcript');
const sourceLang = document.getElementById('source-language');
const targetLang = document.getElementById('target-language');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    originalTranscript.innerText = transcript;
    setTimeout(() => translateText(transcript), 1000);
  };
  
  recognition.onspeechend = () => {
    console.log("Speech ended.");
    recognition.stop();
  };

  recognition.onerror = (event) => {
    console.log("onresult event triggered");
    const transcript = event.results[0][0].transcript;
    console.log("Captured Transcript:", transcript);
    originalTranscript.innerText = transcript;
    translateText(transcript);
};
} else {
  alert("Speech recognition is not supported in this browser.");
}
sourceLang.addEventListener('change', () => {
  switch (sourceLang.value) {
    case 'fil':
      recognition.lang = 'fil-PH'; // Tagalog
      break;
    case 'hi':
      recognition.lang = 'hi-IN'; // Hindi
      break;
    case 'ja':
      recognition.lang = 'ja-JP'; // Japanese
      break;
    default:
      recognition.lang = 'en-US'; // Default to English
  }
});

startRecordBtn.addEventListener('click', () => {
  if (recognition) {
    console.log("Starting recognition...");
    recognition.start();
  } else {
    console.error("Speech recognition is not defined.");
    alert("Speech recognition is not supported in this browser.");
  }
});

async function translateText(text, retryCount = 0) {
  const maxRetries = 5;
  const delay = 2000 + Math.min(1000 * (2 ** retryCount), 16000);
  
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer YOUR_API_KEY`  // Replace with your API key
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: text }],
        max_tokens: 100,
      })
    });
  
    if (response.status === 429) {
      console.warn("Rate limit exceeded. Retrying after delay...");
      if (retryCount < maxRetries) {
        setTimeout(() => translateText(text, retryCount + 1), delay);
      } else {
        console.error("Max retry attempts reached. Please try again later.");
      }
      return;
    }
  
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from OpenAI API:', errorData);
      return;
    }
  
    const data = await response.json();
    console.log('API Response:', data);
  
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const translatedText = data.choices[0].message.content.trim();
      translatedTranscript.innerText = translatedText;
    } else {
      console.error("Unexpected API Response:", data);
    }
  
  } catch (error) {
    console.error("API Request Error:", error);
  }
}
speakBtn.addEventListener('click', () => {
  const utterance = new SpeechSynthesisUtterance(translatedTranscript.innerText);
  utterance.lang = targetLang.value;
  window.speechSynthesis.speak(utterance);
});
