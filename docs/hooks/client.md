# Client hooks

Every hook bzn fires on the client. They are about the **local player only** and are meant
for UIs: update a HUD, open a menu, show a notification. There are no before-hooks on the
client; decisions are made on the server.

## Core

### `core:ready`

bzn_core has started on this client.

### `module:started`

`(name)` A bzn module started on this client.

## Character

### `character:selecting`

The player is in character selection. A selection UI opens here.

### `character:loaded`

`(character)` The local player's character loaded. `bzn.character.get()` returns it from
now on.

```lua
bzn.hooks.on('character:loaded', function(character)
    SendNUIMessage({ action = 'show', name = character.firstName .. ' ' .. character.lastName })
end)
```

### `character:unloaded`

`(reason)` The character left (`logout` or `shutdown`). Hide your UI.

## Spawning

### `spawn:spawned`

`(point)` The player spawned and the screen faded in.

## Staff role

### `role:changed`

`(role)` The local player's staff role changed (`nil` for none). Use it to show or hide
admin UI.

## Groups

### `groups:changed`

`(memberships, duty)` The local player's groups changed: `{ police = 2 }`, and the duty
group or `nil`.

### `groups:dutyChanged`

`(duty, previous)` On duty in `duty`, or off duty when `duty` is `nil`.

```lua
bzn.hooks.on('groups:dutyChanged', function(duty)
    SendNUIMessage({ action = 'duty', group = duty })
end)
```

## Accounts

### `accounts:changed`

`(accounts)` The list of accounts the player can see was sent again (on load, after joining
a group, after a membership or freeze change).

### `accounts:balance`

`(accountId, balance)` One balance changed.

```lua
bzn.hooks.on('accounts:balance', function(accountId, balance)
    local personal = bzn.accounts.getPersonal()
    if personal and accountId == personal.id then
        SendNUIMessage({ action = 'bank', value = balance })
    end
end)
```

## Status

### `status:changed`

`(name, value, rate)` A new anchor arrived: the player ate, a rate changed, or an admin set
it. Between these, read the current value with `bzn.status.get(name)`; it is computed from
the local clock.
