import { z } from "zod";

export const reset = {
    sql: `
        CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            name TEXT,
            age INTEGER
        );
    `,
    inputSchema: {},
    outputSchema: {},
};

export const insertUser = {
    sql: "INSERT INTO users (name, age) VALUES (?, ?) RETURNING id;",
    inputSchema: {
        name: z.string().nonempty().describe("user.name"),
        age: z.int(),
    },
    outputSchema: {
        id: z.number().int(),
    },
};

export const getUserById = {
    sql: "SELECT name, age FROM users WHERE id = ?",
    inputSchema: {
        id: z.number().int(),
    },
    outputSchema: {
        name: z.string().nonempty(),
        age: z.int(),
    },
};

export const getAllUsers = {
    sql: "SELECT name FROM users",
    inputSchema: {},
    outputSchema: {
        name: z.string().nonempty(),
    },
};
