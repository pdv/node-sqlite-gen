import * as http from "node:http";
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db.sqlite");

const init = db.prepare(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT
)
`);

init.run();

const insert = db.prepare(`
INSERT INTO users (name) VALUES (?)
`);

const select = db.prepare("SELECT * FROM users");

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    if (req.method === "POST") {
        const name = url.searchParams.get("name");
        insert.run(name);
        res.end("OK");
    } else {
        const users = select.all();
        res.end(JSON.stringify(users));
    }
});

server.on("close", () => {
    db.close();
});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});
