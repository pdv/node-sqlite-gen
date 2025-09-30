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
    inputSchema: z.object({}),
    outputSchema: z.array(z.unknown()),
});

export const insertUser = defineStatement({
    sql: "INSERT INTO users (name, age) VALUES (?, ?) RETURNING id;",
    inputs: ["name", "age"],
    inputSchema: z.object({
        name: z.string().nonempty().describe("user.name"),
        age: z.number().int(),
    }),
    outputSchema: z.array(z.object({
        id: z.number().int(),
    })),
});

export const getUserById = defineStatement({
    sql: "SELECT name, age FROM users WHERE id = ?",
    inputs: ["id"],
    inputSchema: z.object({
        id: z.number().int(),
    }),
    outputSchema: z.array(z.object({
        name: z.string().nonempty(),
        age: z.number().int(),
    })),
});

export const getAllUsers = defineStatement({
    sql: "SELECT name FROM users",
    inputs: [],
    inputSchema: z.object({}),
    outputSchema: z.array(z.object({
        name: z.string().nonempty(),
    })),
});
