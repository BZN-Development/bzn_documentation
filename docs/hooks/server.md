# Server hooks

Every hook bzn fires on the server. **Before** marks a before-hook: return `false, 'reason'`
to stop the action. `src` is the server id, or `nil` when the character is offline.

## Core

### `core:ready`

bzn_core and every module have started. Most resources use `bzn.onReady(fn)` instead.

### `module:started`

`(name)` A bzn module started.

## Players

### `player:beforeConnect` <Badge text="before" />

`(src, { name, identifiers })` A player is connecting (deferrals). Return `false, 'message'`
to refuse: the message is shown to the player. Bans and whitelists go here.

```lua
bzn.hooks.on('player:beforeConnect', function(src, info)
    if isBanned(info.identifiers.license) then
        return false, 'You are banned from this server.'
    end
end)
```

### `player:identified`

`(src, player)` The player joined and has a user id (`player.userId`).

### `player:stateChanged`

`(src, state, from)` States: `identified`, `selecting`, `loaded`, `unloading`.

### `player:dropping`

`(src, player, reason)` The player is leaving and still registered. Their character
unloads after this.

### `player:dropped`

`(src, player, reason)` The player is gone.

## Characters

### `character:beforeCreate` <Badge text="before" />

`(src, data)` A character is about to be created. `data` = `{ firstName, lastName, birthdate, sex }`.

### `character:created`

`(src, character)`

### `character:beforeDelete` <Badge text="before" />

`(src, character)`

### `character:deleted`

`(src, character)` Soft-deleted.

### `character:selecting`

`(src)` The player is in character selection. A selector resource shows its UI here.

### `character:loading` <Badge text="before" />

`(src, character)` The character is loading. Modules load their data here. Returning
`false` stops the load.

### `character:loaded`

`(src, character)` Everything is loaded and the character is about to spawn. The usual
place to set up your own data.

```lua
bzn.hooks.on('character:loaded', function(src, character)
    myData[character.id] = loadFromDb(character.id)
end)
```

### `character:starter`

`(src, character)` The character's first load: the starter kit is being given. Add your own
part here; it runs once per character, ever.

```lua
bzn.hooks.on('character:starter', function(src, character)
    exports.ox_inventory:AddItem(src, 'phone', 1)
end)
```

### `character:unloading`

`(src, character, reason)` The character is leaving: `logout`, `dropped` or `shutdown`.
**Save and clean up here**; the character is still loaded.

### `character:unloaded`

`(src, character, reason)` The character is gone. Forget anything you kept in memory.

## Spawning

### `spawn:beforeSpawn` <Badge text="before" />

`(src, character, point)` About to spawn. Changing `point` in place works only from inside
bzn_core; from another resource, register a [spawn provider](../spawn.md) instead.

### `spawn:spawned`

`(src, character, point)` The client confirmed the spawn.

## Staff roles

### `role:changed`

`(userId, role, old, src)` A user's role changed. `role` or `old` is `nil` for no role.

## Groups

### `groups:beforeAdd` <Badge text="before" />

`(charId, name, grade)` Someone is about to join a group.

### `groups:added`

`(charId, name, grade, src)`

### `groups:beforeSetGrade` <Badge text="before" />

`(charId, name, grade, old)`

### `groups:gradeChanged`

`(charId, name, grade, old, src)`

### `groups:beforeRemove` <Badge text="before" />

`(charId, name, grade)`

### `groups:removed`

`(charId, name, grade, src)`

### `groups:beforeDuty` <Badge text="before" />

`(charId, name, previous)` Going on duty in `name`, or off duty when `name` is `nil`.

```lua
bzn.hooks.on('groups:beforeDuty', function(charId, name)
    if name == 'police' and not hasPoliceVehicleNearby(charId) then
        return false, 'go_to_the_station'
    end
end)
```

### `groups:dutyChanged`

`(charId, name, previous, src)` `name` is `nil` when going off duty.

### `groups:beforeCreate` <Badge text="before" />

`(name, def)` A group is about to be created in game.

### `groups:created`

`(name)`

### `groups:updated`

`(name, field, loadedMembers)` A group was edited. `field`: `label`, `grade`, `grades`,
`permissions` or `paidBy`. `loadedMembers` lists the online character ids affected.

### `groups:deleted`

`(name)`

## Accounts

### `accounts:beforeTransaction` <Badge text="before" />

`(data)` Money is about to move. `data.kind` is `credit`, `debit`, `transfer` or
`creditMany`; also `amount`, `account` (or `from`/`to`, or `rows`), `entry` and `charId`
when a character acts.

```lua
bzn.hooks.on('accounts:beforeTransaction', function(data)
    if data.kind == 'transfer' and data.amount > 100000 and data.charId then
        return false, 'needs_bank_approval'
    end
end)
```

### `accounts:transaction`

`(data)` Money moved (after the database committed). Same fields, plus the new balances.

### `accounts:created`

`(account)` A new account.

### `accounts:changed`

`(accountId, action, detail)` A non-money change: `member_set`, `member_removed`, `frozen`,
`unfrozen`, `renamed`, `closed`.

### `accounts:cash`

`({ source, charId, amount, entry })` Cash given (`amount` > 0) or taken (< 0).

## Payroll

### `payroll:paid`

`(charId, group, amount, paidBy)` Salary reached a character's account. `paidBy` is `city` or
`account`.

## Status

### `status:changed`

`(charId, name, value, reason)` A status was set or added to (eating, an admin). Not fired
for the slow change over time.

### `status:empty`

`(charId, name)` A status reached 0.

```lua
bzn.hooks.on('status:empty', function(charId, name)
    if name == 'thirst' then
        local src = bzn.characters.getSource(charId)
        TriggerClientEvent('ox_lib:notify', src, { description = 'You are very thirsty' })
    end
end)
```

### `status:recovered`

`(charId, name)` A status left 0 again.
