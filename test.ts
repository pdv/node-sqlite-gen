import * as assert from "node:assert";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import {
    createUsersTable,
    getAllUsers,
    insertUser,
    getUserById,
    updateUserEmail,
    deleteUser,
    getUsersByMinAge,
    insertUserWithDetails,
    countUsers,
} from "./queries.gen";

test("basic insert and select", () => {
    const db = new DatabaseSync(":memory:");
    createUsersTable(db);

    const result1 = insertUser(db, "Alice");
    const result2 = insertUser(db, "Bob");

    assert.ok(result1?.id);
    assert.ok(result2?.id);

    const users = getAllUsers(db).map((user) => user.name);
    assert.deepEqual(users, ["Alice", "Bob"]);
});

test("get user by id", () => {
    const db = new DatabaseSync(":memory:");
    createUsersTable(db);

    const inserted = insertUser(db, "Charlie");
    assert.ok(inserted?.id);

    const user = getUserById(db, inserted.id);
    assert.strictEqual(user?.name, "Charlie");
    assert.strictEqual(user?.id, inserted.id);

    const notFound = getUserById(db, 9999);
    assert.strictEqual(notFound, undefined);
});

test("update user email", () => {
    const db = new DatabaseSync(":memory:");
    createUsersTable(db);

    const inserted = insertUser(db, "Diana");
    assert.ok(inserted?.id);

    updateUserEmail(db, "diana@example.com", inserted.id);

    const user = getUserById(db, inserted.id);
    assert.strictEqual(user?.email, "diana@example.com");
});

test("delete user", () => {
    const db = new DatabaseSync(":memory:");
    createUsersTable(db);

    const inserted = insertUser(db, "Eve");
    assert.ok(inserted?.id);

    deleteUser(db, inserted.id);

    const user = getUserById(db, inserted.id);
    assert.strictEqual(user, undefined);
});

test("filter users by min age", () => {
    const db = new DatabaseSync(":memory:");
    createUsersTable(db);

    insertUserWithDetails(db, "Young", "young@example.com", 20);
    insertUserWithDetails(db, "Middle", "middle@example.com", 35);
    insertUserWithDetails(db, "Old", "old@example.com", 50);

    const users = getUsersByMinAge(db, 30);
    assert.strictEqual(users.length, 2);
    assert.deepEqual(users.map(u => u.name).sort(), ["Middle", "Old"]);
});

test("insert with multiple params and returns", () => {
    const db = new DatabaseSync(":memory:");
    createUsersTable(db);

    const result = insertUserWithDetails(db, "Frank", "frank@example.com", 42);

    assert.ok(result?.id);
    assert.strictEqual(result?.name, "Frank");
    assert.strictEqual(result?.email, "frank@example.com");
});

test("count users", () => {
    const db = new DatabaseSync(":memory:");
    createUsersTable(db);

    const initial = countUsers(db);
    assert.strictEqual(initial?.count, 0);

    insertUser(db, "User1");
    insertUser(db, "User2");
    insertUser(db, "User3");

    const final = countUsers(db);
    assert.strictEqual(final?.count, 3);
});
