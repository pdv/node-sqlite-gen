import { z } from "zod";
import { DatabaseSync } from "node:sqlite";

type ExecutionMode = "run" | "get" | "all";

type Statement<
    InputT extends z.ZodTypeAny,
    OutputT extends z.ZodTypeAny,
    Mode extends ExecutionMode = "all",
    HasInputs extends boolean = boolean
> = {
    sql: string;
    inputs: InputT extends z.ZodObject<infer Shape> ? (keyof Shape)[] : string[];
    inputSchema: InputT;
    outputSchema: OutputT;
    mode: Mode;
    hasInputs: HasInputs;
};

// With inputs
export function defineStatement<InputT extends z.ZodRawShape>(
    statement: { sql: string; inputs: (keyof InputT)[]; inputSchema: InputT; mode: "run" }
): Statement<z.ZodObject<InputT>, z.ZodObject<{}>, "run", true>;

export function defineStatement<InputT extends z.ZodRawShape, OutputT extends z.ZodRawShape>(
    statement: { sql: string; inputs: (keyof InputT)[]; inputSchema: InputT; outputSchema: OutputT; mode: "get" }
): Statement<z.ZodObject<InputT>, z.ZodObject<OutputT>, "get", true>;

export function defineStatement<InputT extends z.ZodRawShape, OutputT extends z.ZodRawShape>(
    statement: { sql: string; inputs: (keyof InputT)[]; inputSchema: InputT; outputSchema: OutputT; mode?: "all" }
): Statement<z.ZodObject<InputT>, z.ZodArray<z.ZodObject<OutputT>>, "all", true>;

// Without inputs
export function defineStatement(
    statement: { sql: string; mode: "run" }
): Statement<z.ZodObject<{}>, z.ZodObject<{}>, "run", false>;

export function defineStatement<OutputT extends z.ZodRawShape>(
    statement: { sql: string; outputSchema: OutputT; mode: "get" }
): Statement<z.ZodObject<{}>, z.ZodObject<OutputT>, "get", false>;

export function defineStatement<OutputT extends z.ZodRawShape>(
    statement: { sql: string; outputSchema: OutputT; mode?: "all" }
): Statement<z.ZodObject<{}>, z.ZodArray<z.ZodObject<OutputT>>, "all", false>;

export function defineStatement(statement: any): any {
    const mode = statement.mode ?? "all";
    const inputSchema = z.object(statement.inputSchema ?? {});
    const outputSchema = mode === "run" ? z.object({})
        : mode === "get" ? z.object(statement.outputSchema ?? {})
        : z.array(z.object(statement.outputSchema ?? {}));
    const hasInputs = statement.inputs !== undefined && statement.inputs.length > 0;

    return { sql: statement.sql, inputs: statement.inputs ?? [], inputSchema, outputSchema, mode, hasInputs };
}

type PreparedFunction<
    InputT extends z.ZodTypeAny,
    OutputT extends z.ZodTypeAny,
    HasInputs extends boolean
> = HasInputs extends true
    ? (input: z.infer<InputT>) => z.infer<OutputT>
    : () => z.infer<OutputT>;

export function prepare<
    InputT extends z.ZodTypeAny,
    OutputT extends z.ZodTypeAny,
    Mode extends ExecutionMode = "all",
    HasInputs extends boolean = boolean
>(db: DatabaseSync, statement: Statement<InputT, OutputT, Mode, HasInputs>): PreparedFunction<InputT, OutputT, HasInputs> {
    const prepared = db.prepare(statement.sql);

    if (!statement.hasInputs) {
        return (() => {
            const res = statement.mode === "run" ? prepared.run()
                : statement.mode === "get" ? prepared.get()
                : prepared.all();
            return statement.outputSchema.parse(res);
        }) as PreparedFunction<InputT, OutputT, HasInputs>;
    }

    return ((input: z.infer<InputT>) => {
        const args = statement.inputs.map((key) => input[key as keyof typeof input]);
        const res = statement.mode === "run" ? prepared.run(...args)
            : statement.mode === "get" ? prepared.get(...args)
            : prepared.all(...args);
        return statement.outputSchema.parse(res);
    }) as PreparedFunction<InputT, OutputT, HasInputs>;
}
