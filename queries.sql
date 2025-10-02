-- @name createUsersTable
-- @count exec
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    age INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- @name getAllUsers
-- @count many
-- @returns id number
-- @returns name string
-- @returns email string
-- @returns age number
-- @returns created_at string
SELECT * FROM users;

-- @name insertUser
-- @count one
-- @param name string
-- @returns id number
INSERT INTO users (name)
VALUES (?)
RETURNING id;

-- @name getUserById
-- @count one
-- @param id number
-- @returns id number
-- @returns name string
-- @returns email string
-- @returns age number
SELECT id, name, email, age FROM users WHERE id = ?;

-- @name updateUserEmail
-- @count exec
-- @param email string
-- @param id number
UPDATE users SET email = ? WHERE id = ?;

-- @name deleteUser
-- @count exec
-- @param id number
DELETE FROM users WHERE id = ?;

-- @name getUsersByMinAge
-- @count many
-- @param minAge number
-- @returns id number
-- @returns name string
-- @returns age number
SELECT id, name, age FROM users WHERE age >= ?;

-- @name insertUserWithDetails
-- @count one
-- @param name string
-- @param email string
-- @param age number
-- @returns id number
-- @returns name string
-- @returns email string
INSERT INTO users (name, email, age)
VALUES (?, ?, ?)
RETURNING id, name, email;

-- @name countUsers
-- @count one
-- @returns count number
SELECT COUNT(*) as count FROM users;