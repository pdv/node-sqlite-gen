import { z } from "zod";
import { DatabaseSync } from "node:sqlite";

type Statement = {
    sql: string;
    inputSchema: Record<string, z.ZodNumber | z.ZodString>;
    outputSchema: Record<string, z.ZodNumber | z.ZodString>;
};

export function prepare<T extends Statement>(db: DatabaseSync, statement: T) {
    console.log(`preparing ${statement.sql}`);
    const prepared = db.prepare(statement.sql);
    const inputSchema = z.object(statement.inputSchema);
    const outputSchema = z.object(statement.outputSchema);
    return (input: z.infer<typeof inputSchema>) => {
        const args = [];
        for (const [key, value] of Object.entries(statement.inputSchema)) {
            args.push(value.parse(input[key as keyof typeof input]));
        }
        console.log(`executing ${statement.sql}`);
        const res = prepared.all(...args);
        return z.array(outputSchema).parse(res);
    };
}
