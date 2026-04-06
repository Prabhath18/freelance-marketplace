const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();

app.use(cors());
app.use(express.json());

/* ✅ MySQL Connection */
const db = mysql.createConnection({
    host: "127.0.0.1",   // ✅ FIXED
    user: "root",
    password: "admin@123",
    database: "freelance_db",
    port: 3306           // ✅ added (safe)
});

db.connect((err) => {
    if (err) {
        console.log("DB Connection Failed:", err);
    } else {
        console.log("✅ Connected to MySQL");
    }
});

/* ✅ Test route */
app.get("/", (req, res) => {
    res.send("Server is running");
});

/* ✅ Register */
app.post("/register", (req, res) => {
    const { name, email, password } = req.body;

    const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

    db.query(sql, [name, email, password], (err) => {
        if (err) {
            console.log(err);
            return res.send("Error");
        }
        res.send("User Registered Successfully");
    });
});

/* ✅ Login */
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";

    db.query(sql, [email, password], (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Error");
        }

        if (result.length > 0) {
            res.send("Login Successful");
        } else {
            res.send("Invalid Credentials");
        }
    });
});

/* ✅ Create Task */
app.post("/tasks", (req, res) => {
    const { title, description, price, created_by } = req.body;

    const sql = `
        INSERT INTO tasks (title, description, price, created_by)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [title, description, price, created_by], (err) => {
        if (err) {
            console.log(err);
            return res.send("Error creating task");
        }
        res.send("Task Created Successfully");
    });
});

/* ✅ Get Tasks */
app.get("/tasks", (req, res) => {
    const sql = "SELECT * FROM tasks";

    db.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Error fetching tasks");
        }
        res.json(result);
    });
});

/* ✅ Accept Task */
app.post("/tasks/accept", (req, res) => {
    const { task_id, user_id } = req.body;

    const sql = `
        UPDATE tasks 
        SET assigned_to = ?, status = 'in progress'
        WHERE id = ? AND status = 'open'
    `;

    db.query(sql, [user_id, task_id], (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Error accepting task");
        }

        if (result.affectedRows > 0) {
            res.send("Task Accepted");
        } else {
            res.send("Task not available");
        }
    });
});

/* ✅ Complete Task */
app.post("/tasks/complete", (req, res) => {
    const { task_id } = req.body;

    const sql = `
        UPDATE tasks 
        SET status = 'completed'
        WHERE id = ?
    `;

    db.query(sql, [task_id], (err) => {
        if (err) {
            console.log(err);
            return res.send("Error completing task");
        }

        res.send("Task Completed");
    });
});

/* ✅ Start Server (KEEP LAST) */
app.listen(5000, () => {
    console.log("🚀 Server running on port 5000");
});