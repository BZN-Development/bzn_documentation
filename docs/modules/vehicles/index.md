# Vehicles

Owned vehicles (by a character or a group): spawning, parking, plates and VINs, impound,
keys and locks. Garages, key UIs, dealerships and impound lots are separate resources that
use this API.

- **[Server](server.md)**: every function.
- **[Client](client.md)**: what the client does, and the state bags you can read.

## Identity

| | Changes? | Used for |
| --- | --- | --- |
| `id` | never | the database, ox_inventory (trunk and glovebox), scripts |
| `vin` | never (can be scratched off) | in game: a police check, stolen cars |
| `plate` | yes (re-registration) | what the vehicle is registered as |
| `fakePlate` | yes | shown on the vehicle instead of `plate` while set |

A VIN has 17 characters, like a real one. Scratching it off (`setVinScratched`) does not
delete it: `vinScratched` tells scripts not to show it, and staff can still find it.

A fake plate hides the real one. Looking a fake plate up (`getByPlate`) finds nothing, like
a real registry; taking it off shows the registered plate again.

## Spawning

- The **server spawns every owned vehicle** (OneSync, `CreateVehicleServerSetter`); a client
  never does. An owned vehicle exists **at most once** in the world.
- Vehicles spawn **at ground height**: a client near the spot is asked where the ground is,
  so the vehicle does not drop from the air. The client that ends up owning it settles it on
  its wheels (slopes).
- **No ambient peds**: GTA can put a random ped in a server-spawned vehicle; bzn removes any
  ped that is not a player right after the spawn.
- **Radio off**: the client that owns the vehicle turns it off when it appears, and again
  the first time a player gets in (config `radioOff`).
- `warp` puts a player straight into the driver's seat (done by that player's client once the
  vehicle exists there).

## Look and condition

A vehicle's ox_lib properties are two things:

| | What | Changed by |
| --- | --- | --- |
| **Look** | colours, mods (spoilers, engine, turbo, wheels), neon, tint, livery, extras | only `setProperties` (a tuning shop after payment, staff, scripts) |
| **Condition** | health, burst tyres, broken windows and doors, fuel, dirt | read when parking and while out; can only get worse; `repair` resets it |

What a client reports when parking is used **only** for condition. A player who mods their
car on their own client and parks it gets nothing saved. Health is read on the server, and
broken parts add up, so parking can never repair a car either: repairs go through `repair`.

## Saving while out

A vehicle left out in the world is saved:

| When | |
| --- | --- |
| the driver gets out | the client tells the server (ox_lib cache); the server reads the values itself |
| the owner logs out | every vehicle they own that is out |
| shutdown | everything, in one call |
| every save interval | the safety net (staggered) |

Saved: position, health, fuel (the `fuel` state bag fuel scripts set) and whether it is
locked. Never the look. An empty tank stays empty after a restart.

## Saved state bags

Other resources can keep their own data on a vehicle (mileage, dents, a tuning chip...) without
touching the database: they put it in an **entity state bag** and register it. bzn_core then
reads that state bag on the server in the **same writes** as position and fuel, stores it in
the vehicle's `data` column, and sets it again when the vehicle spawns.

```lua
-- in your resource (server)
bzn.onReady(function()
    bzn.vehicles.registerField('mileage')
    bzn.vehicles.registerField('deformation', { clearOnRepair = true })
end)
```

Or without code, in config:

```lua
-- bzn_config/server/vehicles.lua
return {
    savedStateBags = { deformation = { clearOnRepair = true } },
}
```

