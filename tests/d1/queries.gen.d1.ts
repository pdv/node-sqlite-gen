// CloudFlare D1 types are provided by the Workers runtime



const createUsersTable_sql = `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    age INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)`;

const getAllUsers_sql = `SELECT * FROM users`;

const insertUser_sql = `INSERT INTO users (name)
VALUES (?)
RETURNING id`;

const getUserById_sql = `SELECT id, name, email, age FROM users WHERE id = ?`;

const updateUserEmail_sql = `UPDATE users SET email = ? WHERE id = ?`;

const deleteUser_sql = `DELETE FROM users WHERE id = ?`;

const getUsersByMinAge_sql = `SELECT id, name, age FROM users WHERE age >= ?`;

const insertUserWithDetails_sql = `INSERT INTO users (name, email, age)
VALUES (?, ?, ?)
RETURNING id, name, email`;

const countUsers_sql = `SELECT COUNT(*) as count FROM users`;



export function prepareCreateUsersTable(db: D1Database) {
    const stmt = db.prepare(createUsersTable_sql);
    return async () => {
        await stmt.run();
    };
}

export async function createUsersTable(db: D1Database) {
    const stmt = db.prepare(createUsersTable_sql);
    await stmt.run();
}

export function prepareGetAllUsers(db: D1Database) {
    const stmt = db.prepare(getAllUsers_sql);
    return async () => {
        return (await stmt.all()).results as { id: number; name: string; email: string; age: number; created_at: string }[];
    };
}

export async function getAllUsers(db: D1Database) {
    const stmt = db.prepare(getAllUsers_sql);
    return (await stmt.all()).results as { id: number; name: string; email: string; age: number; created_at: string }[];
}

export function prepareInsertUser(db: D1Database) {
    const stmt = db.prepare(insertUser_sql);
    return async (params: { name: string }) => {
        const { name } = params;
    return await stmt.bind(name).first() as { id: number } | undefined;
    };
}

export async function insertUser(db: D1Database, params: { name: string }) {
    const stmt = db.prepare(insertUser_sql);
    const { name } = params;
    return await stmt.bind(name).first() as { id: number } | undefined;
}

export function prepareGetUserById(db: D1Database) {
    const stmt = db.prepare(getUserById_sql);
    return async (params: { id: number }) => {
        const { id } = params;
    return await stmt.bind(id).first() as { id: number; name: string; email: string; age: number } | undefined;
    };
}

export async function getUserById(db: D1Database, params: { id: number }) {
    const stmt = db.prepare(getUserById_sql);
    const { id } = params;
    return await stmt.bind(id).first() as { id: number; name: string; email: string; age: number } | undefined;
}

export function prepareUpdateUserEmail(db: D1Database) {
    const stmt = db.prepare(updateUserEmail_sql);
    return async (params: { email: string; id: number }) => {
        const { email, id } = params;
    await stmt.bind(email, id).run();
    };
}

export async function updateUserEmail(db: D1Database, params: { email: string; id: number }) {
    const stmt = db.prepare(updateUserEmail_sql);
    const { email, id } = params;
    await stmt.bind(email, id).run();
}

export function prepareDeleteUser(db: D1Database) {
    const stmt = db.prepare(deleteUser_sql);
    return async (params: { id: number }) => {
        const { id } = params;
    await stmt.bind(id).run();
    };
}

export async function deleteUser(db: D1Database, params: { id: number }) {
    const stmt = db.prepare(deleteUser_sql);
    const { id } = params;
    await stmt.bind(id).run();
}

export function prepareGetUsersByMinAge(db: D1Database) {
    const stmt = db.prepare(getUsersByMinAge_sql);
    return async (params: { minAge: number }) => {
        const { minAge } = params;
    return (await stmt.bind(minAge).all()).results as { id: number; name: string; age: number }[];
    };
}

export async function getUsersByMinAge(db: D1Database, params: { minAge: number }) {
    const stmt = db.prepare(getUsersByMinAge_sql);
    const { minAge } = params;
    return (await stmt.bind(minAge).all()).results as { id: number; name: string; age: number }[];
}

export function prepareInsertUserWithDetails(db: D1Database) {
    const stmt = db.prepare(insertUserWithDetails_sql);
    return async (params: { name: string; email: string; age: number }) => {
        const { name, email, age } = params;
    return await stmt.bind(name, email, age).first() as { id: number; name: string; email: string } | undefined;
    };
}

export async function insertUserWithDetails(db: D1Database, params: { name: string; email: string; age: number }) {
    const stmt = db.prepare(insertUserWithDetails_sql);
    const { name, email, age } = params;
    return await stmt.bind(name, email, age).first() as { id: number; name: string; email: string } | undefined;
}

export function prepareCountUsers(db: D1Database) {
    const stmt = db.prepare(countUsers_sql);
    return async () => {
        return await stmt.first() as { count: number } | undefined;
    };
}

export async function countUsers(db: D1Database) {
    const stmt = db.prepare(countUsers_sql);
    return await stmt.first() as { count: number } | undefined;
}