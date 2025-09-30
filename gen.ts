import sqlparser from "node-sql-parser";
import * as fs from "node:fs";

function toPascalCase(str: string): string {
    return str.replace(/^\w|[A-Z]|\b\w/g, (word) => word.toUpperCase()).replace(/\s+/g, "");
}

async function generate(path: string): Promise<void> {
    const sql = fs.readFileSync(path, "utf8");
    const queries = sql.split(";").filter((q) => q.trim());
    let output = "";
    for (const query of queries) {
        output += await generateQuery(query.trim());
    }
    fs.writeFileSync("db-bindings.ts", output);
}

async function generateQuery(query: string): Promise<string> {
    const annotationRegex = /-- name: (\w+) :(\w+)/;
    const match = query.match(annotationRegex);
    const parser = new sqlparser.Parser();
    const ast = parser.parse(query);

    if (match) {
        const name = match[1];
        const type = match[2];
        const queryAst = ast.ast;
        if (type === "one") {
            return generateSelectOne(name, queryAst, query);
        } else if (type === "exec") {
            return generateInsert(name, queryAst, query);
        }
        //@ts-ignore
    } else if (ast.ast.type === "create") {
        return generateInterface(ast.ast);
    }
    return "";
}

function generateInterface(table: any): string {
    let result = "";
    const tableName = table.table[0].table;
    result += `export interface ${toPascalCase(tableName)} {
`;
    for (const definition of table.create_definitions) {
        if (definition.resource === "column") {
            const columnName = definition.column.column;
            const dataType = definition.definition.dataType;
            let tsType = "any";
            if (dataType === "INT") {
                tsType = "number";
            } else if (dataType === "TEXT") {
                tsType = "string";
            }
            result += `    ${columnName}: ${tsType};
`;
        }
    }
    result += `}
`;
    return result;
}

function generateSelectOne(name: string, query: any, sql: string): string {
    const tableName = query.from[0].table;
    const returnType = toPascalCase(tableName);
    const numParams = (sql.match(/\?/g) || []).length;
    const params = Array.from({ length: numParams }, (_, i) => `p${i}: any`).join(", ");
    let result = `export function ${name}(${params}): ${returnType} {
`;
    result += `    // TODO: implement
`;
    result += `}
`;
    return result;
}

function generateInsert(name: string, query: any, sql: string): string {
    const numParams = (sql.match(/\?/g) || []).length;
    const params = Array.from({ length: numParams }, (_, i) => `p${i}: any`).join(", ");
    let result = `export function ${name}(${params}): void {
`;
    result += `    // TODO: implement
`;
    result += `}
`;
    return result;
}

await generate(process.argv[2]);
