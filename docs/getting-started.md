# Getting started

## 1. Install the resources

Put these in your `resources` folder:

| Resource | Where to get it |
| --- | --- |
| `oxmysql` | overextended/oxmysql |
| `ox_lib` | overextended/ox_lib |
| `ox_inventory` | overextended/ox_inventory |
| `bzn_core` | this repository |
| `bzn_config` | copy `bzn_core/templates/bzn_config` and rename it |

`bzn_config` is yours. It holds only the settings you change, so updating `bzn_core` never
touches it. See [Configuration](config.md).

## 2. Database

bzn uses the oxmysql connection string as usual:

```cfg
set mysql_connection_string "mysql://user:password@localhost/database?charset=utf8mb4"
```

You do not create any tables yourself. On start, core and every module migrate their own
tables (all prefixed `bzn_`). The version each one reached is kept in `bzn_meta`.

## 3. Start order

Order matters: dependencies first, then the config, then core, then anything that uses core.

```cfg
ensure oxmysql
ensure ox_lib

ensure bzn_config
ensure bzn_core

ensure ox_inventory
# your bzn_* resources and scripts after this
```

Do not start `spawnmanager`, `mapmanager` or `basic-gamemode`: bzn_core handles spawning.

## 4. Permissions

bzn gives players ACE principals for their groups and staff roles, so core must be allowed
to add and remove principals:

```cfg
add_ace resource.bzn_core command.add_principal allow
add_ace resource.bzn_core command.remove_principal allow
```

Without these lines core still starts, but logs a warning and players get no group or
role principals.

Staff commands (`bzn ...`) are protected by the ACE `command.bzn`. Admins get it through
`group.admin`, which the `admin` role inherits:

```cfg
add_ace group.admin command allow
```

## 5. Inventory bridge

ox_inventory loads framework bridges from its own folder:

1. Copy `bzn_core/bridges/ox_inventory/` to `ox_inventory/modules/bridge/bzn/`.
2. Set `setr inventory:framework "bzn"`.
3. Copy it again after every ox_inventory update.

Core warns at startup if the copy is missing or older than the one in bzn_core. More in
[Inventory](inventory.md).

## 6. First admin

Join the server, then in the server console:

```
bzn role set <your server id> dev
```

Roles are stored on your user (your Rockstar license), so you keep it on every character.
See [Staff roles](roles.md).

## 7. Check it works

The server console should show something like:

```
[bzn:modules] started 4 module(s): groups, accounts, payroll, status
[bzn:core] bzn_core 0.1.0 ready
```

`bzn modules` lists every module and whether it started. With no character selection
resource installed, core picks your most recent character, or makes a placeholder one
(config `characters.devCharacter`), so you can play right away.

## Development

- `setr bzn:debug 1` turns on debug logging and some debug-only commands (such as
  `bzn payroll tick`).
- Every config option can be read with `bzn config <section>`.
