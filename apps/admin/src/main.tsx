import { App as AntApp, ConfigProvider } from 'antd';
import { createRoot } from 'react-dom/client';
import App from './App';
import { apiBaseUrl } from './config';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Admin root element is missing');
}

createRoot(rootElement).render(
  <ConfigProvider>
    <AntApp><App apiBaseUrl={apiBaseUrl} /></AntApp>
  </ConfigProvider>,
);
