# Server

## Characters

### get

The loaded character of a player.

```lua
bzn.characters.get(src)
```

- src: `integer`

**Returns**
- character?: [`Character`](../types.md#character) nil while the player is in selection

```lua
local character = bzn.characters.get(source)
if not character then return end
```

### getSource

The server id of a loaded character.

```lua
bzn.characters.getSource(charId)
```

- charId: `integer`

**Returns**
- src?: `integer` nil if the character is not loaded

```lua
local src = bzn.characters.getSource(charId)
if src then
    TriggerClientEvent('ox_lib:notify', src, { description = 'Your car is ready' })
end
```

### list

The characters of a player's user, most recently played first. For a selector UI.

```lua
bzn.characters.list(src)
```

- src: `integer`

**Returns**
- characters?: [`Character[]`](../types.md#character)

```lua
for _, character in ipairs(bzn.characters.list(src) or {}) do
    print(character.id, character.firstName, character.lastName)
end
```

### selection

Everything a selector UI shows: the characters with previews, the slots and the deletion
mode.

```lua
bzn.characters.selection(src)
```

- src: `integer`

**Returns**
- selection?: [`Selection`](../types.md#selection)

### create

Creates a character for a player's user. Only while the player is in selection. Core
validates everything (see [Identity and CPR](index.md#identity-and-cpr)) and gives the
character its CPR number.

```lua
bzn.characters.create(src, data)
```

- src: `integer`
- data: `table`
  - firstName: `string`
  - lastName: `string`
  - birthdate: `string` `'YYYY-MM-DD'`
  - sex: `'m'` | `'f'`
  - height?: `integer` centimetres
  - nationality?: `string` one of the configured list

**Returns**
- ok: `boolean`
- idOrErr: `integer` the new character id, or `'not_found'` | `'wrong_state'` | `'limit_reached'` | `'name_taken'` | `'name_blacklisted'` | `'cpr_exhausted'` | `'invalid_first_name'` | `'invalid_last_name'` | `'invalid_birthdate'` | `'invalid_sex'` | `'invalid_height'` | `'invalid_nationality'` | `'failed'` | hook reason

```lua
local ok, id = bzn.characters.create(src, {
    firstName = 'Ada', lastName = 'Larsen', birthdate = '1994-03-02', sex = 'f', height = 172,
})
```

### delete

Deletes, or asks to delete, one of a player's characters (config `characters.deletion`).
Only while the player is in selection.

```lua
bzn.characters.delete(src, charId)
```

- src: `integer`
- charId: `integer`

**Returns**
- ok: `boolean`
- result: `'requested'` | `'deleted'` when ok, otherwise `'disabled'` | `'not_found'` | `'wrong_state'` | `'already_requested'` | hook reason

### cancelDelete

Takes back a deletion request. Only while the player is in selection.

```lua
bzn.characters.cancelDelete(src, charId)
```

**Returns**
- ok: `boolean`
- err?: `'not_found'` | `'wrong_state'` | `'not_requested'`

### select

Loads one of a player's characters.

```lua
bzn.characters.select(src, charId)
```

- src: `integer`
- charId: `integer`

**Returns**
- ok: `boolean`
- err?: `'not_found'` | `'wrong_state'` | `'already_loaded'` | `'frozen'` | `'delete_requested'` | hook reason

```lua
RegisterNetEvent('myselector:play', function(charId)
    local ok, err = bzn.characters.select(source, charId)
end)
```

### logout

Sends a player back to character selection, saving everything first.

```lua
bzn.characters.logout(src)
```

- src: `integer`

**Returns**
- ok: `boolean`
- err?: `'not_found'` | `'not_loaded'` | `'cooldown'`

```lua
RegisterCommand('switch', function(src)
    local ok, err = bzn.characters.logout(src)
    if err == 'cooldown' then
        TriggerClientEvent('ox_lib:notify', src, { description = 'Wait a moment' })
    end
end)
```

### registerPreview

Adds a field to `preview` on every character in [`selection`](#selection). `fn` gets every
character id of the list at once and returns `charId -> value`.

```lua
bzn.characters.registerPreview(key, fn)
```

- key: `string`
- fn: `fun(charIds: integer[]): table<integer, any>`

## Staff

These work online or offline. `by` is who did it, for the record.

| Function | Returns | |
| --- | --- | --- |
| `bzn.characters.find(charId)` | `Character?, deletedAt?` | any character, deleted ones included |
| `bzn.characters.listForUser(userId)` | `{ character, deletedAt }[]` | every character of a user |
| `bzn.characters.freeze(charId, reason, by)` | `ok, err?` | `'not_found'` \| `'invalid_reason'` |
| `bzn.characters.unfreeze(charId, by)` | `ok, err?` | `'not_frozen'` |
| `bzn.characters.deletionRequests()` | `{ character, userName }[]` | oldest first |
| `bzn.characters.approveDelete(charId, by)` | `ok, err?` | `'not_requested'` \| `'loaded'` \| hook reason |
| `bzn.characters.denyDelete(charId, by, reason?)` | `ok, err?` | `'not_requested'` |
| `bzn.characters.restore(charId, by)` | `ok, err?` | `'not_deleted'` |

## Slots

| Function | Returns | |
| --- | --- | --- |
| `bzn.slots.get(userId)` | [`Slots`](../types.md#slots) | |
| `bzn.slots.add(userId, amount, opts?)` | `ok, Slots \| err` | `'invalid_amount'` \| `'over_max'` \| `'not_found'` |
| `bzn.slots.remove(userId, amount, opts?)` | `ok, Slots \| err` | never below the base; `'no_extra_slots'` |
| `bzn.slots.history(userId)` | `{ amount, source, note, granted_by, granted_at }[]` | newest first |

`opts` = `{ source?, note?, by? }`.

```lua
-- e.g. a store webhook
local ok, slots = bzn.slots.add(userId, 1, { source = 'tebex', note = 'order 1234', by = 'store' })
```

## Identity

### identity.validateCpr

```lua
bzn.identity.validateCpr(cpr)
```

**Returns**
- ok: `boolean`
- sex?: `'m'` | `'f'`
- birthdate?: `string` `'YYYY-MM-DD'`

## Selection

### useSelector

Your resource handles character selection from now on: core emits `character:selecting`
and waits for you to call [`select`](#select). When your resource stops, selection becomes
automatic again.

```lua
bzn.characters.useSelector()
```

```lua
bzn.onReady(function()
    bzn.characters.useSelector()
end)

bzn.hooks.on('character:selecting', function(src)
    TriggerClientEvent('myselector:open', src, bzn.characters.list(src))
end)
```

### releaseSelector

Hands selection back to core without stopping your resource.

```lua
-- e.g. while your selector is under maintenance
bzn.characters.releaseSelector()
```

## Players

### players.get

A connected player.

```lua
bzn.players.get(src)
```

- src: `integer`

**Returns**
- player?: [`Player`](../types.md#player)

```lua
local player = bzn.players.get(src)
print(player.userId, player.name)
```

### players.getByUserId

The online player of a user.

```lua
bzn.players.getByUserId(userId)
```

- userId: `integer`

**Returns**
- player?: [`Player`](../types.md#player)

```lua
local player = bzn.players.getByUserId(userId)
if player then
    DropPlayer(player.source, 'Banned')
end
```

