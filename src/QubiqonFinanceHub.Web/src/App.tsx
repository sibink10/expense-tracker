import { useState } from "react";
import { AppProvider } from "./context/AppContext";
import AuthGate from "./components/AuthGate";
import InitApiAuth from "./components/InitApiAuth";
import Login from "./components/Login";
import Routes from "./routes";
import type { AppUser } from "./types";

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);

  return (
    <>
      <InitApiAuth />
      {!user ? (
        <AuthGate
          onAuth={setUser}
          renderLogin={(onLogin) => <Login onLogin={onLogin} />}
        />
      ) : (
        <AppProvider user={user} setUser={setUser}>
          <Routes />
        </AppProvider>
      )}
    </>
  );
}
