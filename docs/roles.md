# Staff roles

A staff role belongs to the **user** (the person, by Rockstar license), not to a character.
It follows the person to every character and never has to be given again when they make a
new one.

## Roles

Configured in `bzn_config/server/roles.lua`, lowest first. Each role includes every role
below it.

```lua
return {
    list = {
        { name = 'mod', label = 'Moderator' },
        { name = 'admin', label = 'Admin', principals = { 'group.admin' } },
        { name = 'senioradmin', label = 'Senior Admin' },
        { name = 'dev', label = 'Developer' },
    },
}
```

Players get the ACE principal `bzn.role.<role>`. Core chains them, so `bzn.role.dev`
inherits `bzn.role.senioradmin` and so on down. `principals` adds extra parents: with
`group.admin` on `admin`, every admin and above is also in `group.admin`, which txAdmin,
ox_lib and most scripts understand.

Use ACE in your own resources:

```cfg
add_ace bzn.role.mod command.kick allow
```

## Commands

From the server console, or in game for staff:

```
bzn role list
bzn role set <server id|user:<id>> <role>
bzn role remove <server id|user:<id>>
```

In game, a staff member can only give or remove roles **below their own** rank, and only
on users below their own rank. The console can do anything.

## API

| Side | Function | |
| --- | --- | --- |
| server | `roles.get(src)` | the player's role or nil |
| server | `roles.has(src, minRole)` | role at or above `minRole` |
| client | `roles.get()` | the local player's role (for UI) |
| client | `roles.has(minRole)` | |

Hooks: `role:changed (userId, role, old, src)` on the server, `role:changed (role)` on the
client.

## Required permissions

Core needs to add and remove principals:

```cfg
add_ace resource.bzn_core command.add_principal allow
add_ace resource.bzn_core command.remove_principal allow
```
