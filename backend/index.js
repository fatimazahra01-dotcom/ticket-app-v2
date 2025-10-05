import express from "express";
import mysql from "mysql2";
import cors from "cors";
import cron from "node-cron";

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Casa.ma2005", 
  database: "support_tickets_db",
  port: 3306,
}); 


cron.schedule("0 0 * * *", () => {
  db.query("DELETE FROM tickets WHERE Status = 'Fermé'", (err, result) => {
    if (err) {
      console.error(" Erreur lors de la suppression automatique :", err);
    } else {
      console.log(` ${result.affectedRows} tickets fermés supprimés à minuit.`);
    }
  });
});


db.connect(err => {
  if (err) {
    console.error(" Erreur de connexion DB:", err);
    process.exit(1);
  }
  console.log(" Connecté à MySQL");
});

function formatResolutionTime(createdAt, resolvedAt) {
  if (!resolvedAt) return "-";
  const diffMs = new Date(resolvedAt) - new Date(createdAt);
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  return `${hours}h ${minutes}m ${seconds}s`;
}

app.get("/tickets/next-id/:type", (req, res) => {
  const type = (req.params.type || "").toUpperCase();
  if (!["DMD", "INC"].includes(type)) return res.status(400).json({ error: "Type invalide" });

  const query = "SELECT TicketID FROM tickets WHERE TicketID LIKE ? ORDER BY TicketID DESC LIMIT 1";
  db.query(query, [`${type}%`], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    let nextNumber = 1;
    if (results.length > 0) {
      const numericPart = parseInt(results[0].TicketID.replace(type, ""), 10);
      if (!isNaN(numericPart)) nextNumber = numericPart + 1;
    }

    const nextId = `${type}${String(nextNumber).padStart(3, "0")}`;
    res.json({ nextId });
  });
});

app.post("/tickets", (req, res) => {
  const { TicketID, nameUser, Description, Priority, team, CategoryName } = req.body;
  const sql = `INSERT INTO tickets (TicketID, nameUser, Description, Priority, team, CategoryName, Status, CreatedAt)
               VALUES (?, ?, ?, ?, ?, ?, 'Ouvert', NOW())`;
  db.query(sql, [TicketID, nameUser, Description, Priority, team, CategoryName], err => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: "Ticket ajouté", ticketID: TicketID });
  });
});

app.get("/tickets", (req, res) => {
  db.query("SELECT * FROM tickets ORDER BY CreatedAt ASC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    const tickets = results.map(t => ({
      ...t,
      ResolutionTime: t.ResolvedAt ? formatResolutionTime(t.CreatedAt, t.ResolvedAt) : "-"
    }));
    res.json(tickets);
  });
});

app.put("/tickets/:id", (req, res) => {
  const ticketId = req.params.id;
  const updates = req.body || {};
  const allowed = ["Description", "Priority", "team", "CategoryName", "nameUser"];
  const fields = [], values = [];

  allowed.forEach(k => {
    if (updates[k] !== undefined) {
      fields.push(`${k} = ?`);
      values.push(updates[k]);
    }
  });

  if (!fields.length) return res.status(400).json({ error: "Aucun champ valide" });

  const updateQuery = `UPDATE tickets SET ${fields.join(", ")} WHERE TicketID = ?`;
  values.push(ticketId);

  db.query(updateQuery, values, err => {
    if (err) return res.status(500).json({ error: err.message });

    db.query("SELECT * FROM tickets WHERE TicketID = ?", [ticketId], (err2, results) => {
      if (err2 || !results.length) return res.json({ message: "Ticket mis à jour." });
      const t = results[0];
      t.ResolutionTime = t.ResolvedAt ? formatResolutionTime(t.CreatedAt, t.ResolvedAt) : "-";
      res.json({ message: "Ticket mis à jour.", ticket: t });
    });
  });
});

app.put("/tickets/:id/resolve", (req, res) => {
  const ticketId = req.params.id;
  const { note, resolvedBy, Description, Priority, CategoryName } = req.body;

  const query = `
    UPDATE tickets 
    SET Status='Fermé', 
        ResolutionNote=?, 
        ResolvedBy=?, 
        ResolvedAt=NOW(),
        Description=COALESCE(?, Description),
        Priority=COALESCE(?, Priority),
        CategoryName=COALESCE(?, CategoryName)
    WHERE TicketID=?
  `;

  db.query(query, [note || "", resolvedBy || "", Description, Priority, CategoryName, ticketId], err => {
    if (err) return res.status(500).json({ error: err.message });

    db.query("SELECT * FROM tickets WHERE TicketID = ?", [ticketId], (err2, results) => {
      if (err2 || !results.length) return res.status(500).json({ error: "Ticket introuvable" });
      const t = results[0];
      t.ResolutionTime = t.ResolvedAt ? formatResolutionTime(t.CreatedAt, t.ResolvedAt) : "-";
      res.json({ message: "Ticket résolu", ticket: t });
    });
  });
});

app.delete("/tickets/delete-closed", (req, res) => {
  db.query("DELETE FROM tickets WHERE Status='Fermé'", (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, deleted: result.affectedRows });
  });
});

const IT_USERS = {
  boutaina: "123",
  tarik: "123",
  zakaria: "123",
  sanaa: "123",
  mostafa: "123",
  salim: "123"
};

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (IT_USERS[username] && IT_USERS[username] === password) {
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, message: "Nom ou mot de passe incorrect" });
});





app.get("/categories", (req, res) => {
  const sql = "SELECT * FROM categories";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des catégories :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
    res.json(results);
  });
});

app.use(express.json());

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username.toLowerCase() === "tank" && password === "123") {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: "Utilisateur non autorisé" });
  }
});
 


app.listen(port, () => {
  console.log(` Serveur backend lancé sur http://localhost:${port}`);
});
