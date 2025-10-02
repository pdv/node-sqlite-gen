# sqlite-gen

Generate TypeScript from annotated SQL. Supports `node:sqlite` and Cloudflare D1

## Usage

```bash
npx @pdv/sqlite-gen queries.sql queries.gen.ts [node|d1]
```

## Examples

```sql
-- @name createUsersTable
-- @count exec
CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);

-- @name insertUser
-- @count one
-- @param name string
-- @returns id number
INSERT INTO users (name) VALUES (?) RETURNING id;

-- @name getAllUsers
-- @count many
-- @returns id number
-- @returns name string
SELECT id, name FROM users;
```

**Node**
```typescript
import { DatabaseSync } from 'node:sqlite';
import { createUsersTable, insertUser, getAllUsers } from './queries.gen.js';

const db = new DatabaseSync(':memory:');
createUsersTable(db);
insertUser(db, 'Alice');
const users = getAllUsers(db);
```

**Cloudflare Workers**
```typescript
import { createUsersTable, insertUser, getAllUsers } from './queries.gen.js';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    await createUsersTable(env.DB);
    const newUser = await insertUser(env.DB, 'Alice');
    const users = await getAllUsers(env.DB);
    return Response.json({ newUser, users });
  }
}
```

## Requirements

- Node.js 22.5.0+ (for `node:sqlite` support)
- Cloudflare Workers (for D1 support)

## See Also

- [sqldelight](https://github.com/sqldelight/sqldelight) (Kotlin)
- [sqlc](https://github.com/sqlc-dev/sqlc) (Go)
- [SQLx](https://github.com/launchbadge/sqlx) (Rust)
- [PgTyped](https://github.com/adelsz/pgtyped) (TypeScript/PostgreSQL)

## License

ISC
