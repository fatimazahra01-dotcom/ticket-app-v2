import React from "react";
import { BrowserRouter as Router, Routes, Route, Link,Navigate } from "react-router-dom";
import LoginPage from "./Component/LoginPage"; 
import "./App.css";
import AddTicket from "./Component/AddTicket";
import TicketTable from "./Component/TicketTable";
import Footer from "./Component/Footer";



export default function App() {
  return (
    <Router>
      <div>
        <img
          src="vivo image.jpg"
          alt="logo"
          className="logo"
          style={{ display: "flex", justifyContent: "center", width: "20%", margin: "auto" }}
        />
      

        <nav className="navbar" style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "20px" }}>
          <Link to="/add" className="nav-link"> Ajouter un ticket</Link>
          <Link to="/dashboard" className="nav-link"> Voir les tickets</Link>
          <Link to="/login" className="nav-link"> Connexion</Link>
        </nav>

     
 <Routes>
  <Route path="/" element={<Navigate to="/add" />} />
  <Route path="/add" element={<AddTicket />} />
  <Route path="/dashboard" element={<TicketTable />} />
  <Route path="/login" element={<LoginPage />} />
</Routes>
<Footer /> 


      </div>
    </Router>
  );
}
