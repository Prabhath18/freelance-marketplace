const request = require("supertest");
const express = require("express");
const cors = require("cors");

// ─── Mock mysql2 so no real DB is needed ───────────────────────────────────
jest.mock("mysql2", () => {
    const mockQuery = jest.fn();
    const mockConnect = jest.fn((cb) => cb(null)); // simulate successful connect
    return {
        createConnection: jest.fn(() => ({
            connect: mockConnect,
            query: mockQuery,
        })),
        __mockQuery: mockQuery, // expose for test use
    };
});

const mysql = require("mysql2");
const mockQuery = mysql.__mockQuery;

// ─── Load app (after mock is set up) ───────────────────────────────────────
const app = require("./server");

// ═══════════════════════════════════════════════════════════════════════════
// TC01 — GET /  →  server health check
// ═══════════════════════════════════════════════════════════════════════════
describe("GET /", () => {
    test("TC01: Should return server running message", async () => {
        const res = await request(app).get("/");
        expect(res.status).toBe(200);
        expect(res.text).toBe("Server is running");
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TC02–TC04 — POST /register
// ═══════════════════════════════════════════════════════════════════════════
describe("POST /register", () => {
    test("TC02: Should register a new user successfully", async () => {
        mockQuery.mockImplementation((sql, params, cb) => cb(null));

        const res = await request(app).post("/register").send({
            name: "John Doe",
            email: "john@example.com",
            password: "pass123",
        });

        expect(res.status).toBe(200);
        expect(res.text).toBe("User Registered Successfully");
    });

    test("TC03: Should return Error when DB insert fails", async () => {
        mockQuery.mockImplementation((sql, params, cb) =>
            cb(new Error("DB error"))
        );

        const res = await request(app).post("/register").send({
            name: "Jane",
            email: "jane@example.com",
            password: "pass123",
        });

        expect(res.text).toBe("Error");
    });

    test("TC04: Should handle missing fields gracefully", async () => {
        mockQuery.mockImplementation((sql, params, cb) =>
            cb(new Error("Field missing"))
        );

        const res = await request(app).post("/register").send({});
        expect(res.text).toBe("Error");
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TC05–TC07 — POST /login
// ═══════════════════════════════════════════════════════════════════════════
describe("POST /login", () => {
    test("TC05: Should return Login Successful for valid credentials", async () => {
        mockQuery.mockImplementation((sql, params, cb) =>
            cb(null, [{ id: 1, email: "john@example.com" }])
        );

        const res = await request(app).post("/login").send({
            email: "john@example.com",
            password: "pass123",
        });

        expect(res.text).toBe("Login Successful");
    });

    test("TC06: Should return Invalid Credentials for wrong password", async () => {
        mockQuery.mockImplementation((sql, params, cb) => cb(null, []));

        const res = await request(app).post("/login").send({
            email: "john@example.com",
            password: "wrongpass",
        });

        expect(res.text).toBe("Invalid Credentials");
    });

    test("TC07: Should return Error when DB query fails", async () => {
        mockQuery.mockImplementation((sql, params, cb) =>
            cb(new Error("DB error"))
        );

        const res = await request(app).post("/login").send({
            email: "john@example.com",
            password: "pass123",
        });

        expect(res.text).toBe("Error");
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TC08–TC10 — POST /tasks  (Create Task)
// ═══════════════════════════════════════════════════════════════════════════
describe("POST /tasks", () => {
    test("TC08: Should create a task successfully", async () => {
        mockQuery.mockImplementation((sql, params, cb) => cb(null));

        const res = await request(app).post("/tasks").send({
            title: "Build a website",
            description: "React frontend",
            price: 500,
            created_by: 1,
        });

        expect(res.text).toBe("Task Created Successfully");
    });

    test("TC09: Should return error when task creation fails", async () => {
        mockQuery.mockImplementation((sql, params, cb) =>
            cb(new Error("DB error"))
        );

        const res = await request(app).post("/tasks").send({
            title: "Bad Task",
        });

        expect(res.text).toBe("Error creating task");
    });

    test("TC10: Should handle empty body for task creation", async () => {
        mockQuery.mockImplementation((sql, params, cb) =>
            cb(new Error("Missing fields"))
        );

        const res = await request(app).post("/tasks").send({});
        expect(res.text).toBe("Error creating task");
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TC11–TC12 — GET /tasks  (Fetch All Tasks)
// ═══════════════════════════════════════════════════════════════════════════
describe("GET /tasks", () => {
    test("TC11: Should return list of tasks", async () => {
        const mockTasks = [
            { id: 1, title: "Task 1", status: "open" },
            { id: 2, title: "Task 2", status: "in progress" },
        ];
        mockQuery.mockImplementation((sql, cb) => cb(null, mockTasks));

        const res = await request(app).get("/tasks");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockTasks);
    });

    test("TC12: Should return error when fetch fails", async () => {
        mockQuery.mockImplementation((sql, cb) =>
            cb(new Error("DB error"))
        );

        const res = await request(app).get("/tasks");
        expect(res.text).toBe("Error fetching tasks");
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TC13–TC15 — POST /tasks/accept
// ═══════════════════════════════════════════════════════════════════════════
describe("POST /tasks/accept", () => {
    test("TC13: Should accept an open task", async () => {
        mockQuery.mockImplementation((sql, params, cb) =>
            cb(null, { affectedRows: 1 })
        );

        const res = await request(app).post("/tasks/accept").send({
            task_id: 1,
            user_id: 2,
        });

        expect(res.text).toBe("Task Accepted");
    });

    test("TC14: Should return Task not available if already taken", async () => {
        mockQuery.mockImplementation((sql, params, cb) =>
            cb(null, { affectedRows: 0 })
        );

        const res = await request(app).post("/tasks/accept").send({
            task_id: 1,
            user_id: 2,
        });

        expect(res.text).toBe("Task not available");
    });

    test("TC15: Should return error when accept query fails", async () => {
        mockQuery.mockImplementation((sql, params, cb) =>
            cb(new Error("DB error"))
        );

        const res = await request(app).post("/tasks/accept").send({
            task_id: 1,
            user_id: 2,
        });

        expect(res.text).toBe("Error accepting task");
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TC16–TC17 — POST /tasks/complete
// ═══════════════════════════════════════════════════════════════════════════
describe("POST /tasks/complete", () => {
    test("TC16: Should complete a task successfully", async () => {
        mockQuery.mockImplementation((sql, params, cb) => cb(null));

        const res = await request(app).post("/tasks/complete").send({
            task_id: 1,
        });

        expect(res.text).toBe("Task Completed");
    });

    test("TC17: Should return error when complete query fails", async () => {
        mockQuery.mockImplementation((sql, params, cb) =>
            cb(new Error("DB error"))
        );

        const res = await request(app).post("/tasks/complete").send({
            task_id: 1,
        });

        expect(res.text).toBe("Error completing task");
    });
});
