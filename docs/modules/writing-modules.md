# Writing a module

There are two ways to build on bzn:

- **A separate resource** that uses the [`bzn` import](../using-bzn/index.md). This is the normal
  way for anything with a UI or anything you share with others (a bank, a HUD, a job).
- **A module inside bzn_core**, like groups or accounts. For framework features that other
  code builds on. Modules share core's memory (no export calls between them), get config,
  migrations and a client side for free, and can be switched off in config.

This page is about the second.

## Layout

```
modules/<name>/
    module.lua             definition
    shared/init.lua        optional: runs on server and client first
    server/init.lua        optional: server entry, returns the module's API
    server/migrations.lua  optional: migration steps
    server/store.lua       recommended: the only file with SQL
    client/init.lua        optional: client entry, returns the module's API
```

Add the name to `modules/index.lua`. `modules/example` is a complete, disabled example.

## module.lua

```lua
return {
    name = 'garages',
    dependencies = { 'accounts' },   -- started first; if one is off or fails, this does not start

    config = {                       -- shared: sent to clients
        fee = 50,
    },
    serverConfig = {                 -- server only
        webhook = '',
    },
}
```

`enabled = true` is added automatically. Servers override any of it in
`bzn_config/shared/garages.lua` or `bzn_config/server/garages.lua`.

## Entries

```lua
-- server/init.lua
local garages = {}

local store = require 'modules.garages.server.store'
local cfg = bzn.config.get('garages')

function garages.park(charId, plate) ... end

---Runs once every module has loaded: other modules' APIs are available here.
function garages.start()
end

bzn.api.expose('garages.park', garages.park)  -- callable from other resources

return garages   -- becomes bzn.garages inside bzn_core
```

- The returned table becomes `bzn.<name>` inside bzn_core (shared and side entry merged).
- `bzn.api.expose('<name>.<fn>', fn)` makes a function available to other resources as
  `bzn.<name>.<fn>` through the import. Return plain data from exposed functions: tables
  are copied to the caller.
- A module name may not be one core already uses (`characters`, `spawn`, `roles`, ...).

## Migrations

`server/migrations.lua` returns the steps; core runs them before the module starts and
does not start it if one fails. See [Saving and the database](../database.md#migrations).

## Character data

The usual pattern for data that belongs to a character:

```lua
local data = {}   -- charId -> your data, only for loaded characters

bzn.hooks.on('character:loading', function(_, character)
    data[character.id] = store.load(character.id)
end)

bzn.hooks.on('character:unloaded', function(_, character)
    data[character.id] = nil
end)
```

For data that changes often, register a [save store](../database.md#the-save-system) with
`characterKeyed = true` and mark the character when it changes. For critical data (money,
ownership), write at once in a transaction instead.

## Talking to the client

Send each player only its own data, only when it changes:

```lua
TriggerClientEvent('bzn:client:garages', src, list)
```

Never use a state bag or broadcast for private data such as memberships or balances.

## Good habits in bzn

- No loops that poll: react to hooks, use anchors for values that change with time, and
  batch work into one tick when you must.
- Functions that can fail return `ok, err` with a short error string.
- Admin commands: `bzn.commands.register('garages', 'garages <list|...>', function(src, args, out) ... end)`
  gives you `bzn garages ...` with ACE, chat replies and an audit log.
- Code, comments and log messages in English.
