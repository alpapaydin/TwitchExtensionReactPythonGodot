import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';

function Popup({ message, onRemove, color }) {
  const handleAnimationEnd = () => {
    onRemove();  // Call onRemove when the animation ends
  };

  // Use the passed color for the background of the popup
  const popupStyle = {
    backgroundColor: color, // This applies the background color
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
  const [baseUrl, setBaseUrl] = useState('https://opentun.nl'); // Default URL
  const [buttonColor, setButtonColor] = useState('#FFFFFF'); // Default button color

  // Fetch buttons from the server
  const fetchButtons = async () => {
    try {
      const response = await axios.get(`${baseUrl}/buttons`);
      setButtons(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  // Get user information from Twitch API
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

  // Handle sending a post request to the server
  const sendPostRequest = async (buttonName) => {
    try {
      const response = await axios.post(`${baseUrl}/hello`, {
        button: buttonName,
        user: userName
      });
      setServerResponses(prevResponses => [...prevResponses, response.data.message]);
    } catch (error) {
      console.error(error);
    }
  };

  // Debug action for development purposes
  const debugAction = (buttonName) => {
    console.log('Debug action triggered by:', buttonName);
    sendPostRequest(buttonName);
  };

  // Remove a response from the array of server responses
  const removeResponse = useCallback((messageToRemove) => {
    setServerResponses(prevResponses => prevResponses.filter(message => message !== messageToRemove));
  }, []);

  // Effect hook to initialize and fetch data
  useEffect(() => {
    // Declare a variable for the interval ID so it can be cleared later
    let intervalId;
  
    // Listen for authorization and configuration changes from Twitch
    if (window.Twitch && window.Twitch.ext) {
      window.Twitch.ext.onAuthorized(auth => {
        const userId = auth.userId; // Corrected to auth.userId
        getUserInfo(auth.clientId, auth.token, userId); // Corrected to auth.token
      });
  
      window.Twitch.ext.configuration.onChanged(() => {
        const config = window.Twitch.ext.configuration.broadcaster || {};
        if (config.content) {
          const configData = JSON.parse(config.content);
          setBaseUrl(configData.url); // Assuming setBaseUrl is a state setter for the base URL
          setButtonColor(configData.buttonColor); // Assuming setButtonColor is a state setter for the button color
          fetchButtons(configData.url); // Call fetchButtons with the new base URL
        }
      });
    }
  
    // Set up the debug action global reference
    window.debugAction = debugAction;
  
    // Clean-up function to run when the component unmounts
    return () => {
      if (intervalId) clearInterval(intervalId);
      delete window.debugAction;
    };
  }, []);

  // Render function to output JSX
  return (
    <div className="App">
      <header className="App-header">
        <div className="button-container">
          {buttons.map((buttonName) => (
            <button
              key={buttonName}
              className="button"
              onClick={() => sendPostRequest(buttonName)}
              style={{ backgroundColor: buttonColor }} // Apply dynamic button color
            >
              {buttonName}
            </button>
          ))}
        </div>
        {serverResponses.map((message, index) => (
          <Popup
            key={`${message}-${index}`}
            message={message}
            onRemove={() => removeResponse(message)}
            color={buttonColor} // Pass button color to the Popup component
          />
        ))}
      </header>
    </div>
  );
}

export default App;