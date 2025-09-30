import sqlparser from "node-sql-parser";
import * as fs from "node:fs";

async function generate(path: string): Promise<void> {
    const sql = fs.readFileSync(path, "utf8");
    const parser = new sqlparser.Parser();
    const ast = parser.parse(sql);
    console.log(JSON.stringify(ast));
}

await generate(process.argv[2]);
