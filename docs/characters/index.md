# Players and characters

- **[Server](server.md)**: characters, players, selection.
- **[Client](client.md)**: the local player's character.

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

## Slots

Every user has `characters.slots.base` slots (default 3). Staff give extra slots with
`bzn slots add`, from the server console too, so a web store such as Tebex can do it after a
purchase. Nobody goes over `characters.slots.max`, not even with extra slots.

A user with more characters than slots (slots were removed, a character was restored)
keeps all of them; they just cannot create new ones. Characters are never locked because of
slots.

## Identity and CPR

A new character needs a first name, a last name, a birthdate and a sex. Height and
nationality are each `'required'`, `'optional'` or off (config `identity`). Everything is
checked on the server, whatever a selector UI sends: letters only (æøå and other accents
are fine), the configured lengths and age range, a name blacklist and optionally unique
names. Names are capitalised.

Every character gets a **CPR number** from core: `DDMMYY-ABCS`

| Part | |
| --- | --- |
| `DDMMYY` | the birthdate |
| `AB` | random |
| `C` | check digit |
| `S` | odd for male, even for female |

The ten digits, multiplied by the weights `3 7 9 3 7 9 3 7 1 9` and added up, give a sum that
is divisible by 10. Every weight is coprime with 10, so a single mistyped digit is always
caught. That leaves 500 numbers per birthdate and sex; a number is never given twice, not
even after a character is deleted. If a birthdate runs out, `create` returns
`'cpr_exhausted'` and the player picks another date.

```lua
local ok, sex, birthdate = bzn.identity.validateCpr('240394-1276') -- true, 'f', '1994-03-24'
```

Use it wherever a CPR is typed in (police computer, ID card, bank). It reads the sex and
the birthdate back from the number. The century is not in the number, so the one giving an
age between 0 and 99 is used.

## Freezing

Staff freeze a character with a reason (`bzn char freeze <charId> <reason>`). A frozen
character cannot be played; a selector shows it with the reason. If it is being played, the
player is sent back to selection. `bzn char unfreeze` lifts it.

## Deleting

What happens when a player deletes a character depends on `characters.deletion`:

- `'request'` (default): the character is marked and cannot be played while it waits. The
  player can take the request back. Online staff are told, and approve or deny it with
  `bzn char deletions`, `bzn char approve` and `bzn char deny`.
- `'direct'`: deleted at once.
- `false`: players cannot delete characters.

Deleting is always soft: the row stays (money, logs and vehicles keep pointing at it), and
`bzn char restore` brings it back.

## Character selection

Core does not include a selection UI ([bzn_multichar](../addons/multichar.md) is the
first-party one). Without one, it loads the user's most recently played
character, or creates a placeholder (`characters.devCharacter`), so a server works out of
the box.

A selector resource (multicharacter UI) takes over like this:

```lua
-- server
bzn.onReady(function()
    bzn.characters.useSelector()
end)

bzn.hooks.on('character:selecting', function(src)
    TriggerClientEvent('myselector:open', src, bzn.characters.selection(src))
end)

-- Staff changed something while the player is choosing.
bzn.hooks.on('character:selectionChanged', function(src)
    TriggerClientEvent('myselector:refresh', src, bzn.characters.selection(src))
end)

RegisterNetEvent('myselector:play', function(charId)
    local ok, err = bzn.characters.select(source, charId)
end)
```

`selection` gives the characters with a `preview` (filled by modules: `groups`, `bank`,
`cash`), the [slots](../types.md#slots) and the deletion mode. Add your own preview field:

```lua
-- one call per selection list, with every character id
bzn.characters.registerPreview('house', function(charIds)
    local out = {}
    for _, charId in ipairs(charIds) do
        out[charId] = houses.labelOf(charId) -- your own lookup; nil = nothing to show
    end
    return out
end)
```

Without a selector, core skips frozen characters and ones waiting for deletion.

When the selector resource stops, core waits `characters.selectorGrace` seconds (10) for
one to register again, as on a restart: players who were choosing then get
`character:selecting` again and the UI reopens. If none comes back, core picks a character
for them, so nobody is left in selection without a UI.
`bzn.characters.releaseSelector()` hands it back without stopping.

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

## Hooks

[Server hooks](../hooks/server.md#characters) · [Client hooks](../hooks/client.md#character)
