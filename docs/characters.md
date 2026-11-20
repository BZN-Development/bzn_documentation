# Players and characters

## The lifecycle

```
connecting ──> identified ──> selecting ──> loaded ──> unloading ──> selecting (logout)
                                                              └────> dropped (disconnect)
```

1. **Connecting.** Core reads the player's identifiers in deferrals, requires a Rockstar
   license (and anything in `players.requiredIdentifiers`), runs `player:beforeConnect`
   (bans and whitelists go there) and creates or updates the **user**.
2. **Identified.** The player has a server id and a user id; staff roles are applied.
3. **Selecting.** The client is ready. If a selector resource is registered, it shows the
   characters; otherwise core picks one (see below).
4. **Loaded.** `character:loading` lets every module load its data (groups, accounts,
   statuses), then `character:loaded` fires and the character spawns.
5. **Unloading.** On logout, disconnect or shutdown, `character:unloading` lets modules save,
   core writes everything the character has unsaved, then `character:unloaded` fires.

A user is a person (one per Rockstar license); a character belongs to a user. Staff roles
are on the user, everything else on the character.

## Character selection

Core does not include a selection UI. Without one, it loads the user's most recently played
character, or creates a placeholder (`characters.devCharacter`), so a server works out of
the box.

A selector resource (multicharacter UI) takes over like this:

```lua
-- server
bzn.onReady(function()
    bzn.characters.useSelector()
end)

bzn.hooks.on('character:selecting', function(src)
    local list = bzn.characters.list(src)
    TriggerClientEvent('myselector:open', src, list)
end)

RegisterNetEvent('myselector:play', function(charId)
    local ok, err = bzn.characters.select(source, charId)
end)
```

When the selector resource stops, selection becomes automatic again.
`bzn.characters.releaseSelector()` hands it back without stopping.

## Server API

| Function | Returns | |
| --- | --- | --- |
| `characters.get(src)` | `character?` | the loaded character of a player |
| `characters.getSource(charId)` | `src?` | server id of a loaded character |
| `characters.list(src)` | `character[]` | the user's characters (for a selector) |
| `characters.create(src, data)` | `ok, idOrErr` | `data = { firstName, lastName, birthdate = 'YYYY-MM-DD', sex = 'm'\|'f' }`; only while selecting |
| `characters.delete(src, charId)` | `ok, err` | soft delete; only while selecting |
| `characters.select(src, charId)` | `ok, err` | load a character |
| `characters.logout(src)` | `ok, err` | back to selection; errors `not_loaded`, `cooldown` |
| `characters.useSelector()` | | this resource handles selection |
| `characters.releaseSelector()` | | hand selection back to core |
| `players.get(src)` | `player?` | `{ source, userId, license, name, state }` |
| `players.getByUserId(userId)` | `player?` | the online player of a user |

Create errors: `invalid_first_name`, `invalid_last_name`, `invalid_birthdate`,
`invalid_sex`, `limit_reached`, `wrong_state`, or a reason from `character:beforeCreate`.

A character:

```lua
{
    id = 12, userId = 3,
    firstName = 'Ada', lastName = 'Larsen', birthdate = '1994-03-02', sex = 'f',
    createdAt = 1763650000, lastPlayed = 1763660000,  -- unix time
    position = { x, y, z, heading },                  -- last open-world position
    instance = { x, y, z, heading, bucket },          -- set if it unloaded inside an instance
    starterGiven = true,
}
```

## Client API

```lua
local character = bzn.character.get()   -- nil while selecting
```

## Logout

`/logout` (config `characters.logoutCommand`) sends the player back to selection. Every
module saves first, the inventory is closed and saved, and the player is not left in a
half-loaded state. There is a cooldown (`characters.logoutCooldown`) so it cannot be
spammed.

## Starter kit

A new character gets its starter kit once, on its first load:

- bank balance: `accounts.startingBalance` (set when the character is created)
- cash: `accounts.startingCash`
- items: `characters.starterItems`, e.g. `{ { 'phone', 1 }, { 'water', 2 } }`

The kit is claimed in the database (`bzn_characters.starter_given`) before anything is
given, so it can never be given twice, not on a crash or a quick relog. Your own resource
can add to it:

```lua
bzn.hooks.on('character:starter', function(src, character)
    exports.ox_inventory:AddItem(src, 'id_card', 1, { name = character.firstName .. ' ' .. character.lastName })
end)
```

Characters that existed before the starter kit was added count as already given.
