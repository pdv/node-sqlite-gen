import { z } from "zod";
import { DatabaseSync } from "node:sqlite";

type ExecutionMode = "run" | "get" | "all";

type Statement<
    InputT extends z.ZodTypeAny,
    OutputT extends z.ZodTypeAny,
    Mode extends ExecutionMode = "all"
> = {
    sql: string;
    inputs: InputT extends z.ZodObject<infer Shape> ? (keyof Shape)[] : string[];
    inputSchema: InputT;
    outputSchema: OutputT;
    mode: Mode;
};

// Overload for mode: "run"
export function defineStatement<InputT extends z.ZodRawShape>(
    statement: {
        sql: string;
        inputs: (keyof InputT)[];
        inputSchema: InputT;
        outputSchema: {};
        mode: "run";
    }
): Statement<z.ZodObject<InputT>, z.ZodObject<{}>, "run">;

// Overload for mode: "get"
export function defineStatement<InputT extends z.ZodRawShape, OutputT extends z.ZodRawShape>(
    statement: {
        sql: string;
        inputs: (keyof InputT)[];
        inputSchema: InputT;
        outputSchema: OutputT;
        mode: "get";
    }
): Statement<z.ZodObject<InputT>, z.ZodObject<OutputT>, "get">;

// Overload for mode: "all" or omitted
export function defineStatement<InputT extends z.ZodRawShape, OutputT extends z.ZodRawShape>(
    statement: {
        sql: string;
        inputs: (keyof InputT)[];
        inputSchema: InputT;
        outputSchema: OutputT;
        mode?: "all";
    }
): Statement<z.ZodObject<InputT>, z.ZodArray<z.ZodObject<OutputT>>, "all">;

// Implementation
export function defineStatement<InputT extends z.ZodRawShape, OutputT extends z.ZodRawShape>(
    statement: {
        sql: string;
        inputs: (keyof InputT)[];
        inputSchema: InputT;
        outputSchema: OutputT;
        mode?: ExecutionMode;
    }
) {
    const mode = statement.mode || "all";
    const outputSchema = mode === "run"
        ? z.object({})
        : mode === "get"
        ? z.object(statement.outputSchema)
        : z.array(z.object(statement.outputSchema));

    return {
        sql: statement.sql,
        inputs: statement.inputs,
        inputSchema: z.object(statement.inputSchema),
        outputSchema,
        mode,
    };
}

type PreparedFunction<InputT extends z.ZodTypeAny, OutputT extends z.ZodTypeAny> =
    z.infer<InputT> extends Record<string, never>
        ? (input?: z.infer<InputT>) => z.infer<OutputT>
        : (input: z.infer<InputT>) => z.infer<OutputT>;

export function prepare<
    InputT extends z.ZodTypeAny,
    OutputT extends z.ZodTypeAny,
    Mode extends ExecutionMode = "all"
>(db: DatabaseSync, statement: Statement<InputT, OutputT, Mode>): PreparedFunction<InputT, OutputT> {
    try {
        const prepared = db.prepare(statement.sql);
        return ((input?: z.infer<InputT>): z.infer<OutputT> => {
            try {
                const actualInput = input ?? {};
                const args = statement.inputs.map((key) => actualInput[key as keyof typeof actualInput]);

                const res = statement.mode === "run"
                    ? prepared.run(...args)
                    : statement.mode === "get"
                    ? prepared.get(...args)
                    : prepared.all(...args);

                return statement.outputSchema.parse(res);
            } catch (error) {
                throw new Error(
                    `Failed to execute statement: ${statement.sql}\n` +
                    `Input: ${JSON.stringify(input)}\n` +
                    `Error: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        }) as PreparedFunction<InputT, OutputT>;
    } catch (error) {
        throw new Error(
            `Failed to prepare statement: ${statement.sql}\n` +
            `Error: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}
