import * as fs from "node:fs";
import { DatabaseSync } from "node:sqlite";

function toPascalCase(str: string): string {
    return str.replace(/^\w|[A-Z]|\b\w/g, (word) => word.toUpperCase()).replace(/\s+/g, "");
}

function toCamelCase(str: string): string {
    const pascal = toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

interface QueryAnnotation {
    name: string;
    type: "one" | "many" | "exec";
    sql: string;
}

interface TableColumn {
    name: string;
    type: string;
    nullable: boolean;
}

interface TableInfo {
    name: string;
    columns: TableColumn[];
}

function parseSchema(sql: string): { tables: TableInfo[], queries: QueryAnnotation[] } {
    const tables: TableInfo[] = [];
    const queries: QueryAnnotation[] = [];

    // Parse CREATE TABLE statements
    const createTableRegex = /CREATE TABLE (?:IF NOT EXISTS )?(\w+)\s*\(([\s\S]*?)\);/gi;
    let match;

    while ((match = createTableRegex.exec(sql)) !== null) {
        const tableName = match[1];
        const columnsDef = match[2];
        const columns: TableColumn[] = [];

        // Parse columns
        const lines = columnsDef.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('--'));
        for (const line of lines) {
            const columnMatch = line.match(/^(\w+)\s+(\w+)(\s+.*)?/);
            if (columnMatch) {
                const [, name, type, constraints] = columnMatch;
                const nullable = !(constraints && constraints.includes('NOT NULL'));
                columns.push({ name, type, nullable });
            }
        }

        tables.push({ name: tableName, columns });
    }

    // Parse query annotations
    const queryRegex = /-- name:\s*(\w+)\s*:(\w+)\s*\n([\s\S]*?)(?=\n-- name:|$)/gi;

    while ((match = queryRegex.exec(sql)) !== null) {
        const [, name, type, querySql] = match;
        queries.push({
            name,
            type: type as "one" | "many" | "exec",
            sql: querySql.trim().replace(/;$/, '')
        });
    }

    return { tables, queries };
}

function sqlTypeToTs(sqlType: string): string {
    const upper = sqlType.toUpperCase();
    if (upper.includes('INT') || upper.includes('REAL') || upper.includes('NUMERIC')) {
        return 'number';
    }
    if (upper.includes('TEXT') || upper.includes('CHAR') || upper.includes('CLOB')) {
        return 'string';
    }
    if (upper.includes('BLOB')) {
        return 'Buffer';
    }
    return 'any';
}

function generateTableInterface(table: TableInfo): string {
    let code = `export interface ${toPascalCase(table.name)} {\n`;
    for (const col of table.columns) {
        const tsType = sqlTypeToTs(col.type);
        const optional = col.nullable ? '?' : '';
        code += `    ${col.name}${optional}: ${tsType};\n`;
    }
    code += '}\n\n';
    return code;
}

function inferQueryResultType(sql: string, tables: TableInfo[]): { type: string, isArray: boolean } | null {
    // Try to find FROM clause
    const fromMatch = sql.match(/FROM\s+(\w+)/i);
    if (!fromMatch) return null;

    const tableName = fromMatch[1];
    const table = tables.find(t => t.name === tableName);
    if (!table) return null;

    // For SELECT *, return full table type
    if (sql.match(/SELECT\s+\*/i)) {
        return { type: toPascalCase(tableName), isArray: true };
    }

    // For specific columns, try to build a type
    const selectMatch = sql.match(/SELECT\s+([\w\s,]+)\s+FROM/i);
    if (selectMatch) {
        const columns = selectMatch[1].split(',').map(c => c.trim());
        const fields = columns.map(colName => {
            const col = table.columns.find(c => c.name === colName);
            if (!col) return null;
            const tsType = sqlTypeToTs(col.type);
            const optional = col.nullable ? '?' : '';
            return `${col.name}${optional}: ${tsType}`;
        }).filter(Boolean);

        if (fields.length === columns.length) {
            return { type: `{ ${fields.join('; ')} }`, isArray: true };
        }
    }

    return { type: toPascalCase(tableName), isArray: true };
}

function countPlaceholders(sql: string): number {
    return (sql.match(/\?/g) || []).length;
}

function generateQuery(query: QueryAnnotation, tables: TableInfo[]): string {
    const numParams = countPlaceholders(query.sql);
    const params = Array.from({ length: numParams }, (_, i) => `p${i}: any`).join(', ');

    let code = '';

    if (query.type === 'exec') {
        code += `export async function ${query.name}(db: DatabaseSync${params ? ', ' + params : ''}): Promise<void> {\n`;
        code += `    const stmt = db.prepare(\`${query.sql}\`);\n`;
        if (numParams > 0) {
            code += `    stmt.run(${Array.from({ length: numParams }, (_, i) => `p${i}`).join(', ')});\n`;
        } else {
            code += `    stmt.run();\n`;
        }
        code += '}\n\n';
    } else if (query.type === 'one') {
        const resultType = inferQueryResultType(query.sql, tables);
        const returnType = resultType ? resultType.type : 'any';

        code += `export async function ${query.name}(db: DatabaseSync${params ? ', ' + params : ''}): Promise<${returnType} | undefined> {\n`;
        code += `    const stmt = db.prepare(\`${query.sql}\`);\n`;
        if (numParams > 0) {
            code += `    return stmt.get(${Array.from({ length: numParams }, (_, i) => `p${i}`).join(', ')}) as ${returnType} | undefined;\n`;
        } else {
            code += `    return stmt.get() as ${returnType} | undefined;\n`;
        }
        code += '}\n\n';
    } else if (query.type === 'many') {
        const resultType = inferQueryResultType(query.sql, tables);
        const returnType = resultType ? resultType.type : 'any';

        code += `export async function ${query.name}(db: DatabaseSync${params ? ', ' + params : ''}): Promise<${returnType}[]> {\n`;
        code += `    const stmt = db.prepare(\`${query.sql}\`);\n`;
        if (numParams > 0) {
            code += `    return stmt.all(${Array.from({ length: numParams }, (_, i) => `p${i}`).join(', ')}) as ${returnType}[];\n`;
        } else {
            code += `    return stmt.all() as ${returnType}[];\n`;
        }
        code += '}\n\n';
    }

    return code;
}

async function generate(schemaPath: string, outputPath: string): Promise<void> {
    const sql = fs.readFileSync(schemaPath, 'utf8');
    const { tables, queries } = parseSchema(sql);

    let output = '// Auto-generated by gen2.ts\n';
    output += 'import { DatabaseSync } from "node:sqlite";\n\n';

    // Generate table interfaces
    for (const table of tables) {
        output += generateTableInterface(table);
    }

    // Generate query functions
    for (const query of queries) {
        output += generateQuery(query, tables);
    }

    fs.writeFileSync(outputPath, output);
    console.log(`Generated ${outputPath}`);
}

const schemaPath = process.argv[2] || 'schema.sql';
const outputPath = process.argv[3] || 'db-bindings2.ts';

await generate(schemaPath, outputPath);
