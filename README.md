# sqlite-gen

Generate type-safe TypeScript functions from annotated SQL for `node:sqlite` and Cloudflare D1.

## Usage

```bash
npx @pdv/sqlite-gen queries.sql queries.gen.ts [node|d1]
```

## Examples

**Create table:**
```sql
-- @name createUsersTable
-- @count exec
CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);
```

**Insert with RETURNING:**
```sql
-- @name insertUser
-- @count one
-- @param name string
-- @returns id number
INSERT INTO users (name) VALUES (?) RETURNING id;
```

**Select query:**
```sql
-- @name getAllUsers
-- @count many
-- @returns id number
-- @returns name string
SELECT id, name FROM users;
```

**Generated code:**
```typescript
export function insertUser(db: DatabaseSync, name: string): { id: number } | undefined {
  const stmt = db.prepare(insertUser_sql);
  return stmt.get(name) as { id: number } | undefined;
}
```

**Using generated functions:**
```typescript
import { DatabaseSync } from 'node:sqlite';
import { createUsersTable, insertUser, getAllUsers } from './queries.gen.js';

const db = new DatabaseSync(':memory:');
createUsersTable(db);
insertUser(db, 'Alice');
const users = getAllUsers(db);
```

## Requirements

Node.js 22.5.0+ (for `node:sqlite` support)

## License

ISC
