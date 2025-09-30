CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY,
    name TEXT NOT NULL
);

-- name: GetUser :one
SELECT * FROM users;

-- name: CreateUser :exec
INSERT INTO users (name)
VALUES (?);