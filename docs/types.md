# Types

Tables that bzn functions take and return. Other pages link here.

## Character

The loaded character of a player. Server: `bzn.characters.get(src)`. Client: `bzn.character.get()`.

```lua
{
    id = 12,                 -- character id
    userId = 3,              -- the user (person) it belongs to
    firstName = 'Ada',
    lastName = 'Larsen',
    birthdate = '1994-03-02',
    sex = 'f',               -- 'm' | 'f'
    createdAt = 1763650000,  -- unix time
    lastPlayed = 1763660000, -- unix time or nil
    position = { x, y, z, heading },         -- last open-world position, or nil
    instance = { x, y, z, heading, bucket }, -- set if it unloaded inside an instance
    starterGiven = true,
}
```

## Player

A connected player. Server: `bzn.players.get(src)`.

```lua
{
    source = 1,
    userId = 3,
    license = 'license:abc...',
    name = 'BenZoN',
    state = 'loaded',   -- 'identified' | 'selecting' | 'loaded' | 'unloading'
}
```

## Group

Server: `bzn.groups.get(name)`.

```lua
{
    name = 'police',
    label = 'Police',
    type = 'job',
    paidBy = 'city',   -- 'city' | 'account' (the group's own setting, or its type's default)
    grades = {
        [0] = { label = 'Cadet', salary = 500, permissions = {} },
        [2] = { label = 'Chief', salary = 1200, permissions = { 'owner' } },
    },
}
```

`salary` is the amount per hour on duty (see [payroll](modules/payroll/)).

## Memberships

`{ [groupName] = grade }`, e.g. `{ police = 2, mechanic = 0 }`.

## Account

Server: `bzn.accounts.get(id)`.

```lua
{
    id = 7,
    number = '4821-093317',
    type = 'personal',          -- 'personal' | 'shared' | 'group'
    label = 'Personal account',
    balance = 1250,             -- whole number
    frozen = false,
    frozenReason = nil,
    ownerCharacterId = 12,      -- personal and shared accounts
    groupName = nil,            -- group accounts
}
```

## ClientAccount

An account as the local player sees it. Client: `bzn.accounts.getAll()`.

```lua
{
    id = 7, number = '4821-093317', type = 'shared', label = 'Family savings',
    balance = 1250, frozen = false,
    permissions = { 'view', 'deposit' },   -- what the local player may do
}
```

## AccountPermission

`'view'` | `'deposit'` | `'withdraw'` | `'transfer'` | `'manage'` (manage includes all).

## TxInfo

Optional last argument of money functions.

```lua
{
    type = 'purchase',       -- shown on the statement (default: the function's name)
    reason = '24/7 Strawberry',
    actor = 'admin:Ben',     -- who did it (default: 'char:<id>' or the calling resource)
    charId = 12,             -- act as this character: its permission is checked
    allowFrozen = false,     -- trusted callers only: take money from a frozen account
}
```

## Transaction

A statement line. Server: `bzn.accounts.transactions(id)`.

```lua
{
    id = 5512,
    amount = -200,           -- negative = money out
    balance_after = 1050,
    type = 'purchase',
    reason = '24/7 Strawberry',
    actor = 'char:12',
    counterparty_id = nil,   -- the other account of a transfer
    created_at = 1763660000, -- unix time
}
```

## SpawnPoint

Returned by a [spawn provider](spawn.md).

```lua
{
    x = 215.8, y = -810.2, z = 30.7,
    heading = 160.0,   -- optional
    bucket = 0,        -- optional routing bucket
    model = nil,       -- optional ped model
}
```

## Error strings

Functions that can fail return `false, '<error>'`. Errors are short strings for code (not
for players), listed on each function. Before-hooks can add their own.
