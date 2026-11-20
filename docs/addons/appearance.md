# bzn_appearance

The look of a character: the creator a new character goes through before its first spawn,
and (in later versions) the clothing shop, barber, surgeon and wardrobe.

Repository: [BZN-Development/bzn_appearance](https://github.com/BZN-Development/bzn_appearance)

```cfg
ensure bzn_core
ensure ox_inventory
ensure bzn_appearance
ensure bzn_multichar
```

## Clothing that never moves

GTA numbers clothing in one long list across every pack. Add a pack and the numbers after
it shift, so outfits saved by number turn into other clothes. bzn_appearance saves clothing
by **collection** (the pack's name, `''` for the base game) and the drawable's **local
index** inside it, using FiveM's collection natives:

```json
{ "11": { "c": "police_pack", "d": 12, "t": 2 } }
```

Adding packs never changes that. Two rules keep it true:

1. Add new clothing as a new pack, or at the **end** of an existing one. Never insert in
   the middle: that shifts the local indices after it.
2. Do not rename a pack. If you move or merge clothing yourself, add a remap (below).

Clothing that is gone (a removed pack) is skipped and the base item is worn instead; the
saved look is kept, so it comes back with the pack.

## The creator

A character without a saved look (new, or made before bzn_appearance was installed) is held
back before its first spawn: it gets the creator in GTA Online's creator room, alone in its
own routing bucket. When it saves, it spawns as usual. Turn this off with
`Config.requireCreator = false`.

## Commands

| Command | Who | What |
| --- | --- | --- |
| `/reloadskin` | everyone | a fresh ped with the saved look; health and armour are kept (cooldown `Config.reloadCooldown`, not in vehicles, combat, water or while falling) |
| `/appearance [id]` | `group.admin` | opens the free editor for a player (default: yourself) |
| `/appearance_scan` | `group.admin` | reads every clothing pack on your client and stores it as the catalog |
| `/appearance_remap model kind slot fromC fromD toC toD [textureOffset]` | `group.admin` | clothing moved to another pack; `-` is the base game |

Run `/appearance_scan` after adding or removing clothing packs. Until a model is scanned,
saved clothing is only checked for its format, not whether it exists.

## API

Server:

```lua
exports.bzn_appearance:get(charId)        -- saved look or nil
exports.bzn_appearance:openEditor(src)    -- free editor (staff tools)
AddEventHandler('bzn_appearance:saved', function(src, charId, data) end)
```

Client:

```lua
exports.bzn_appearance:apply(ped, data)   -- dress any ped (no waits)
exports.bzn_appearance:getOwn()           -- the player's saved look

-- `/reloadskin` gives the player a fresh ped (health, max health and armour are kept, so it
-- never heals). Set your own ped state again here (walk style, flags):
AddEventHandler('bzn_appearance:pedChanged', function(ped) end)
```

## Uses from bzn_core

- `spawn:beforeSpawn` holds the spawn back for the creator, `spawn.resume` lets it go on.
- `spawn:pedReady` dresses the ped before the fade-in.
- `characters.registerPreview('appearance', …)` gives selectors (bzn_multichar) each
  character's look.
