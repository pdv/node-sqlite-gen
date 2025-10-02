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
    prepareCreateUsersTable,
    prepareGetAllUsers,
    prepareInsertUser,
    prepareGetUserById,
} from "./queries.gen";

test("basic insert and select - prepare version", () => {
    const db = new DatabaseSync(":memory:");
    const createTable = prepareCreateUsersTable(db);
    createTable();

    const insert = prepareInsertUser(db);
    const result1 = insert({ name: "Alice" });
    const result2 = insert({ name: "Bob" });

    assert.ok(result1?.id);
    assert.ok(result2?.id);

    const getAll = prepareGetAllUsers(db);
    const users = getAll().map((user) => user.name);
    assert.deepEqual(users, ["Alice", "Bob"]);
});

test("basic insert and select - one-shot version", () => {
    const db = new DatabaseSync(":memory:");
    createUsersTable(db);

    const result1 = insertUser(db, { name: "Alice" });
    const result2 = insertUser(db, { name: "Bob" });

    assert.ok(result1?.id);
    assert.ok(result2?.id);

    const users = getAllUsers(db).map((user) => user.name);
    assert.deepEqual(users, ["Alice", "Bob"]);
});

test("get user by id - prepare version", () => {
    const db = new DatabaseSync(":memory:");
    prepareCreateUsersTable(db)();

    const insert = prepareInsertUser(db);
    const inserted = insert({ name: "Charlie" });
    assert.ok(inserted?.id);

    const getById = prepareGetUserById(db);
    const user = getById({ id: inserted.id });
    assert.strictEqual(user?.name, "Charlie");
    assert.strictEqual(user?.id, inserted.id);

    const notFound = getById({ id: 9999 });
    assert.strictEqual(notFound, undefined);
});

test("get user by id - one-shot version", () => {
    const db = new DatabaseSync(":memory:");
    createUsersTable(db);

    const inserted = insertUser(db, { name: "Charlie" });
    assert.ok(inserted?.id);

    const user = getUserById(db, { id: inserted.id });
    assert.strictEqual(user?.name, "Charlie");
    assert.strictEqual(user?.id, inserted.id);

    const notFound = getUserById(db, { id: 9999 });
    assert.strictEqual(notFound, undefined);
});

test("update user email - one-shot version", () => {
    const db = new DatabaseSync(":memory:");
    createUsersTable(db);

    const inserted = insertUser(db, { name: "Diana" });
    assert.ok(inserted?.id);

    updateUserEmail(db, { email: "diana@example.com", id: inserted.id });

    const user = getUserById(db, { id: inserted.id });
    assert.strictEqual(user?.email, "diana@example.com");
});

test("delete user - one-shot version", () => {
    const db = new DatabaseSync(":memory:");
    createUsersTable(db);

    const inserted = insertUser(db, { name: "Eve" });
    assert.ok(inserted?.id);

    deleteUser(db, { id: inserted.id });

    const user = getUserById(db, { id: inserted.id });
    assert.strictEqual(user, undefined);
});

test("filter users by min age - one-shot version", () => {
    const db = new DatabaseSync(":memory:");
    createUsersTable(db);

    insertUserWithDetails(db, { name: "Young", email: "young@example.com", age: 20 });
    insertUserWithDetails(db, { name: "Middle", email: "middle@example.com", age: 35 });
    insertUserWithDetails(db, { name: "Old", email: "old@example.com", age: 50 });

    const users = getUsersByMinAge(db, { minAge: 30 });
    assert.strictEqual(users.length, 2);
    assert.deepEqual(users.map(u => u.name).sort(), ["Middle", "Old"]);
});

test("insert with multiple params and returns - one-shot version", () => {
    const db = new DatabaseSync(":memory:");
    createUsersTable(db);

    const result = insertUserWithDetails(db, { name: "Frank", email: "frank@example.com", age: 42 });

    assert.ok(result?.id);
    assert.strictEqual(result?.name, "Frank");
    assert.strictEqual(result?.email, "frank@example.com");
});

test("count users - one-shot version", () => {
    const db = new DatabaseSync(":memory:");
    createUsersTable(db);

    const initial = countUsers(db);
    assert.strictEqual(initial?.count, 0);

    insertUser(db, { name: "User1" });
    insertUser(db, { name: "User2" });
    insertUser(db, { name: "User3" });

    const final = countUsers(db);
    assert.strictEqual(final?.count, 3);
});
