import { z } from "zod";
import { DatabaseSync } from "node:sqlite";
import { type } from "node:os";

type Statement<InputT extends z.ZodTypeAny, OutputT extends z.ZodTypeAny> = {
    sql: string;
    inputs: InputT extends z.ZodObject<infer Shape> ? (keyof Shape)[] : string[];
    inputSchema: InputT;
    outputSchema: OutputT;
};

export function defineStatement<
    InputT extends z.ZodRawShape,
    OutputT extends z.ZodRawShape,
>(statement: {
    sql: string;
    inputs: (keyof InputT)[];
    inputSchema: InputT;
    outputSchema: OutputT;
}) {
    return {
        sql: statement.sql,
        inputs: statement.inputs,
        inputSchema: z.object(statement.inputSchema),
        outputSchema: z.array(z.object(statement.outputSchema)),
    };
}

export function prepare<
    InputT extends z.ZodTypeAny,
    OutputT extends z.ZodTypeAny,
>(db: DatabaseSync, statement: Statement<InputT, OutputT>) {
    console.log(`preparing ${statement.sql}`);
    const prepared = db.prepare(statement.sql);
    return (
        input: z.infer<InputT>,
    ): z.infer<OutputT> => {
        const args = statement.inputs.map((key) => input[key as keyof typeof input]);
        console.log(`executing ${statement.sql}`);
        const res = prepared.all(...args);
        return statement.outputSchema.parse(res);
    };
}
