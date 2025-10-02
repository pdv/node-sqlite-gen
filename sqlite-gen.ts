#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";

interface Value {
    name: string;
    type: "number" | "string";
}

interface Statement {
    name: string;
    count: "exec" | "one" | "many";
    params: Value[];
    returns: Value[];
    sql: string;
}

function parseStatement(statement: string): Statement {
    const lines = statement.trim().split("\n");
    const start = lines.findIndex((line) => !line.startsWith("-- @"));
    const comments = lines.slice(0, start).map((line) => line.slice(4).split(" "));
    const name = comments[0][1];
    const count = comments[1][1];
    const params = comments.slice(2).filter((comment) => comment[0] === "param");
    const returns = comments.slice(2).filter((comment) => comment[0] === "returns");
    const sql = lines.slice(start).join("\n");
    return {
        name,
        count,
        params: params.map((line) => ({ name: line[1], type: line[2] })),
        returns: returns.map((line) => ({ name: line[1], type: line[2] })),
        sql,
    } as Statement;
}

function generateSyncFunctions(statement: Statement): string {
    const { name, sql, count } = statement;
    const hasParams = statement.params.length > 0;
    const paramsType = hasParams
        ? `{ ${statement.params.map((s) => `${s.name}: ${s.type}`).join("; ")} }`
        : "";
    const paramsList = statement.params.map((s) => s.name).join(", ");

    let returnType: string;
    let methodCall: string;
    if (count === "exec") {
        returnType = "void";
        methodCall = `stmt.run(${paramsList})`;
    } else if (count === "one") {
        const returnTypes = statement.returns.map((r) => `${r.name}: ${r.type}`).join("; ");
        returnType = returnTypes ? `{ ${returnTypes} } | undefined` : "undefined";
        methodCall = `stmt.get(${paramsList})`;
    } else {
        // many
        const returnTypes = statement.returns.map((r) => `${r.name}: ${r.type}`).join("; ");
        returnType = returnTypes ? `{ ${returnTypes} }[]` : "any[]";
        methodCall = `stmt.all(${paramsList})`;
    }

    const sqlConstant = `const ${name}_sql = \`${sql}\`;`;
    const fnParams = hasParams ? `params: ${paramsType}` : "";
    const destructure = hasParams ? `const { ${paramsList} } = params;\n    ` : "";
    const returnStatement =
        count === "exec" ? methodCall + ";" : `return ${methodCall} as ${returnType};`;

    // Prepare version - returns a closure with prepared statement
    const prepareParams = hasParams ? `(${fnParams})` : "()";
    const prepareBody = hasParams
        ? `${destructure}${returnStatement}`
        : returnStatement;

    const prepareVersion = `
export function prepare${name.charAt(0).toUpperCase() + name.slice(1)}(db: DatabaseSync) {
    const stmt = db.prepare(${name}_sql);
    return ${prepareParams} => {
        ${prepareBody}
    };
}`.trim();

    // One-shot version - prepares and executes immediately
    const oneShotParams = hasParams ? `db: DatabaseSync, ${fnParams}` : "db: DatabaseSync";
    const oneShotBody = hasParams
        ? `${destructure}${returnStatement}`
        : returnStatement;

    const oneShotVersion = `
export function ${name}(${oneShotParams}) {
    const stmt = db.prepare(${name}_sql);
    ${oneShotBody}
}`.trim();

    return `${sqlConstant}\n\n${prepareVersion}\n\n${oneShotVersion}`;
}

