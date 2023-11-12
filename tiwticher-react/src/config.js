import React from 'react';
import ReactDOM from 'react-dom';
import './config.css'; // Style for config page if needed
import ConfigApp from './ConfigApp'; // Your config component

ReactDOM.render(
  <React.StrictMode>
    <ConfigApp />
  </React.StrictMode>,
  document.getElementById('root')
);
