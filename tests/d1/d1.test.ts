import { env } from "cloudflare:test";
import { describe, it, expect, beforeEach } from "vitest";
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
} from "./queries.gen.d1";

describe("D1 Database Tests", () => {
	beforeEach(async () => {
		// Clean slate - drop and recreate table
		await env.DB.exec("DROP TABLE IF EXISTS users");
		await createUsersTable(env.DB);
	});

	it("basic insert and select - prepare version", async () => {
		const insert = prepareInsertUser(env.DB);
		const result1 = await insert({ name: "Alice" });
		const result2 = await insert({ name: "Bob" });

		expect(result1?.id).toBeDefined();
		expect(result2?.id).toBeDefined();

		const getAll = prepareGetAllUsers(env.DB);
		const users = (await getAll()).map((user) => user.name);
		expect(users).toEqual(["Alice", "Bob"]);
	});

	it("basic insert and select - one-shot version", async () => {
		const result1 = await insertUser(env.DB, { name: "Alice" });
		const result2 = await insertUser(env.DB, { name: "Bob" });

		expect(result1?.id).toBeDefined();
		expect(result2?.id).toBeDefined();

		const users = (await getAllUsers(env.DB)).map((user) => user.name);
		expect(users).toEqual(["Alice", "Bob"]);
	});

	it("get user by id - prepare version", async () => {
		const insert = prepareInsertUser(env.DB);
		const inserted = await insert({ name: "Charlie" });
		expect(inserted?.id).toBeDefined();

		const getById = prepareGetUserById(env.DB);
		const user = await getById({ id: inserted!.id });
		expect(user?.name).toBe("Charlie");
		expect(user?.id).toBe(inserted!.id);

		const notFound = await getById({ id: 9999 });
		expect(notFound).toBeNull();
	});

	it("get user by id - one-shot version", async () => {
		const inserted = await insertUser(env.DB, { name: "Charlie" });
		expect(inserted?.id).toBeDefined();

		const user = await getUserById(env.DB, { id: inserted!.id });
		expect(user?.name).toBe("Charlie");
		expect(user?.id).toBe(inserted!.id);

		const notFound = await getUserById(env.DB, { id: 9999 });
		expect(notFound).toBeNull();
	});

	it("update user email - one-shot version", async () => {
		const inserted = await insertUser(env.DB, { name: "Diana" });
		expect(inserted?.id).toBeDefined();

		await updateUserEmail(env.DB, { email: "diana@example.com", id: inserted!.id });

		const user = await getUserById(env.DB, { id: inserted!.id });
		expect(user?.email).toBe("diana@example.com");
	});

	it("delete user - one-shot version", async () => {
		const inserted = await insertUser(env.DB, { name: "Eve" });
		expect(inserted?.id).toBeDefined();

		await deleteUser(env.DB, { id: inserted!.id });

		const user = await getUserById(env.DB, { id: inserted!.id });
		expect(user).toBeNull();
	});

	it("filter users by min age - one-shot version", async () => {
		await insertUserWithDetails(env.DB, { name: "Young", email: "young@example.com", age: 20 });
		await insertUserWithDetails(env.DB, { name: "Middle", email: "middle@example.com", age: 35 });
		await insertUserWithDetails(env.DB, { name: "Old", email: "old@example.com", age: 50 });

		const users = await getUsersByMinAge(env.DB, { minAge: 30 });
		expect(users.length).toBe(2);
		expect(users.map((u) => u.name).sort()).toEqual(["Middle", "Old"]);
	});

	it("insert with multiple params and returns - one-shot version", async () => {
		const result = await insertUserWithDetails(env.DB, {
			name: "Frank",
			email: "frank@example.com",
			age: 42,
		});

		expect(result?.id).toBeDefined();
		expect(result?.name).toBe("Frank");
		expect(result?.email).toBe("frank@example.com");
	});

	it("count users - one-shot version", async () => {
		const initial = await countUsers(env.DB);
		expect(initial?.count).toBe(0);

		await insertUser(env.DB, { name: "User1" });
		await insertUser(env.DB, { name: "User2" });
		await insertUser(env.DB, { name: "User3" });

		const final = await countUsers(env.DB);
		expect(final?.count).toBe(3);
	});
});
