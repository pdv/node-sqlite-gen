import * as assert from "node:assert";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { createUsersTable, getAllUsers, insertUser } from "./queries.gen";

test("test", () => {
    const db = new DatabaseSync(":memory:");
    createUsersTable(db);
    insertUser(db, "Alice");
    insertUser(db, "Bob");
    const users = getAllUsers(db).map((user) => user.name);
    assert.deepEqual(users, ["Alice", "Bob"]);
});
