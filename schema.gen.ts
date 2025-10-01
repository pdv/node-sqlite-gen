import { DatabaseSync } from "node:sqlite";

const createUsersTable_sql = `CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY,
    name TEXT NOT NULL
)`;

export function createUsersTable(db: DatabaseSync) {
    const stmt = db.prepare(createUsersTable_sql);
    stmt.run();
}

const getAllUsers_sql = `SELECT * FROM users`;

export function getAllUsers(db: DatabaseSync) {
    const stmt = db.prepare(getAllUsers_sql);
    return stmt.all() as { name: string; age: number }[];
}

const insertUser_sql = `INSERT INTO users (name)
VALUES (?)
RETURNING (id)`;

export function insertUser(db: DatabaseSync, name: string) {
    const stmt = db.prepare(insertUser_sql);
    return stmt.get(name) as { id: number } | undefined;
}