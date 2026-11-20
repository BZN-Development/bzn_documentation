# Configuration

Every option has a default in bzn_core. Your server only writes what it changes, in the
separate resource `bzn_config`. Updating bzn_core never overwrites your settings, and new
options added in an update work without you touching anything.

## Where settings come from

From lowest to highest priority:

1. **Defaults** in bzn_core (core files and each module's `module.lua`)
2. **`bzn_config/shared/<section>.lua`**: loaded on the server *and sent to clients*
3. **`bzn_config/server/<section>.lua`**: server only, never sent to clients
4. **Convars** `bzn:<section>:<option>`: top-level numbers, strings and booleans only

Each file returns a table with overrides for one section:

```lua
-- bzn_config/server/accounts.lua
return {
    startingBalance = 5000,
    startingCash = 500,
}
```

```cfg
# server.cfg: wins over the files
setr bzn:payroll:interval 15
setr bzn:example:enabled true
```

## How overrides merge

- Tables are merged key by key, so you can change one value deep inside a table:

  ```lua
  -- bzn_config/shared/status.lua: only thirst changes
  return { statuses = { thirst = { perMinute = -2.0 } } }
  ```

- **Lists are replaced**, not merged: `starterItems = { { 'water', 2 } }` replaces the whole
  default list.
- An option that does not exist is reported at startup (`unknown option ... (typo?)`), so
  misspelt settings do not fail silently.

## Shared or server?

Every section has shared options (needed by clients, such as status rates for the HUD) and
server-only options. Put an option in the folder that matches where its default lives; the
tables below say which. Never put secrets (webhooks, keys) in `shared/`: it is sent to every
player.

## Inspecting

`bzn config <section>` in the server console prints the merged result of a section.

## Turning a module off

Every module has an `enabled` option:

```lua
-- bzn_config/shared/payroll.lua
return { enabled = false }
```

A module whose dependency is off does not start either (`bzn modules` shows why).

## Sections

### Core

| Section | Option | Default | Side | |
| --- | --- | --- | --- | --- |
| `players` | `requiredIdentifiers` | `{ 'license' }` | server | identifiers a player must have to join, e.g. `{ 'license', 'discord' }` |
| | `duplicateLicense` | `false` | server | allow the same license twice at once |
| | `joinTimeout` | `300` | server | seconds a connection may take to finish joining |
| `characters` | `nameMin`, `nameMax` | `2`, `24` | shared | name length |
| | `minAge`, `maxAge` | `18`, `90` | shared | age range from the birthdate |
| | `maxPerUser` | `3` | server | characters per user |
| | `devCharacter` | `true` | server | without a selector resource, create a placeholder character |
| | `logoutCommand` | `'logout'` | server | command to go back to selection, `false` to disable |
| | `logoutCooldown` | `10` | server | seconds between logouts |
| | `starterItems` | `{}` | server | items a new character gets once: `{ { 'phone', 1 }, ... }` |
| `spawn` | `defaults` | airport | server | default spawn points (the first is used) |
| | `saveDistance` | `10.0` | server | metres moved before the position is written again |
| | `instanceSpawn` | `'world'` | server | after unloading in an instance: `'world'`, `'position'` or `'instance'` |
| | `minWorldZ` | `-20.0` | server | below this a position is not saved (fell through the map) |
| | `saveDelay` | `5` | server | seconds after spawning before positions are saved |
| | `models` | freemode m/f | server | ped model per sex until an appearance resource sets one |
| `roles` | `list` | mod, admin, senioradmin, dev | server | staff roles, lowest first ([Staff roles](roles.md)) |
| `save` | `interval` | `300` | server | how often each character's running data (position, status) is saved; also the most that can be lost on a crash |
| | `tick` | `30` | server | how often the save system wakes up; each time it saves only a slice of the players ([how](database.md#interval-and-tick)) |

### Modules

Module options are listed in each module's page:
[groups](modules/groups/index.md#config), [accounts](modules/accounts/index.md#config),
[payroll](modules/payroll/index.md#config), [status](modules/status/index.md#config),
[vehicles](modules/vehicles/index.md#config).

## Language

Language is not a bzn setting. bzn uses ox_lib's locale system, so the whole server has one
language convar:

```cfg
setr ox:locale "en"
```
