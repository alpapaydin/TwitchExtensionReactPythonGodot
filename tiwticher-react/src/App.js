import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';

function Popup({ message, onRemove, buttonColor }) {
  const handleAnimationEnd = () => {
    onRemove();  // Call onRemove when the animation ends
  };

  const popupStyle = {
    backgroundColor: buttonColor, // Set the background color dynamically
  };

  return (
    <div className="popup" onAnimationEnd={handleAnimationEnd} style={popupStyle}>
      {message}
    </div>
  );
}

function App() {
  const [buttons, setButtons] = useState([]);
  const [serverResponses, setServerResponses] = useState([]);
  const [userName, setUserName] = useState('Anonymous');
  const [configUrl, setConfigUrl] = useState('https://opentun.nl'); // Default URL
  const [buttonColor, setButtonColor] = useState('#FFFFFF'); // Default color

  const fetchButtons = async (url) => {
    try {
      const response = await axios.get(`${url}/buttons`);
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
    if (window.Twitch && window.Twitch.ext) {
      window.Twitch.ext.onAuthorized(auth => {
        const userId = window.Twitch.ext.viewer.id;
        getUserInfo(auth.clientId, auth.helixToken, userId);
      });
    }
  }, []);

  useEffect(() => {
    // This effect will run only once when the component mounts.
    if (window.Twitch && window.Twitch.ext) {
      window.Twitch.ext.onAuthorized(auth => {
        const userId = window.Twitch.ext.viewer.id;
        getUserInfo(auth.clientId, auth.helixToken, userId);
      });
  
      window.Twitch.ext.configuration.onChanged(() => {
        let config = window.Twitch.ext.configuration.broadcaster;
        if (config) {
          try {
            config = JSON.parse(config.content);
            setConfigUrl(config.url || 'https://opentun.nl'); // Fallback to default URL if not set
            setButtonColor(config.buttonColor || '#FFFFFF'); // Fallback to default color if not set
            fetchButtons(config.url || 'https://opentun.nl'); // Call fetchButtons with new URL immediately
          } catch (e) {
            console.error('Failed to parse configuration:', e);
          }
        }
      });
    }
  }, []);
  
  const sendPostRequest = async (buttonName) => {
    try {
      const response = await axios.post(`${configUrl}/hello`, { // Use dynamic URL from the state
        button: buttonName,
        user: userName
      });
      setServerResponses(prevResponses => [...prevResponses, response.data.message]); // Add new message to array
    } catch (error) {
      console.error(error);
    }
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
              style={{ backgroundColor: buttonColor }} // Set button color dynamically
            >
              {buttonName}
            </button>
          ))}
          <div style={{ height: '30px' }}></div>
        </div>
        {serverResponses.map((message, index) => (
          <Popup
            key={`${message}-${index}`} // Create a more unique key
            message={message}
            onRemove={() => removeResponse(message)} // Pass removeResponse as onRemove prop
            buttonColor={buttonColor} // Pass the dynamic button color to the Popup
          />
        ))}
      </header>
    </div>
  );
}

export default App;