import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import idID from 'antd/locale/id_ID';
import { store } from './store/index.ts';
import { AppRoutes } from './routes/index.tsx';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ConfigProvider
        locale={idID}
        theme={{
          token: {
            colorPrimary: '#0d9488',
            colorInfo: '#0d9488',
            colorLink: '#0d9488',
            borderRadius: 10,
            fontFamily:
              "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            colorBgLayout: '#f4f7f6',
          },
          components: {
            Button: { fontWeight: 600, controlHeight: 40 },
            Card: { borderRadiusLG: 16 },
            Menu: { itemBorderRadius: 8, itemMarginInline: 10 },
          },
        }}
      >
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ConfigProvider>
    </Provider>
  </StrictMode>
);