`clearOnRepair` clears the value when [`repair`](server.md#repair) is called. The saved values
are in `vehicle.data`. [bzn_vehicledata](../../addons/vehicledata.md) uses this for mileage and
dents.

`metadata` and `data` are separate on purpose: `metadata` is written at once by
[`setMetadata`](server.md#setmetadata); `data` is written with the save cycle. Keeping them
apart means one never overwrites the other.

## After a restart (`onRestart`)

| Value | Owned vehicles left out |
| --- | --- |
| `'garage'` (default) | back in the garage they last left |
| `'impound'` | in the impound, with `restartImpoundReason` and `restartImpoundFee` |
| `'world'` | stay where they were and spawn there (locked if they were) when their owner loads |

Group vehicles have no single owner to wait for: with `'world'` they follow
`groupOnRestart` (`'garage'` or `'impound'`). A vehicle removed from the world by something
else (a cleanup script) follows the same rules.

## Trunks never leak

ox_inventory keeps a vehicle's trunk and glovebox in memory under its **plate**. Two vehicles
with one plate would share a trunk: a traffic car with a player's plate could open that
player's trunk. bzn makes that impossible:

1. **The bridge gives ox_inventory the vehicle's `id`**: contents are saved on the vehicle's
   own row. Vehicles nobody owns are never saved.
2. **No two vehicles in the world show the same plate.** Every owned plate (real and fake)
   is kept in memory; every vehicle that appears (traffic, other scripts) is checked, and one
   with a taken plate gets a new plate at once (and again shortly after, and in a light
   sweep every 10 seconds).
3. **Every time a shown plate changes** (spawn, fake plate on or off, re-registration,
   parking), the trunk is saved under its vehicle and dropped from memory, so the next open
   asks again which vehicle it is.
4. **Every time a trunk or glovebox is opened**, bzn checks (an ox_inventory hook) that only
   one vehicle shows the plate and that the trunk in memory belongs to it. If not, it is
   fixed and that one open is refused; the next open is the right trunk.

## Plates

```lua
-- bzn_config/server/vehicles.lua
return {
    plateFormat = 'AA11 111',   -- A = letter, 1 = digit, . = either, the rest as is; max 8
    ambientPlates = true,       -- traffic gets the same format
}
```

With `ambientPlates`, traffic gets plates in your format too, so players cannot tell owned
vehicles from traffic by their plate.

## Impound

`impound` saves the vehicle's condition, takes it out of the world and records why, by whom,
a fee, and optionally a time before it can be released. `release` puts it in a garage; with
a player id, that player pays the fee (cash or bank, via [accounts](../accounts/)) to the
group in `impoundFeeTo`, or out of the economy.

## Access, keys and locks

Who may use (drive, lock, unlock) a vehicle:

| | `keyMode = 'virtual'` (default) | `keyMode = 'item'` |
| --- | --- | --- |
| Owner | always | needs a key item |
| Sharing | the owner gives access: `giveKey(id, friend, { charId = owner })` | hand the key item over |
| Group vehicles | grade permission `vehicle.use` | same |
| Temporary access (rental, mechanic) | `giveKey(..., { minutes })`, `giveEntityKey` | same |

With physical keys, the owner gets `keysOnCreate` keys when a vehicle is created. A key item
carries the vehicle's **lock version**; `changeLocks` makes every old key useless (after a
theft or a lost key) and takes back shared access.

**Locks go through the server.** `setLocked`, `toggleLock` and `isLocked` are what every
script uses: a key UI, a lockpick, the police. The state bag `bzn:locked` holds the state and
the client that owns the vehicle applies it, so an owner change never forgets a lock. With
`opts.charId` the character's access is checked; without, the call is trusted (a lockpick
after success).

## Config

### Server

`bzn_config/server/vehicles.lua`

| Option | Default | |
| --- | --- | --- |
| `plateFormat` | `'11AAA111'` | plate pattern, max 8 characters |
| `ambientPlates` | `false` | traffic gets plates in `plateFormat` too |
| `onRestart` | `'garage'` | `'garage'`, `'impound'` or `'world'` |
| `groupOnRestart` | `'garage'` | group vehicles with `'world'`: `'garage'` or `'impound'` |
| `defaultGarage` | `'default'` | for vehicles never parked anywhere |
| `restartImpoundFee` | `0` | fee for vehicles impounded at a restart |
| `restartImpoundReason` | `'Left out'` | |
| `impoundFeeTo` | `false` | group whose account receives impound fees |
| `lockedOnSpawn` | `false` | owned vehicles from a garage spawn locked |
| `keyMode` | `'virtual'` | `'virtual'` or `'item'` |
| `keyItem` | `'vehicle_key'` | the key item (`keyMode = 'item'`) |
| `keysOnCreate` | `1` | key items an owner gets with a new vehicle |
| `savedStateBags` | `{}` | entity state bags saved with the vehicle: `{ name = { clearOnRepair? } }` |

### Shared

| Option | Default | |
| --- | --- | --- |
| `radioOff` | `true` | radio off when a vehicle spawns and when a player first gets in |

### Key item

With `keyMode = 'item'`, add the item to `ox_inventory/data/items.lua`:

```lua
['vehicle_key'] = {
    label = 'Vehicle key',
    weight = 10,
    stack = false,
    close = true,
},
```

## Hooks

[Server hooks](../../hooks/server.md#vehicles)
