import React, { useState, useEffect } from 'react';
import './ConfigApp.css'; // Make sure the CSS file is in the same directory

const ConfigApp = () => {
  const [url, setUrl] = useState('');
  const [buttonColor, setButtonColor] = useState('#ffffff');
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  // Function to update the configuration state
  const updateConfigState = (configData) => {
    if (configData) {
      try {
        const config = JSON.parse(configData);
        setUrl(config.url || '');
        setButtonColor(config.buttonColor || '#ffffff');
      } catch (e) {
        console.error('Could not parse configuration:', e);
      }
    }
  };

  useEffect(() => {
    window.Twitch.ext.configuration.onChanged(() => {
      // Check if a broadcaster configuration is available
      if (window.Twitch.ext.configuration.broadcaster) {
        updateConfigState(window.Twitch.ext.configuration.broadcaster.content);
      }
    });
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    // Save the new configuration
    window.Twitch.ext.configuration.set('broadcaster', '1', JSON.stringify({
      url: url,
      buttonColor: buttonColor,
    }));

    // Set and display the confirmation message
    setMessage('Configuration saved successfully!');
    setShowMessage(true);

    // Hide the message after a delay
    setTimeout(() => {
      setShowMessage(false);
    }, 5000); // Message will be hidden after 5 seconds
  };

  return (
    <div className="container">
      <h1 className="header">Broadcaster Configuration</h1>
      {showMessage && <div className="message">{message}</div>}
      <form onSubmit={handleSubmit} className="form">
        <div className="inputGroup">
          <label htmlFor="url" className="label">URL:</label>
          <input
            type="text"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter the URL"
            className="input"
          />
        </div>
        <div className="inputGroup">
          <label htmlFor="buttonColor" className="label">Button Color:</label>
          <input
            type="color"
            id="buttonColor"
            value={buttonColor}
            onChange={(e) => setButtonColor(e.target.value)}
            className="colorPicker"
          />
        </div>
        <div className="inputGroup">
          <button type="submit" className="submitButton">Submit</button>
        </div>
      </form>
    </div>
  );
};

export default ConfigApp;