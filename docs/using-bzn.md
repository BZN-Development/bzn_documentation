# Using bzn from your resource

## The import

Add the import to your `fxmanifest.lua`:

```lua
shared_script '@bzn_core/init.lua'
dependency 'bzn_core'
```

You now have a global `bzn`. Every call `bzn.<namespace>.<function>(...)` calls bzn_core's
export `<namespace>.<function>`:

```lua
local character = bzn.characters.get(source)
local ok, balance = bzn.accounts.credit(accountId, 500, { type = 'reward', reason = 'Delivery' })
```

The import is a thin proxy. It resolves the export on every call, so restarting bzn_core
never leaves your resource holding dead references. You can also call the exports
directly, with `nil` as the first argument:

```lua
exports.bzn_core['accounts.balance'](nil, accountId)
```

## Waiting for core

bzn_core is ready once its database, migrations and modules are up. If your resource needs
it at start:

```lua
bzn.onReady(function()
    -- core and every module are ready here
end)
```

`GlobalState['bzn:ready']` is `true` while core is running, on server and client.

## Server and client

The same names exist on both sides where it makes sense, but they are different functions:

| | Server | Client |
| --- | --- | --- |
| Who | any character, by server id or character id | only the local player |
| Trust | decides | for UI only; the server checks again |
| Example | `bzn.groups.has(charId, 'police', 2)` | `bzn.groups.has('police', 2)` |

The client never receives other players' data: no group memberships, balances or statuses
of anyone else.

## Ids

- **Server id** (`source`, `src`): the player's current connection. Changes every join.
- **User id**: the person (one per Rockstar license). Staff roles live here.
- **Character id** (`charId`): one character of a user. Groups, accounts, statuses and
  positions belong to the character.

`bzn.characters.get(src)` gives the loaded character of a player (with `id`), and
`bzn.characters.getSource(charId)` the server id of a loaded character.

## Return values

Functions that can fail return `ok, err` (or `ok, result`):

```lua
local ok, err = bzn.groups.add(charId, 'police', 0)
if not ok then
    print('could not add:', err)  -- 'limit_reached', 'conflict', 'already_member', ...
end
```

Errors are short machine-readable strings. Each function's possible errors are listed in
its module's docs.

## Hooks from other resources

`bzn.hooks.on` works from any resource:

```lua
bzn.hooks.on('character:loaded', function(src, character)
    print(character.firstName .. ' is in')
end)
```

Handlers from your resource are removed automatically when it stops. Tables passed to a
handler in another resource are copies: changing them does not change core's data. See
[Hooks](hooks.md).

## Exports overview

| Namespace | Side | Docs |
| --- | --- | --- |
| `characters`, `players` | server | [Players and characters](characters.md) |
| `character` | client | [Players and characters](characters.md) |
| `spawn` | server | [Spawning](spawn.md) |
| `roles` | both | [Staff roles](roles.md) |
| `hooks`, `config`, `modules`, `core` | both | [Hooks](hooks.md), [Configuration](config.md) |
| `save`, `db` | server | [Saving and the database](database.md) |
| `groups` | both | [Groups](modules/groups.md) |
| `accounts` | both | [Accounts](modules/accounts.md) |
| `payroll` | server | [Payroll](modules/payroll.md) |
| `status` | both | [Status](modules/status.md) |

`bzn.core.version()` returns the bzn_core version, `bzn.core.isReady()` whether it is
ready, and (server) `bzn.modules.list()` every module with its status (`started`,
`disabled`, `failed: <reason>`).