function generateD1Functions(statement: Statement): string {
    const { name, sql, count } = statement;
    const hasParams = statement.params.length > 0;
    const paramsType = hasParams
        ? `{ ${statement.params.map((s) => `${s.name}: ${s.type}`).join("; ")} }`
        : "";
    const paramsList = statement.params.map((s) => s.name).join(", ");

    let returnType: string;
    let methodCall: string;
    if (count === "exec") {
        returnType = "void";
        methodCall = `await stmt${hasParams ? `.bind(${paramsList})` : ""}.run()`;
    } else if (count === "one") {
        const returnTypes = statement.returns.map((r) => `${r.name}: ${r.type}`).join("; ");
        returnType = returnTypes ? `{ ${returnTypes} } | undefined` : "undefined";
        methodCall = `await stmt${hasParams ? `.bind(${paramsList})` : ""}.first()`;
    } else {
        // many
        const returnTypes = statement.returns.map((r) => `${r.name}: ${r.type}`).join("; ");
        returnType = returnTypes ? `{ ${returnTypes} }[]` : "any[]";
        methodCall = `(await stmt${hasParams ? `.bind(${paramsList})` : ""}.all()).results`;
    }

    const sqlConstant = `const ${name}_sql = \`${sql}\`;`;
    const fnParams = hasParams ? `params: ${paramsType}` : "";
    const destructure = hasParams ? `const { ${paramsList} } = params;\n    ` : "";
    const returnStatement =
        count === "exec" ? methodCall + ";" : `return ${methodCall} as ${returnType};`;

    // Prepare version
    const prepareParams = hasParams ? `(${fnParams})` : "()";
    const prepareBody = hasParams
        ? `${destructure}${returnStatement}`
        : returnStatement;

    const prepareVersion = `
export function prepare${name.charAt(0).toUpperCase() + name.slice(1)}(db: D1Database) {
    const stmt = db.prepare(${name}_sql);
    return async ${prepareParams} => {
        ${prepareBody}
    };
}`.trim();

    // One-shot version
    const oneShotParams = hasParams ? `db: D1Database, ${fnParams}` : "db: D1Database";
    const oneShotBody = hasParams
        ? `${destructure}${returnStatement}`
        : returnStatement;

    const oneShotVersion = `
export async function ${name}(${oneShotParams}) {
    const stmt = db.prepare(${name}_sql);
    ${oneShotBody}
}`.trim();

    return `${sqlConstant}\n\n${prepareVersion}\n\n${oneShotVersion}`;
}

function parse(inputPath: string, outputPath: string, backend: "node" | "d1") {
    const sql = readFileSync(inputPath, "utf-8");
    const output: string[] = [];

    // Add imports based on backend
    if (backend === "node") {
        output.push(`import { DatabaseSync } from "node:sqlite";`);
        output.push('');
    } else {
        // D1 types are available globally in CloudFlare Workers
        output.push('// CloudFlare D1 types are provided by the Workers runtime');
        output.push('');
    }

    const statements = sql.split(";").slice(0, -1).map(parseStatement);

    // Generate SQL constants (only once per statement)
    const sqlConstants = statements.map(stmt => `const ${stmt.name}_sql = \`${stmt.sql}\`;`);
    output.push(sqlConstants.join('\n\n'));
    output.push('');

    // Generate functions based on backend
    if (backend === "node") {
        for (const stmt of statements) {
            const code = generateSyncFunctions(stmt);
            // Remove SQL constant since we already added it
            const withoutSql = code.split('\n\n').slice(1).join('\n\n');
            output.push(withoutSql);
        }
    } else {
        for (const stmt of statements) {
            const code = generateD1Functions(stmt);
            // Remove SQL constant since we already added it
            const withoutSql = code.split('\n\n').slice(1).join('\n\n');
            output.push(withoutSql);
        }
    }

    writeFileSync(outputPath, output.join("\n\n"));
}

const args = process.argv.slice(2);

if (args.length < 2 || args.length > 3) {
    console.error("Usage: sqlite-gen <input-file.sql> <output-file.ts> [node|d1]");
    console.error("  Default backend: node");
    process.exit(1);
}

const [inputPath, outputPath, backendArg] = args;
const backend = (backendArg === "d1" ? "d1" : "node") as "node" | "d1";

if (backendArg && backendArg !== "node" && backendArg !== "d1") {
    console.error(`Invalid backend: ${backendArg}. Must be 'node' or 'd1'`);
    process.exit(1);
}

try {
    parse(inputPath, outputPath, backend);
    console.log(`Generated ${outputPath} from ${inputPath} (backend: ${backend})`);
} catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
}
