import { createRoot } from 'react-dom/client';
import { App as AntApp } from 'antd';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <AntApp>
    <App />
  </AntApp>
);
