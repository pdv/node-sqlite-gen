import { DatabaseSync } from "node:sqlite";

const createUsersTable_sql = `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    age INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)`;

export function createUsersTable(db: DatabaseSync) {
    const stmt = db.prepare(createUsersTable_sql);
    stmt.run();
}

const getAllUsers_sql = `SELECT * FROM users`;

export function getAllUsers(db: DatabaseSync) {
    const stmt = db.prepare(getAllUsers_sql);
    return stmt.all() as { id: number; name: string; email: string; age: number; created_at: string }[];
}

const insertUser_sql = `INSERT INTO users (name)
VALUES (?)
RETURNING id`;

export function insertUser(db: DatabaseSync, name: string) {
    const stmt = db.prepare(insertUser_sql);
    return stmt.get(name) as { id: number } | undefined;
}

const getUserById_sql = `SELECT id, name, email, age FROM users WHERE id = ?`;

export function getUserById(db: DatabaseSync, id: number) {
    const stmt = db.prepare(getUserById_sql);
    return stmt.get(id) as { id: number; name: string; email: string; age: number } | undefined;
}

const updateUserEmail_sql = `UPDATE users SET email = ? WHERE id = ?`;

export function updateUserEmail(db: DatabaseSync, email: string, id: number) {
    const stmt = db.prepare(updateUserEmail_sql);
    stmt.run(email, id);
}

const deleteUser_sql = `DELETE FROM users WHERE id = ?`;

export function deleteUser(db: DatabaseSync, id: number) {
    const stmt = db.prepare(deleteUser_sql);
    stmt.run(id);
}

const getUsersByMinAge_sql = `SELECT id, name, age FROM users WHERE age >= ?`;

export function getUsersByMinAge(db: DatabaseSync, minAge: number) {
    const stmt = db.prepare(getUsersByMinAge_sql);
    return stmt.all(minAge) as { id: number; name: string; age: number }[];
}

const insertUserWithDetails_sql = `INSERT INTO users (name, email, age)
VALUES (?, ?, ?)
RETURNING id, name, email`;

export function insertUserWithDetails(db: DatabaseSync, name: string, email: string, age: number) {
    const stmt = db.prepare(insertUserWithDetails_sql);
    return stmt.get(name, email, age) as { id: number; name: string; email: string } | undefined;
}

const countUsers_sql = `SELECT COUNT(*) as count FROM users`;

export function countUsers(db: DatabaseSync) {
    const stmt = db.prepare(countUsers_sql);
    return stmt.get() as { count: number } | undefined;
}