# Inventory (ox_inventory)

bzn has no inventory of its own: ox_inventory is the inventory. bzn_core ships a bridge so
ox_inventory knows about bzn's characters, groups, cash and food.

## Installing the bridge

ox_inventory loads framework bridges from its own folder:

1. Copy `bzn_core/bridges/ox_inventory/` to `ox_inventory/modules/bridge/bzn/`
   (so you get `modules/bridge/bzn/server.lua` and `client.lua`).
2. Set the framework:

   ```cfg
   setr inventory:framework "bzn"
   ```

3. Start ox_inventory **after** bzn_core.
4. Copy the bridge again after every ox_inventory update (updates replace
   `modules/bridge/`). bzn_core warns at startup if the copy is missing or outdated.

## What the bridge does

- **Characters**: a character gets its inventory when it loads (stored in
  `bzn_characters.inventory`, keyed by character id). On logout, disconnect or shutdown,
  ox_inventory saves and removes it.
- **Groups**: ox_inventory sees the character's groups (for shops, stashes and items
  limited to a job), kept up to date as grades change.
- **Restarts**: restarting ox_inventory while characters are loaded gives them their
  inventories again.

## Cash

Cash is the item `money` (accounts config `cashItem`). Use the
[accounts](modules/accounts/index.md#cash) functions (`addCash`, `removeCash`, `pay`), not raw
`AddItem`, so the `accounts:cash` hook fires and payments follow the same rules everywhere.

## Food and drink

Write the effect on the item, in points (0-100), in `data/items.lua`:

```lua
['burger'] = {
    label = 'Burger',
    weight = 220,
    server = { status = { hunger = 20 } },
    client = { anim = 'eating', prop = 'burger', usetime = 2500 },
},
```

See [Status](modules/status/index.md#food-and-drink).

## Starter items

`characters.starterItems` in `bzn_config/server/characters.lua` gives a new character items
once, on its first load:

```lua
return {
    starterItems = {
        { 'phone', 1 },
        { 'water', 2 },
    },
}
```
