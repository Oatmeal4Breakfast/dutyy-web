import { useState } from "react";
import type { UserSummary } from "./api/types.ts";
import LoginForm from "./components/LoginForm.tsx";
import "./App.css";

function App() {
  const [user, setUser] = useState<UserSummary | null>(null);

  if (!user) {
    return <LoginForm onLogin={setUser} />;
  } else {
    return <p>Welcolme {user.first_name}</p>;
  }
}

export default App;
