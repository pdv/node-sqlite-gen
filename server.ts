import * as http from "node:http";
import { DatabaseSync } from "node:sqlite";
import { prepare } from "./db-utils";
import { getAllUsers, getUserById, insertUser, reset } from "./queries";

const db = new DatabaseSync("db.sqlite");
prepare(db, reset)({});
const queries = {
    insertUser: prepare(db, insertUser),
    getUserById: prepare(db, getUserById),
    getAllUsers: prepare(db, getAllUsers),
};

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    if (req.method === "POST") {
        const name = url.searchParams.get("name") ?? "<no name>";
        const { id } = queries.insertUser({ name, age: 99 })[0];
        res.end(id.toString());
    } else {
        const users = queries.getAllUsers({});
        res.end(JSON.stringify(users));
    }
});

server.on("close", () => {
    // db.close();
});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});
