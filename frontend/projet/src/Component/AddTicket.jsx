import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./TicketApp.css";

export default function AddTicket() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    ID_TICKET: "",
    NOM_UTILISATEUR: "",
    CATEGORIE: "",
    TYPE_TICKET: "",
    DESCRIPTIONS: "",
    EQUIPE_ASSIGNEE: "IT OSS",
    PRIORITE: "P3",
  });
  const [categories, setCategories] = useState([]);

 useEffect(() => {
  fetchCategories();
}, []);

  const fetchCategories = async () => {
  try {
    const res = await axios.get("http://localhost:5000/categories");
    const uniques = Array.from(
      new Set(res.data.map((cat) => cat.CategoryName))
    ).map((name) => res.data.find((cat) => cat.CategoryName === name));
    setCategories(uniques);
  } catch (err) {
    console.error("Erreur chargement catégories :", err);
  }
};
  const generateTicketID = async (type) => {
    try {
      const res = await axios.get(`http://localhost:5000/tickets/next-id/${type}`);
      setForm((prev) => ({ ...prev, ID_TICKET: res.data.nextId }));
    } catch (err) {
      console.error("Erreur génération ID :", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "TYPE_TICKET") {
      const prefix = value.toLowerCase() === "demande" ? "DMD" : "INC";
      generateTicketID(prefix);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/tickets", {
        TicketID: form.ID_TICKET,
        nameUser: form.NOM_UTILISATEUR,
        CategoryName: form.CATEGORIE,
        Description: form.DESCRIPTIONS,
        team: form.EQUIPE_ASSIGNEE,
        Priority: form.PRIORITE,
      });
      alert("✅ Ticket ajouté !");
      setForm({
        ID_TICKET: "",
        NOM_UTILISATEUR: "",
        CATEGORIE: "",
        TYPE_TICKET: "",
        DESCRIPTIONS: "",
        EQUIPE_ASSIGNEE: "IT OSS",
        PRIORITE: "P1",
      });
      navigate("/login");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'ajout du ticket !");
    }
  };

 return (
  <div className="ticket-app">
    <h2>🎫 Créer un nouveau ticket</h2>
    <form onSubmit={handleSubmit} className="ticket-form">
      <select name="TYPE_TICKET" value={form.TYPE_TICKET} onChange={handleChange} required>
        <option value="">-- Type de ticket --</option>
        <option value="demande">Demande</option>
        <option value="incident">Incident</option>
      </select>

      <input name="ID_TICKET" value={form.ID_TICKET} readOnly placeholder="ID Ticket" />

      <input
        name="NOM_UTILISATEUR"
        placeholder="Nom Utilisateur"
        value={form.NOM_UTILISATEUR}
        onChange={handleChange}
        required
      />

      <select name="CATEGORIE" value={form.CATEGORIE} onChange={handleChange} required>
        <option value="">-- Catégorie --</option>
        {categories.map((cat) => (
          <option key={cat.CategoryID} value={cat.CategoryName}>
            {cat.CategoryName}
          </option>
        ))}
      </select>

      <input
        name="DESCRIPTIONS"
        placeholder="Description"
        value={form.DESCRIPTIONS}
        onChange={handleChange}
        required
      />

      <select name="PRIORITE" value={form.PRIORITE} onChange={handleChange}>
        <option value="P1">P1 (Haute)</option>
        <option value="P2">P2 (Moyenne)</option>
        <option value="P3">P3 (Basse)</option>
      </select>

      <input name="EQUIPE_ASSIGNEE" value="IT OSS" readOnly />

      <button type="submit" disabled={!form.ID_TICKET}>➕ Ajouter Ticket</button>
    </form>
  </div>
);
}