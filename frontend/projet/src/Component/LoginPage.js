import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

const allowedUsers = [
  "Boutaina", "Tariq", "Zakaria", "Mustafa", "Sanaa", "Salim", "Fatima"
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    if (!allowedUsers.includes(username)) {
      alert("❌ Utilisateur non autorisé");
      return;
    }

    sessionStorage.setItem("authenticated", "true");
    sessionStorage.setItem("username", username);

    navigate("/tickets");
  };

  return (
    <div className="login-container">
      
      <div className="login-box">
        <h2>🔑 Connexion</h2>
        <form onSubmit={handleLogin}>
          <div className="field-group">
            <label>Nom d'utilisateur :</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="field-group">
            <label>Mot de passe :</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Se connecter</button>
        </form>
      </div>
    </div>
  );
}