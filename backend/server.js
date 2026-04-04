const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.send("Server is running");
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});
const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "host.docker.internal",
    user: "root",
    password: "admin@123",
    database: "freelance_db"
});

db.connect((err) => {
    if (err) {
        console.log("DB Connection Failed:", err);
    } else {
        console.log("Connected to MySQL");
    }
});
app.post("/register", (req, res) => {
    const { name, email, password } = req.body;

    const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

    db.query(sql, [name, email, password], (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Error");
        }
        res.send("User Registered Successfully");
    });
});
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
app.post("/tasks", (req, res) => {
    const { title, description, price, created_by } = req.body;

    const sql = `
        INSERT INTO tasks (title, description, price, created_by)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [title, description, price, created_by], (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Error creating task");
        }
        res.send("Task Created Successfully");
    });
});
app.get("/tasks", (req, res) => {
    const sql = "SELECT * FROM tasks";

    db.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Error fetching tasks");
        }
        res.send(result);
    });
});
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
app.post("/tasks/complete", (req, res) => {
    const { task_id } = req.body;

    const sql = `
        UPDATE tasks 
        SET status = 'completed'
        WHERE id = ?
    `;

    db.query(sql, [task_id], (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Error completing task");
        }

        res.send("Task Completed");
    });
});