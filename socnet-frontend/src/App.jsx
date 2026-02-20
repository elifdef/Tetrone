import { useContext, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { AuthContext } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import { useTranslation } from "react-i18next";
import ErrorState from "./components/common/ErrorState";

function App() {
  const { loading, initError } = useContext(AuthContext);
  const { t } = useTranslation();

  useEffect(() => {
    const isDark = localStorage.getItem('dark_theme');
    if (isDark === 'false')
      document.body.setAttribute('data-theme', 'light');
    else
      document.body.removeAttribute('data-theme');

    if (isDark === null)
      localStorage.setItem('dark_theme', 'true');
  }, []);

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#19191a',
        color: '#e1e3e6'
      }}>
        <title>{t('common.loading')}</title>
        {t('common.loading')}
      </div>
    );
  }

  if (initError) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <title>{t('error.connection')}</title>
        <ErrorState
          title={t('error.server_down')}
          description={t('error.server_down_desc')}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="bottom-left"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
      <AppRoutes />
    </>
  );
}

export default App;