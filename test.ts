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
    const createTable = createUsersTable(db);
    createTable();

    const insert = insertUser(db);
    const result1 = insert({ name: "Alice" });
    const result2 = insert({ name: "Bob" });

    assert.ok(result1?.id);
    assert.ok(result2?.id);

    const getAll = getAllUsers(db);
    const users = getAll().map((user) => user.name);
    assert.deepEqual(users, ["Alice", "Bob"]);
});

test("get user by id", () => {
    const db = new DatabaseSync(":memory:");
    createUsersTable(db)();

    const insert = insertUser(db);
    const inserted = insert({ name: "Charlie" });
    assert.ok(inserted?.id);

    const getById = getUserById(db);
    const user = getById({ id: inserted.id });
    assert.strictEqual(user?.name, "Charlie");
    assert.strictEqual(user?.id, inserted.id);

    const notFound = getById({ id: 9999 });
    assert.strictEqual(notFound, undefined);
});

test("update user email", () => {
    const db = new DatabaseSync(":memory:");
    createUsersTable(db)();

    const insert = insertUser(db);
    const inserted = insert({ name: "Diana" });
    assert.ok(inserted?.id);

    const updateEmail = updateUserEmail(db);
    updateEmail({ email: "diana@example.com", id: inserted.id });

    const getById = getUserById(db);
    const user = getById({ id: inserted.id });
    assert.strictEqual(user?.email, "diana@example.com");
});

test("delete user", () => {
    const db = new DatabaseSync(":memory:");
    createUsersTable(db)();

    const insert = insertUser(db);
    const inserted = insert({ name: "Eve" });
    assert.ok(inserted?.id);

    const del = deleteUser(db);
    del({ id: inserted.id });

    const getById = getUserById(db);
    const user = getById({ id: inserted.id });
    assert.strictEqual(user, undefined);
});

test("filter users by min age", () => {
    const db = new DatabaseSync(":memory:");
    createUsersTable(db)();

    const insertWithDetails = insertUserWithDetails(db);
    insertWithDetails({ name: "Young", email: "young@example.com", age: 20 });
    insertWithDetails({ name: "Middle", email: "middle@example.com", age: 35 });
    insertWithDetails({ name: "Old", email: "old@example.com", age: 50 });

    const getByMinAge = getUsersByMinAge(db);
    const users = getByMinAge({ minAge: 30 });
    assert.strictEqual(users.length, 2);
    assert.deepEqual(users.map(u => u.name).sort(), ["Middle", "Old"]);
});

test("insert with multiple params and returns", () => {
    const db = new DatabaseSync(":memory:");
    createUsersTable(db)();

    const insertWithDetails = insertUserWithDetails(db);
    const result = insertWithDetails({ name: "Frank", email: "frank@example.com", age: 42 });

    assert.ok(result?.id);
    assert.strictEqual(result?.name, "Frank");
    assert.strictEqual(result?.email, "frank@example.com");
});

test("count users", () => {
    const db = new DatabaseSync(":memory:");
    createUsersTable(db)();

    const count = countUsers(db);
    const initial = count();
    assert.strictEqual(initial?.count, 0);

    const insert = insertUser(db);
    insert({ name: "User1" });
    insert({ name: "User2" });
    insert({ name: "User3" });

    const final = count();
    assert.strictEqual(final?.count, 3);
});
