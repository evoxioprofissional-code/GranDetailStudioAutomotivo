import React from 'react';
import { createRoot } from 'react-dom/client';
import Workspace from './Workspace';
import './styles.css';
import './responsive.css';
import './auth.css';
import './operations.css';
import './dashboard.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Workspace />
  </React.StrictMode>,
);
