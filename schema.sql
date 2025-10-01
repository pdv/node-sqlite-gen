-- @name createUsersTable
-- @count exec
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY,
    name TEXT NOT NULL
);

-- @name getAllUsers
-- @count many
-- @returns name string
-- @returns age number
SELECT * FROM users;

-- @name insertUser
-- @count one
-- @param name string
-- @returns id number
INSERT INTO users (name)
VALUES (?)
RETURNING (id);