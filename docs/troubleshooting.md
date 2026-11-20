# Troubleshooting

Find the message from your server console below. Turn on more detail with
`setr bzn:debug 1`, and check every module with `bzn modules`.

## Startup

### `bzn_config not found, using defaults for everything`

`bzn_config` is missing or starts after bzn_core. Copy `bzn_core/templates/bzn_config` to
your resources and `ensure bzn_config` **before** `ensure bzn_core`.

### `core migrations failed; bzn_core will not start`

A database step failed. The line above it says which one and why:

```
[bzn:db] core migration step 4 failed, staying at version 3: <error>
```

Common causes: the database user lacks `CREATE`/`ALTER` rights, or the database is too old
(MySQL 8+ or MariaDB 10.5+ are required). Fix it and restart; bzn continues from the step
that failed.

### `<module> not started: dependency "<name>" is not running`

A module needs another module that is turned off or failed. `bzn modules` shows the status
of each. Turn the dependency back on (`enabled = true`) or turn this module off too.

### `unknown option <section>.<option> in <file> (typo?)`

A config file sets an option that does not exist, usually a typo or an option in the wrong
section. Compare with [Configuration](config.md); the option is ignored until fixed.

### `syntax error in shared/<section>.lua`

A Lua error in one of your `bzn_config` files. The message has the line. The whole file is
ignored until it is fixed.

### `roles cannot be applied: bzn_core may not change principals`

### `ACE principals are off: bzn_core may not change principals`

Add to your server config and restart:

```cfg
add_ace resource.bzn_core command.add_principal allow
add_ace resource.bzn_core command.remove_principal allow
```

### `ox_inventory bridge: ... Copy bzn_core/bridges/ox_inventory/ to ...`

The ox_inventory bridge is missing or older than the one in bzn_core (usually after an
ox_inventory update). Copy the folder again as the message says. See
[Inventory](inventory.md).

### `ox_inventory is installed but inventory:framework is "..."`

Set `setr inventory:framework "bzn"`.

## Joining

### "This server requires ..."

The player is missing an identifier in `players.requiredIdentifiers`, for example Discord
not running. The message tells them what to do.

### "This account is already connected to the server."

The same Rockstar license is already online. Allow it with `players.duplicateLicense = true`
(not recommended on a live server).

### Stuck on the loading screen

- A resource called `characters.useSelector()` but never calls `characters.select`. Stop
  it, or fix it; selection becomes automatic when it stops.
- `<name> has no characters and no selector is running`: the user has no characters and
  `characters.devCharacter` is off. Install a character selection resource or turn it on.

## In game

### `Access denied for command bzn`

The player lacks the ACE `command.bzn`. Give them a role from the console
(`bzn role set <id> admin`) and make sure `group.admin` has commands:

```cfg
add_ace group.admin command allow
```

### Spawned at the airport

The default spawn is used when:

- the character is new;
- its saved position was unusable (`saved position of character ... is not usable`):
  near `0, 0, 0` after a crash on join;
- the client found no ground at all (`no ground at ...`).

A position under the map is not a reason: the client moves the player up to the ground.
See [Spawning](spawn.md#crash-safety).

### Inventory empty or not loading

ox_inventory must start **after** bzn_core, and the bridge must be installed with
`inventory:framework "bzn"`.

### Salary not paid

- Is the character on duty? `bzn groups player <id>`.
- Does the grade have a salary? `bzn groups info <group>`.
- Is the group paid by its own account and out of money? `bzn payroll debts <group>` shows
  what it owes; it is paid as soon as the account has money.

### Food does nothing

The item needs `server = { status = { hunger = 20 } }` in ox_inventory's `items.lua`.
ox_inventory's own `client.status` is not used. See [Status](modules/status/#food-and-drink).

### A vehicle drops or sinks when it spawns

bzn spawns vehicles at the ground height a nearby client reports. With no player within
300 m, the given height is used: give garage spawn points at ground level.

### "refused opening trunk...: plate ... was shown by 2 vehicle(s)"

Another script gave a vehicle a plate an owned vehicle has. bzn gave that vehicle a new plate
and refused the one open; opening again shows the right trunk. Nothing leaked.

### A player cannot lock their own car

- `keyMode = 'item'`: the owner needs a key item too (`bzn vehicles keyitem <vehicle> <id>`).
- After `changelocks`, old keys no longer work.
- A group vehicle needs the grade permission `vehicle.use`.

## Getting help

When you ask for help, include:

- the console output from start to the problem, with `setr bzn:debug 1`;
- the output of `bzn modules`;
- your bzn_core version (top of `fxmanifest.lua`) and artifact version.
