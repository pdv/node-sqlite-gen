import { readFileSync } from "fs";
import { writeFileSync } from "node:fs";

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

function generateFunction(statement: Statement): string {
    const params = statement.params.map((s) => `${s.name}: ${s.type}`).join(", ");
    const paramsList = statement.params.map((s) => s.name).join(", ");
    const { name, sql, count } = statement;

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
    const fnParams = params ? `, ${params}` : "";

    const returnStatement =
        count === "exec" ? methodCall + ";" : `return ${methodCall} as ${returnType};`;

    return `
${sqlConstant}

export function ${name}(db: DatabaseSync${fnParams}) {
    const stmt = db.prepare(${name}_sql);
    ${returnStatement}
}`.trim();
}

function parse(inputPath: string, outputPath: string) {
    const sql = readFileSync(inputPath, "utf-8");
    const output = ['import { DatabaseSync } from "node:sqlite";'];
    for (const statement of sql.split(";").slice(0, -1)) {
        const stmt = parseStatement(statement);
        output.push(generateFunction(stmt));
    }
    writeFileSync(outputPath, output.join("\n\n"));
}

parse("queries.sql", "queries.gen.ts");
