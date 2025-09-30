import { z } from "zod";
import { defineStatement } from "./db-utils";

export const reset = defineStatement({
    sql: `
        CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            name TEXT,
            age INTEGER
        );
    `,
    inputs: [],
    inputSchema: {},
    outputSchema: {},
    mode: "run",
});

export const insertUser = defineStatement({
    sql: "INSERT INTO users (name, age) VALUES (?, ?) RETURNING id;",
    inputs: ["name", "age"],
    inputSchema: {
        name: z.string().nonempty().describe("user.name"),
        age: z.number().int(),
    },
    outputSchema: {
        id: z.number().int(),
    },
    mode: "get",
});

export const getUserById = defineStatement({
    sql: "SELECT name, age FROM users WHERE id = ?",
    inputs: ["id"],
    inputSchema: {
        id: z.number().int(),
    },
    outputSchema: {
        name: z.string().nonempty(),
        age: z.number().int(),
    },
    mode: "get",
});

export const getAllUsers = defineStatement({
    sql: "SELECT name FROM users",
    inputs: [],
    inputSchema: {},
    outputSchema: {
        name: z.string().nonempty(),
    },
});
