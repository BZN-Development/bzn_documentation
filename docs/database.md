# Saving and the database

## Two kinds of data

| | Examples | How it is written |
| --- | --- | --- |
| **Critical** | money, memberships, ownership, roles | at once, in its own transaction, by the module that owns it |
| **Running** | positions, statuses, unpaid salary | through the save system: batched, only what changed, spread over time |

Critical data is never delayed: when `accounts.debit` returns, the money is gone in the
database. Running data may lose at most one save interval on a crash (5 minutes by
default), which is the price for not writing every few seconds.

## The save system

A store is registered with a flush function. Code marks keys (usually character ids) as
dirty when their data changes; the save system writes them later.

```lua
bzn.save.register('mydata', function(charIds)
    local rows = {}
    for _, charId in ipairs(charIds) do rows[#rows + 1] = { charId, myData[charId] } end
    -- Write all of them in ONE statement (see below).
    saveMany(rows)
end, { characterKeyed = true })

-- whenever something changes:
bzn.save.mark('mydata', charId)
```

- **Only changed keys** are written, and many changes to one key between saves become one
  write.
- **Staggered**: every `save.tick` seconds a slice of the keys is flushed, so the load is
  spread instead of one spike every `save.interval`.
- **Character-keyed** stores are flushed for a character when it unloads, before
  `character:unloaded`, so logout always saves.
- **Shutdown** (txAdmin restart, `stop bzn_core`) unloads every character and flushes
  everything.

Rules for a flush function:

- Write all keys in **one statement** or one `MySQL.transaction`. On resource stop nothing can
  be awaited, and only the first database call is guaranteed to reach oxmysql.
- Raise an error on failure: the keys are marked dirty again and retried.
- A store registered from another resource is removed when that resource stops. Call
  `bzn.save.flushOwn()` in your `onResourceStop` to write what is pending first.

Server API: `save.register(name, flush, opts)`, `save.mark(name, key)`,
`save.flushKey(name, key)`, `save.flushOwn(reason?)`. `bzn save` in the console flushes
everything now.

## Migrations

Every module, and any resource using bzn, owns its tables and creates them with a list of
numbered steps. The version reached is stored in `bzn_meta` (`schema:<owner>`), so each step
runs exactly once per database.

```lua
-- server, in your resource. The owner is your resource's name (or pass one as 2nd argument).
bzn.onReady(function()
    local ok = bzn.db.migrate({
        -- 1
        [[CREATE TABLE IF NOT EXISTS `mybank_cards` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `account_id` INT UNSIGNED NOT NULL,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci]],
        -- 2
        [[ALTER TABLE `mybank_cards` ADD COLUMN IF NOT EXISTS `pin` CHAR(4) NULL]],
    })
    if not ok then return print('database not ready, not starting') end
end)
```

Rules:

- **Only ever append.** A step that has shipped is never edited or removed; fix mistakes
  with a new step.
- A step is a SQL string, a list of SQL strings, or a function (for data changes that need
  Lua; it may use `MySQL.*.await`).
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` works on both MariaDB and MySQL (bzn checks
  `information_schema` itself, since MySQL lacks that syntax).
- MySQL commits `CREATE`/`ALTER` immediately, so a step with several statements can be
  half-applied if one fails. Keep steps small and use `IF NOT EXISTS`.
- If a step fails, the owner stays at the last good version, nothing after it runs, and a
  bzn module with a failed migration does not start.

## Conventions

- Tables are prefixed `bzn_` (core and modules) or with your resource's name.
- In bzn_core, SQL lives only in `store.lua` files; the rest of the code calls the store.
- Values are always passed as parameters (`?`), never put into the SQL string.
- Money columns are `BIGINT`; amounts are whole numbers everywhere.
