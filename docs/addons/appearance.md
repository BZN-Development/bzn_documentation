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

## Shops

`Config.shops` places the shops (blip per type, and `[E]` when a player stands at one). A
shop is the editor with only its own tabs. Everything goes in a **cart** (the bag at the top
right) and is paid once, in cash or from the bank (bzn_core's `accounts.pay`). With
`payTo = '<group>'` the money goes to that group's account; otherwise it leaves the economy.
The server works the bill out itself, so a client cannot change what it pays.

**Clothing shops** (`type = 'clothing'`): what the player wears and does not own is in the
cart; **+ Cart** keeps a piece in it while they try the next one on (e.g. one top in three
colours, up to `Config.maxCart`). After paying, everything in the cart is owned. Price of a
piece, in order:

1. a price set on it with `/clothing_set` (for one colour, or the whole piece),
2. its slot's price in `Config.prices`, times its pack's multiplier in `Config.prices.collections`.

Owned clothing is free to wear again (`Config.ownedFree`). Hidden clothing
(`/clothing_set <slot> hidden on`) is skipped in the creator and the shops and cannot be
newly put on; staff in `/appearance` see everything.

**Barbers** (`type = 'barber'`): hair, beard, eyebrows, makeup and the other overlays. The
price is per change (`Config.barberPrices`): a new hairstyle, new hair colours, and each
overlay that changed.

## Photos

The shops and the creator show a photo of each piece of clothing and a photo grid per slot.
The photos are made by the staff tool **bzn_photos** (start it only when you take photos) and
saved in `thumbnails/` as WebP. bzn_appearance serves them over the server's own HTTP
endpoint (`http://<server>/bzn_appearance/thumb/<file>.webp`), so a player only downloads the
photos they look at, and new photos work without a restart. Clothing without a photo shows
its number.

## Commands

| Command | Who | What |
| --- | --- | --- |
| `/reloadskin` | everyone | a fresh ped with the saved look; health and armour are kept (cooldown `Config.reloadCooldown`, not in vehicles, combat, water or while falling) |
| `/appearance [id]` | `group.admin` | opens the free editor for a player (default: yourself) |
| `/appearance_scan` | `group.admin` | reads every clothing pack on your client and stores it as the catalog |
| `/clothing_info` | `group.admin` | pack, drawable, texture, price and shop data of everything you wear (chat and F8) |
| `/clothing_set <slot> <price\|label\|hidden> <value> [texture]` | `group.admin` | shop data of what you wear in a slot (`11`, or `p0` for props); `clear` removes a price or label; `texture` sets only the colour you wear |
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
