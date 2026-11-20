# Using bzn from your resource

This section is for anyone writing a resource that uses bzn: a job, a shop, a HUD, a
phone app. It has three parts:

- **This page**: setting up, and what is the same on both sides.
- **[Server](server.md)**: where the data and the decisions are.
- **[Client](client.md)**: what the local player can see, and how to ask the server to act.

## Server or client?

The most important thing to understand first:

| | Server | Client |
| --- | --- | --- |
| Sees | every player and every character, online or offline | only the local player |
| Decides | yes: money, groups, items, statuses change here | no: everything here is for showing things |
| Trust | trusted | never trusted; a cheater can change anything on their client |
| Typical code | job logic, payments, permission checks, saving | HUD, menus, markers, animations, input |

The same names exist on both sides where it makes sense, but they are **different
functions**:

```lua
-- server: any character, by id
bzn.groups.has(charId, 'police', 2)

-- client: always the local player, no id
bzn.groups.has('police', 2)
```

A check on the client is only for the UI (show the armory button or not). The server must
check again before it does anything.

## Setting up

Add the import to your `fxmanifest.lua`:

```lua
shared_script '@bzn_core/init.lua'
dependency 'bzn_core'
```

You now have a global `bzn` on both sides. `bzn.<namespace>.<function>(...)` calls
bzn_core's export `<namespace>.<function>` on the same side:

```lua
local character = bzn.characters.get(source)
```

The import resolves the export on every call, so restarting bzn_core never leaves your
resource holding dead references. Without the import you can call exports directly, with
`nil` as the first argument:

```lua
exports.bzn_core['accounts.balance'](nil, accountId)
```

## Waiting for core

bzn_core is ready once its database, migrations and modules are up. If your resource needs
it when it starts:

```lua
bzn.onReady(function()
    -- core and every module are ready here
end)
```

`GlobalState['bzn:ready']` is `true` while core is running, on both sides.

## Ids

| Id | What | Changes |
| --- | --- | --- |
| **Server id** (`source`, `src`) | the player's current connection | every time they join |
| **User id** | the person, one per Rockstar license | never; staff roles live here |
| **Character id** (`charId`) | one character of a user | never; groups, accounts, statuses and positions belong here |

On the server, store things by **character id**, never by server id: a server id is reused
by the next player who joins.

## Return values

Functions that can fail return `ok, err` (or `ok, result`):

```lua
local ok, err = bzn.groups.add(charId, 'police', 0)
if not ok then
    print('could not add:', err)   -- 'limit_reached', 'conflict', 'already_member', ...
end
```

Errors are short strings meant for code, not for players. Each module's page lists them.

## Hooks

Hooks work the same on both sides, but are local to their side: a server hook never fires
on a client.

```lua
bzn.hooks.on('character:loaded', function(...) end)
```

Handlers from your resource are removed when it stops. Tables passed to your handler are
copies. Every hook: [server](../hooks/server.md) and [client](../hooks/client.md).

## Exports by side

| Namespace | Server | Client | Docs |
| --- | :---: | :---: | --- |
| `characters`, `players` | ✓ | | [Players and characters](../characters.md) |
| `character` | | ✓ | [Players and characters](../characters.md) |
| `spawn` | ✓ | | [Spawning](../spawn.md) |
| `roles` | ✓ | ✓ | [Staff roles](../roles.md) |
| `hooks`, `config` | ✓ | ✓ | [Hooks](../hooks/index.md), [Configuration](../config.md) |
| `core` | ✓ | ✓ | `core.version()`, `core.isReady()` |
| `modules` | ✓ | | `modules.list()`: every module and its status |
| `save`, `db` | ✓ | | [Saving and the database](../database.md) |
| `groups` | ✓ | ✓ | [Groups](../modules/groups.md) |
| `accounts` | ✓ | ✓ | [Accounts](../modules/accounts.md) |
| `payroll` | ✓ | | [Payroll](../modules/payroll.md) |
| `status` | ✓ | ✓ | [Status](../modules/status.md) |

Next: **[Server](server.md)** or **[Client](client.md)**.
