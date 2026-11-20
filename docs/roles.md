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

## Server

### roles.get

A player's staff role.

```lua
bzn.roles.get(src)
```

- src: `integer`

**Returns**
- role?: `string` e.g. `'admin'`

```lua
local role = bzn.roles.get(source)   -- 'admin' or nil
```

### roles.has

Whether a player has a role at or above `minRole`.

```lua
bzn.roles.has(src, minRole)
```

- src: `integer`
- minRole: `string`

**Returns**
- `boolean`

```lua
RegisterNetEvent('myadmin:openMenu', function()
    if not bzn.roles.has(source, 'mod') then return end
    TriggerClientEvent('myadmin:menu', source)
end)
```

## Client

### roles.get

The local player's role, for UI.

```lua
bzn.roles.get()
```

**Returns**
- role?: `string`

```lua
bzn.hooks.on('role:changed', function(role)
    SendNUIMessage({ action = 'staff', role = role })
end)
```

### roles.has

```lua
bzn.roles.has(minRole)
```

- minRole: `string`

**Returns**
- `boolean`

```lua
if bzn.roles.has('mod') then
    showAdminButton()
end
```

## Hooks

- Server: `role:changed (userId, role, old, src)`
- Client: `role:changed (role)`

## Required permissions

Core needs to add and remove principals:

```cfg
add_ace resource.bzn_core command.add_principal allow
add_ace resource.bzn_core command.remove_principal allow
```
