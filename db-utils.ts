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

type StatementDef<InputT extends z.ZodRawShape, OutputT extends z.ZodRawShape, Mode extends ExecutionMode> = {
    sql: string;
    inputs: (keyof InputT)[];
    inputSchema: InputT;
    outputSchema: Mode extends "run" ? {} : OutputT;
    mode: Mode;
};

export function defineStatement<InputT extends z.ZodRawShape>(
    statement: StatementDef<InputT, {}, "run">
): Statement<z.ZodObject<InputT>, z.ZodObject<{}>, "run">;

export function defineStatement<InputT extends z.ZodRawShape, OutputT extends z.ZodRawShape>(
    statement: StatementDef<InputT, OutputT, "get">
): Statement<z.ZodObject<InputT>, z.ZodObject<OutputT>, "get">;

export function defineStatement<InputT extends z.ZodRawShape, OutputT extends z.ZodRawShape>(
    statement: Omit<StatementDef<InputT, OutputT, "all">, "mode"> & { mode?: "all" }
): Statement<z.ZodObject<InputT>, z.ZodArray<z.ZodObject<OutputT>>, "all">;

export function defineStatement<InputT extends z.ZodRawShape, OutputT extends z.ZodRawShape>(
    statement: Omit<StatementDef<InputT, OutputT, ExecutionMode>, "mode"> & { mode?: ExecutionMode }
) {
    const mode = statement.mode ?? "all";
    const inputSchema = z.object(statement.inputSchema);
    const outputSchema = mode === "run" ? z.object({})
        : mode === "get" ? z.object(statement.outputSchema as OutputT)
        : z.array(z.object(statement.outputSchema as OutputT));

    return { sql: statement.sql, inputs: statement.inputs, inputSchema, outputSchema, mode };
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
    const prepared = db.prepare(statement.sql);

    return ((input?: z.infer<InputT>): z.infer<OutputT> => {
        const actualInput = input ?? {};
        const args = statement.inputs.map((key) => actualInput[key as keyof typeof actualInput]);

        const res = statement.mode === "run" ? prepared.run(...args)
            : statement.mode === "get" ? prepared.get(...args)
            : prepared.all(...args);

        return statement.outputSchema.parse(res);
    }) as PreparedFunction<InputT, OutputT>;
}
