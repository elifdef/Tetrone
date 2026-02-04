import { useContext } from "react";
import { Toaster } from "react-hot-toast";
import { AuthContext } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";

function App() {
  const { loading } = useContext(AuthContext);

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
        Завантаження...
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