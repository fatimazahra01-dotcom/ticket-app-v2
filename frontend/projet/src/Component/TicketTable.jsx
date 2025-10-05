import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import "./TicketApp.css";

export default function TicketTable() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [note, setNote] = useState({});
  const [editedTickets, setEditedTickets] = useState({});
  const [categories, setCategories] = useState([]);
  const username = sessionStorage.getItem("username");
  const intervalIdRef = useRef(null);

  useEffect(() => {
    const isAuth = sessionStorage.getItem("authenticated");
    if (!isAuth) navigate("/login");
    fetchTickets();
    fetchCategories();
  }, [navigate]);

  const fetchTickets = async () => {
    try {
      const res = await axios.get("http://localhost:5000/tickets");
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    }
  };
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

  const handleResolve = async (id) => {
    if (!note[id]) return alert("Veuillez ajouter une note.");
    const updates = editedTickets[id] || {};
    try {
      const res = await axios.put(`http://localhost:5000/tickets/${id}/resolve`, {
        note: note[id],
        resolvedBy: username,
        ...updates,
      });
      const updatedTicket = res.data.ticket;
      setTickets((prev) =>
        prev.map((t) => (t.TicketID === updatedTicket.TicketID ? updatedTicket : t))
      );
      setNote((prev) => ({ ...prev, [id]: "" }));
      setEditedTickets((prev) => ({ ...prev, [id]: undefined }));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la résolution.");
    }
  };

  const handleSave = async (id) => {
    const updates = editedTickets[id];
    if (!updates || Object.keys(updates).length === 0) {
      return alert("Aucune modification détectée.");
    }
    try {
      const res = await axios.put(`http://localhost:5000/tickets/${id}`, updates);
      const updatedTicket = res.data.ticket;
      setTickets((prev) =>
        prev.map((t) => (t.TicketID === updatedTicket.TicketID ? updatedTicket : t))
      );
      setEditedTickets((prev) => {
        const newEdited = { ...prev };
        delete newEdited[id];
        return newEdited;
      });
      alert("Ticket sauvegardé !");
    } catch (err) {
      console.error("Erreur de mise à jour :", err);
      alert("Échec de la mise à jour.");
    }
  };

  const exportToExcel = () => {
    const data = tickets.map((t) => ({
      ID: t.TicketID,
      Nom: t.nameUser,
      Description: t.Description,
      Priorité: t.Priority,
      Équipe: t.team,
      Catégorie: t.CategoryName,
      Statut: t.Status,
      "Ouvert le": t.CreatedAt ? new Date(t.CreatedAt).toLocaleString() : "-",
      "Fermé le": t.ResolvedAt ? new Date(t.ResolvedAt).toLocaleString() : "-",
      "Temps de résolution": t.ResolutionTime || "-",
      Note: t.Status === "Fermé" ? t.ResolutionNote || "-" : note[t.TicketID] || "",
      "Résolu par": t.ResolvedBy || "-",
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");
    XLSX.writeFile(workbook, "tickets.xlsx");
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const timeout = nextMidnight - now;

    const deleteAndRefresh = async () => {
      try {
        await axios.delete("http://localhost:5000/tickets/delete-closed");
        fetchTickets();
      } catch (err) {
        console.error("Erreur lors de la suppression des tickets fermés :", err);
      }
    };

    const timeoutId = setTimeout(() => {
      deleteAndRefresh();
      intervalIdRef.current = setInterval(deleteAndRefresh, 24 * 60 * 60 * 1000);
    }, timeout);

    return () => {
      clearTimeout(timeoutId);
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, []);




  

  return (
    <div className="ticket-app">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2>📋 Liste des Tickets</h2>
        <div>
          <button onClick={exportToExcel}> Exporter Excel</button>
          <button onClick={handleLogout}> Déconnexion</button>
          <button
            onClick={() => {
              window.open(
               "https://app.powerbi.com/groups/me/reports/fa144208-04de-4019-83de-d74715201b08/7d9ec014d394556d052b?experience=power-bi"
              );
            }}
            className="BI"
          >
             View in Power BI
          </button>
        </div>
      </div>
      <table className="ticket-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Description</th>
            <th>Priorité</th>
            <th>Équipe</th>
            <th>Catégorie</th>
            <th>Statut</th>
            <th>Ouvert le</th>
            <th>Fermé le</th>
            <th>Temps</th>
            <th>Note</th>
            <th>Résolu par</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => {
            const edited = editedTickets[t.TicketID] || {};
            return (
              <tr key={t.TicketID}>
                <td>{t.TicketID}</td>
                <td>{t.nameUser}</td>
                <td>
                  <input
                    type="text"
                    value={edited.Description ?? t.Description}
                    onChange={(e) =>
                      setEditedTickets((prev) => ({
                        ...prev,
                        [t.TicketID]: {
                          ...(prev[t.TicketID] || {}),
                          Description: e.target.value,
                        },
                      }))
                    }
                  />
                </td>
                <td>
                  <select
                    value={edited.Priority ?? t.Priority}
                    onChange={(e) =>
                      setEditedTickets((prev) => ({
                        ...prev,
                        [t.TicketID]: {
                          ...(prev[t.TicketID] || {}),
                          Priority: e.target.value,
                        },
                      }))
                    }
                  >
                    <option value="P1">P1</option>
                    <option value="P2">P2</option>
                    <option value="P3">P3</option>
                  </select>
                </td>
                <td>{t.team}</td>
                <td>
                  <select
                    value={edited.CategoryName ?? t.CategoryName}
                    onChange={(e) =>
                      setEditedTickets((prev) => ({
                        ...prev,
                        [t.TicketID]: {
                          ...(prev[t.TicketID] || {}),
                          CategoryName: e.target.value,
                        },
                      }))
                    }
                  >

                    
                    <option value="">-- Choisir --</option>
                    {categories.map((cat) => (
                      <option key={cat.CategoryID} value={cat.CategoryName}>
                        {cat.CategoryName}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{t.Status}</td>
                <td>{t.CreatedAt ? new Date(t.CreatedAt).toLocaleString() : "-"}</td>
                <td>{t.ResolvedAt ? new Date(t.ResolvedAt).toLocaleString() : "-"}</td>
                <td>{t.ResolutionTime || "-"}</td>
                <td>
                  {t.Status === "Ouvert" ? (
                    <textarea
                      value={note[t.TicketID] || ""}
                      onChange={(e) =>
                        setNote((prev) => ({ ...prev, [t.TicketID]: e.target.value }))
                      }
                    />
                  ) : (
                    <em>{t.ResolutionNote || "-"}</em>
                  )}
                </td>
                <td>{t.ResolvedBy || "-"}</td>
                <td>
                  <button onClick={() => handleSave(t.TicketID)}> Sauvegarder</button>
                  {t.Status === "Ouvert" && (
                    <button onClick={() => handleResolve(t.TicketID)}> Résoudre</button>
                  )}
                </td>
                 </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
