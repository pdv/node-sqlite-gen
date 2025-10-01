import { DatabaseSync } from "node:sqlite";

export function createUsersTable(db: DatabaseSync) {
    const stmt = db.prepare(`
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY,
    name TEXT NOT NULL
)
    `);
    return stmt.get() as {};
}

export function getAllUsers(db: DatabaseSync) {
    const stmt = db.prepare(`
SELECT * FROM users
    `);
    return stmt.get() as {
        name: string;
        age: number;
    };
}

export function insertUser(db: DatabaseSync, name: string) {
    const stmt = db.prepare(`
INSERT INTO users (name)
VALUES (?)
RETURNING (id)
    `);
    return stmt.get() as {
        id: number;
    };
}
