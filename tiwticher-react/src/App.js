import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';

function Popup({ message, onRemove }) {
  const handleAnimationEnd = () => {
    onRemove();  // Call onRemove when the animation ends
  };

  return (
    <div className="popup" onAnimationEnd={handleAnimationEnd}>
      {message}
    </div>
  );
}

function App() {
  const [buttons, setButtons] = useState([]);
  const [serverResponses, setServerResponses] = useState([]);
  const [userName, setUserName] = useState('Anonymous');

  const fetchButtons = async () => {
    try {
      const response = await axios.get('https://opentun.nl/buttons');
      setButtons(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const getUserInfo = async (clientId, helixToken, userId) => {
    try {
      const response = await axios.get(`https://api.twitch.tv/helix/users?id=${userId}`, {
        headers: {
          'Client-ID': clientId,
          'Authorization': `Extension ${helixToken}`,
        },
      });
      setUserName(response.data.data[0].display_name);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchButtons();
    const intervalId = setInterval(fetchButtons, 5000);

    if (window.Twitch && window.Twitch.ext) {
      window.Twitch.ext.onAuthorized(auth => {
        const userId = window.Twitch.ext.viewer.id;
        getUserInfo(auth.clientId, auth.helixToken, userId);
      });
    }

    window.debugAction = debugAction;

    return () => {
      clearInterval(intervalId);
      delete window.debugAction;
    };
  }, []);

  const sendPostRequest = async (buttonName) => {
    try {
      const response = await axios.post('https://opentun.nl/hello', {
        button: buttonName,
        user: userName
      });
      setServerResponses(prevResponses => [...prevResponses, response.data.message]);  // Add new message to array
    } catch (error) {
      console.error(error);
    }
  };

  const debugAction = (buttonName) => {
    console.log('Debug action triggered by:', buttonName);
    sendPostRequest(buttonName);
  };

  const removeResponse = useCallback((messageToRemove) => {
    setServerResponses(prevResponses => prevResponses.filter(message => message !== messageToRemove));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <div className="button-container">
          {buttons.map((buttonName) => (
            <button
              key={buttonName}
              className="button"
              onClick={() => sendPostRequest(buttonName)}
            >
              {buttonName}
            </button>
          ))}
          <div style={{ height: '30px' }}></div>
        </div>
        {serverResponses.map((message, index) => (
          <Popup
            key={`${message}-${index}`}  // Create a more unique key
            message={message}
            onRemove={() => removeResponse(message)}  // Pass removeResponse as onRemove prop
          />
        ))}
      </header>
    </div>
  );
}

export default App;
