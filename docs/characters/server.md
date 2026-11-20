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

### create

Creates a character for a player's user. Only while the player is in selection.

```lua
bzn.characters.create(src, data)
```

- src: `integer`
- data: `table`
  - firstName: `string`
  - lastName: `string`
  - birthdate: `string` `'YYYY-MM-DD'`
  - sex: `'m'` | `'f'`

**Returns**
- ok: `boolean`
- idOrErr: `integer` the new character id, or `'not_found'` | `'wrong_state'` | `'invalid_first_name'` | `'invalid_last_name'` | `'invalid_birthdate'` | `'invalid_sex'` | `'limit_reached'` | hook reason

```lua
local ok, id = bzn.characters.create(src, {
    firstName = 'Ada', lastName = 'Larsen', birthdate = '1994-03-02', sex = 'f',
})
```

### delete

Soft-deletes one of a player's characters. Only while the player is in selection.

```lua
bzn.characters.delete(src, charId)
```

- src: `integer`
- charId: `integer`

**Returns**
- ok: `boolean`
- err?: `string`

```lua
local ok, err = bzn.characters.delete(src, charId)
```

### select

Loads one of a player's characters.

```lua
bzn.characters.select(src, charId)
```

- src: `integer`
- charId: `integer`

**Returns**
- ok: `boolean`
- err?: `string`

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

