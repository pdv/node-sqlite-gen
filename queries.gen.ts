import { DatabaseSync } from "node:sqlite";

const createUsersTable_sql = `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    age INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)`;

export function createUsersTable(db: DatabaseSync) {
    const stmt = db.prepare(createUsersTable_sql);
    return () => {
        stmt.run();
    };
}

const getAllUsers_sql = `SELECT * FROM users`;

export function getAllUsers(db: DatabaseSync) {
    const stmt = db.prepare(getAllUsers_sql);
    return () => {
        return stmt.all() as { id: number; name: string; email: string; age: number; created_at: string }[];
    };
}

const insertUser_sql = `INSERT INTO users (name)
VALUES (?)
RETURNING id`;

export function insertUser(db: DatabaseSync) {
    const stmt = db.prepare(insertUser_sql);
    return (params: { name: string }) => {
        const { name } = params;
        return stmt.get(name) as { id: number } | undefined;
    };
}

const getUserById_sql = `SELECT id, name, email, age FROM users WHERE id = ?`;

export function getUserById(db: DatabaseSync) {
    const stmt = db.prepare(getUserById_sql);
    return (params: { id: number }) => {
        const { id } = params;
        return stmt.get(id) as { id: number; name: string; email: string; age: number } | undefined;
    };
}

const updateUserEmail_sql = `UPDATE users SET email = ? WHERE id = ?`;

export function updateUserEmail(db: DatabaseSync) {
    const stmt = db.prepare(updateUserEmail_sql);
    return (params: { email: string; id: number }) => {
        const { email, id } = params;
        stmt.run(email, id);
    };
}

const deleteUser_sql = `DELETE FROM users WHERE id = ?`;

export function deleteUser(db: DatabaseSync) {
    const stmt = db.prepare(deleteUser_sql);
    return (params: { id: number }) => {
        const { id } = params;
        stmt.run(id);
    };
}

const getUsersByMinAge_sql = `SELECT id, name, age FROM users WHERE age >= ?`;

export function getUsersByMinAge(db: DatabaseSync) {
    const stmt = db.prepare(getUsersByMinAge_sql);
    return (params: { minAge: number }) => {
        const { minAge } = params;
        return stmt.all(minAge) as { id: number; name: string; age: number }[];
    };
}

const insertUserWithDetails_sql = `INSERT INTO users (name, email, age)
VALUES (?, ?, ?)
RETURNING id, name, email`;

export function insertUserWithDetails(db: DatabaseSync) {
    const stmt = db.prepare(insertUserWithDetails_sql);
    return (params: { name: string; email: string; age: number }) => {
        const { name, email, age } = params;
        return stmt.get(name, email, age) as { id: number; name: string; email: string } | undefined;
    };
}

const countUsers_sql = `SELECT COUNT(*) as count FROM users`;

export function countUsers(db: DatabaseSync) {
    const stmt = db.prepare(countUsers_sql);
    return () => {
        return stmt.get() as { count: number } | undefined;
    };
}