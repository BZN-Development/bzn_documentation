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
- **Staggered**: the players are split into slices that are saved one after another,
  instead of everyone at once (see below).
- **Character-keyed** stores are flushed for a character when it unloads, before
  `character:unloaded`, so logout always saves.
- **Shutdown** (txAdmin restart, `stop bzn_core`) unloads every character and flushes
  everything.

### Interval and tick

Two settings control when running data is written:

- **`save.interval`** (300 s): how often **each character** is saved. This is also the most
  that can be lost on a crash.
- **`save.tick`** (30 s): how often the save system **wakes up**.

Saving everyone at once every 5 minutes would put a spike on the database: with 200
players, 200 positions and 600 statuses in the same second. Instead, the players are split
into `interval / tick` slices (300 / 30 = **10 slices**), and every tick saves one slice:

```
00:00  slice 0   about 20 players
00:30  slice 1   about 20 players
01:00  slice 2   about 20 players
...
04:30  slice 9   about 20 players
05:00  slice 0   again
```

Every player is still saved once per 5 minutes, but the database gets 20 small writes every
30 seconds (each slice is one query per store) instead of 200 at once. A character always
lands in the same slice (by its id), and only characters whose data changed are written.

| If you want | Change |
| --- | --- |
| less lost on a crash | lower `interval` (more writes) |
| an even smoother load | lower `tick` (more, smaller slices) |
| fewer writes on a big server | raise `interval` |

Logout, disconnect and shutdown always save the character at once, whatever the slice.

Rules for a flush function:

- Write all keys in **one statement** or one `MySQL.transaction`. On resource stop nothing can
  be awaited, and only the first database call is guaranteed to reach oxmysql.
- Raise an error on failure: the keys are marked dirty again and retried.
- A store registered from another resource is removed when that resource stops. Call
  `bzn.save.flushOwn()` in your `onResourceStop` to write what is pending first.

`bzn save` in the console flushes everything now.

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

## API (server)

### save.register

Registers a save store. Registering the same name again replaces the function and keeps the
pending keys.

```lua
bzn.save.register(name, flush, opts?)
```

- name: `string`
- flush: `function(keys: any[])` writes the given keys, in one statement
- opts?: `table`
  - characterKeyed?: `boolean` keys are character ids; flushed when a character unloads

```lua
local notes = {}   -- charId -> text

bzn.save.register('mynotes', function(charIds)
    local rows = {}
    for _, charId in ipairs(charIds) do
        rows[#rows + 1] = { charId, notes[charId] or '' }
    end
    MySQL.prepare.await('INSERT INTO mynotes (character_id, text) VALUES (?, ?) ON DUPLICATE KEY UPDATE text = VALUES(text)', rows)
end, { characterKeyed = true })
```

### save.mark

Marks a key as changed. It is written in its slice of the next save cycle.

```lua
bzn.save.mark(name, key)
```

```lua
notes[charId] = text
bzn.save.mark('mynotes', charId)
```

### save.flushKey

Writes one key now.

```lua
bzn.save.flushKey(name, key)
```

**Returns**
- ok: `boolean`

```lua
bzn.save.flushKey('mynotes', charId)   -- write this one now
```

### save.flushOwn

Writes everything pending in your resource's stores now. Call it in your
`onResourceStop`.

```lua
bzn.save.flushOwn(reason?)
```

```lua
AddEventHandler('onResourceStop', function(resource)
    if resource == GetCurrentResourceName() then bzn.save.flushOwn() end
end)
```

### db.migrate

Brings your tables up to date with numbered steps. The owner is your resource's name.

```lua
bzn.db.migrate(steps, owner?)
```

- steps: `(string | string[] | function)[]`
- owner?: `string` default: your resource's name

**Returns**
- ok: `boolean` false if a step failed (your resource should not start)

```lua
bzn.onReady(function()
    local ok = bzn.db.migrate({
        [[CREATE TABLE IF NOT EXISTS `mynotes` (
            `character_id` INT UNSIGNED NOT NULL,
            `text` TEXT NOT NULL,
            PRIMARY KEY (`character_id`)
        )]],
    })
end)
```

## Conventions

- Tables are prefixed `bzn_` (core and modules) or with your resource's name.
- In bzn_core, SQL lives only in `store.lua` files; the rest of the code calls the store.
- Values are always passed as parameters (`?`), never put into the SQL string.
- Money columns are `BIGINT`; amounts are whole numbers everywhere.
