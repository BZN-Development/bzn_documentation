# Server

`id` is the vehicle id. `entity` is a vehicle in the world. See [Vehicle](../../types.md#vehicle).

## Reading

### get

```lua
bzn.vehicles.get(id)
```

- id: `integer`

**Returns**
- vehicle?: [`Vehicle`](../../types.md#vehicle)

```lua
local vehicle = bzn.vehicles.get(id)
print(vehicle.model, vehicle.plate, vehicle.stored or 'out')
```

### getByVin

```lua
bzn.vehicles.getByVin(vin)
```

- vin: `string`

**Returns**
- vehicle?: [`Vehicle`](../../types.md#vehicle)

```lua
local vehicle = bzn.vehicles.getByVin('7KASU0KTJ337EBTL2')
```

### getByPlate

By the **registered** plate. A fake plate is not found.

```lua
bzn.vehicles.getByPlate(plate)
```

- plate: `string`

**Returns**
- vehicle?: [`Vehicle`](../../types.md#vehicle)

```lua
local vehicle = bzn.vehicles.getByPlate(plateFromCamera)
if not vehicle then
    -- not registered: a fake plate, or not an owned vehicle
end
```

### getByEntity

```lua
bzn.vehicles.getByEntity(entity)
```

- entity: `integer`

**Returns**
- vehicle?: [`Vehicle`](../../types.md#vehicle) nil for vehicles nobody owns

### getIdByEntity

The id of an owned vehicle in the world. Fast: no database.

```lua
bzn.vehicles.getIdByEntity(entity)
```

**Returns**
- id?: `integer`

```lua
local id = bzn.vehicles.getIdByEntity(GetVehiclePedIsIn(GetPlayerPed(src), false))
```

### getByNetId

```lua
bzn.vehicles.getByNetId(netId)
```

**Returns**
- vehicle?: [`Vehicle`](../../types.md#vehicle)

### listOwned

```lua
bzn.vehicles.listOwned(charId)
```

- charId: `integer`

**Returns**
- vehicles: [`Vehicle[]`](../../types.md#vehicle)

```lua
for _, vehicle in ipairs(bzn.vehicles.listOwned(charId)) do
    print(vehicle.plate, vehicle.stored)
end
```

### listGroup

```lua
bzn.vehicles.listGroup(name)
```

- name: `string`

**Returns**
- vehicles: [`Vehicle[]`](../../types.md#vehicle)

### listSpawned

Owned vehicles in the world now.

```lua
bzn.vehicles.listSpawned()
```

**Returns**
- vehicles: `{ id, entity, netId, owner, group }[]`

```lua
for _, v in ipairs(bzn.vehicles.listSpawned()) do
    print(v.id, GetEntityCoords(v.entity))
end
```

## Saved state bags

### registerField

Saves an entity state bag with the vehicle (in the same writes as position and fuel) and sets
it again when the vehicle spawns. See [Saved state bags](index.md#saved-state-bags).

```lua
bzn.vehicles.registerField(name, opts?)
```

- name: `string` the state bag key (not `bzn:` or `ox_lib:`)
- opts?: `table`
  - clearOnRepair?: `boolean` cleared by [`repair`](#repair)

**Returns**
- ok: `boolean`

```lua
bzn.onReady(function()
    bzn.vehicles.registerField('nitrous')
end)

-- later, on the server
Entity(vehicle).state:set('nitrous', 3, true)   -- saved with the vehicle from now on
```

## Creating and deleting

### create

Creates an owned vehicle, in a garage (spawn it with [`spawn`](#spawn)).

```lua
bzn.vehicles.create(data)
```

- data: `table`
  - model: `string`
  - owner?: `integer` character id (owner **or** group)
  - group?: `string`
  - plate?: `string` default: a new one in `plateFormat`
  - stored?: `string` garage, default `defaultGarage`
  - properties?: `table` ox_lib properties (the look it is sold with)
  - metadata?: `table`
  - type?: `string` network type; default: asked from a client
  - src?: `integer` the player whose client tells the model's type (default: any)

**Returns**
- ok: `boolean`
- vehicleOrErr: [`Vehicle`](../../types.md#vehicle) | `'invalid_model'` | `'needs_owner_or_group'` | `'unknown_character'` | `'unknown_group'` | `'invalid_plate'` | `'plate_taken'` | `'no_client'`

```lua
-- a dealership after payment
local ok, vehicle = bzn.vehicles.create({ model = 'sultan', owner = charId, src = src, stored = 'pillbox' })
```

With `keyMode = 'item'` the owner gets `keysOnCreate` key items (if online).

### delete

Deletes a vehicle for good (and removes it from the world).

```lua
bzn.vehicles.delete(id)
```

**Returns**
- ok: `boolean`

## Spawning and parking

### spawn

Spawns an owned vehicle. An owned vehicle exists at most once.

```lua
bzn.vehicles.spawn(id, coords?, heading?, opts?)
```

- id: `integer`
- coords?: `vector3` default: its saved position (`onRestart = 'world'`)
- heading?: `number`
- opts?: `table`
  - warp?: `integer` put this player in the driver's seat
  - locked?: `boolean` default: `lockedOnSpawn` (from a garage) or as it was (left out)
  - force?: `boolean` also from the impound (staff)

**Returns**
- ok: `boolean`
- entityOrErr: `integer` | `'not_found'` | `'already_out'` | `'impounded'` | `'no_position'` | `'spawn_failed'` | hook reason

```lua
-- a garage: take the car out at the spawn point, player in the seat
local ok, entity = bzn.vehicles.spawn(id, spot.xyz, spot.w, { warp = src })
```

### park

Parks a vehicle in a garage: its condition is saved (never a client's look) and it leaves the
world. Also works for a vehicle that is out but not spawned (`onRestart = 'world'` before its
owner logged in).

```lua
bzn.vehicles.park(id, garage, opts?)
```

- id: `integer`
- garage: `string` max 32 characters, not `'impound'`
- opts?: `table`
  - properties?: `table` properties a client reported (only condition is used); default: read from the vehicle's owner

**Returns**
- ok: `boolean`
- err?: `'not_found'` | `'invalid_garage'` | `'impounded'` | `'not_out'` | hook reason

```lua
local id = bzn.vehicles.getIdByEntity(vehicle)
if id and bzn.vehicles.canUse(charId, id) then
    bzn.vehicles.park(id, 'pillbox')
end
```

### spawnTemporary

Spawns a vehicle nobody owns (rental, job vehicle, test drive). Never saved; gets a free
plate; removed when bzn_core stops.

```lua
bzn.vehicles.spawnTemporary(model, coords, heading?, opts?)
```

- model: `string`
- coords: `vector3`
- heading?: `number`
- opts?: `table`
  - plate?: `string`
  - properties?: `table`
  - keys?: `integer[]` character ids that get a key
  - warp?: `integer`
  - type?, src?: as in [`create`](#create)

**Returns**
- ok: `boolean`
- entityOrErr: `integer` | `'plate_taken'` | `'invalid_type'` | `'spawn_failed'`
- plate?: `string`

```lua
local ok, entity, plate = bzn.vehicles.spawnTemporary('faggio', rentalSpot, 90.0, { keys = { charId }, warp = src })
```

## Plates and VIN

### setPlate

Re-registers a vehicle under a new plate. A fake plate, if any, stays shown.

```lua
bzn.vehicles.setPlate(id, plate)
```

**Returns**
- ok: `boolean`
- err?: `'not_found'` | `'invalid_plate'` | `'plate_taken'`

```lua
bzn.vehicles.setPlate(id, 'BZN 777')   -- a custom plate bought at the DMV
```

### setFakePlate

Puts a fake plate on. The registered plate stays in the background.

```lua
bzn.vehicles.setFakePlate(id, plate)
```

**Returns**
- ok: `boolean`
- err?: `'not_found'` | `'invalid_plate'` | `'plate_taken'`

```lua
if exports.ox_inventory:RemoveItem(src, 'fake_plate', 1) then
    bzn.vehicles.setFakePlate(id, 'XYZ 123')
end
```

### removeFakePlate

```lua
bzn.vehicles.removeFakePlate(id)
```

**Returns**
- ok: `boolean`
- err?: `'not_found'` | `'no_fake_plate'`

### setVinScratched

Scratches the VIN off (or restores it). The VIN stays in the database; `vinScratched` tells
scripts not to show it.

```lua
bzn.vehicles.setVinScratched(id, scratched)
```

```lua
local vehicle = bzn.vehicles.get(id)
local shown = vehicle.vinScratched and 'scratched off' or vehicle.vin
```

## Look, condition and data

### setProperties

Sets a vehicle's look (or any ox_lib property). Trusted: for a tuning shop after payment,
staff and scripts, never with values straight from a client. Applied at once if it is out.

```lua
bzn.vehicles.setProperties(id, props)
```

- props: `table` only the keys to change

**Returns**
- ok: `boolean`
- err?: `'not_found'`

```lua
if bzn.accounts.pay(src, 2500, { reason = 'Spoiler' }) then
    bzn.vehicles.setProperties(id, { modSpoilers = 2 })
end
```

### repair

Full health, no broken tyres, windows or doors. For mechanic scripts: a repair done only on a
client is not saved.

```lua
bzn.vehicles.repair(id)
```

```lua
if bzn.groups.isOnDuty(charId, 'mechanic') then bzn.vehicles.repair(id) end
```

### setOwner

Gives a vehicle to a character or a group (exactly one).

```lua
bzn.vehicles.setOwner(id, charId?, group?)
```

**Returns**
- ok: `boolean`
- err?: `'not_found'` | `'needs_owner_or_group'` | `'unknown_character'` | `'unknown_group'`

```lua
bzn.vehicles.setOwner(id, buyerCharId)        -- sold to a player
bzn.vehicles.setOwner(id, nil, 'mechanic')    -- now a company car
```

### setMetadata

Stores a value for your script (insurance, mileage, notes).

```lua
bzn.vehicles.setMetadata(id, key, value)
```

```lua
bzn.vehicles.setMetadata(id, 'insuredUntil', os.time() + 7 * 86400)
```

### getMetadata

```lua
bzn.vehicles.getMetadata(id, key)
```

```lua
local insuredUntil = bzn.vehicles.getMetadata(id, 'insuredUntil')
```

## Impound

### impound

Saves its condition, takes it out of the world and keeps it in the impound.

```lua
bzn.vehicles.impound(id, opts?)
```

- opts?: `table`
  - reason?: `string`
  - fee?: `integer` whole number
  - minutes?: `number` not releasable before this
  - lot?: `string` which impound lot
  - actor?: `string`

**Returns**
- ok: `boolean`
- err?: `'not_found'` | `'already_impounded'` | `'invalid_fee'` | hook reason

```lua
bzn.vehicles.impound(id, { reason = 'Illegally parked', fee = 500, minutes = 30, actor = 'char:' .. officerCharId })
```

### getImpound

```lua
bzn.vehicles.getImpound(id)
```

**Returns**
- info?: `{ reason, fee, by, at, releaseAfter, secondsLeft, lot }`

```lua
local info = bzn.vehicles.getImpound(id)
if info and info.secondsLeft > 0 then
    print(('releasable in %d minutes'):format(math.ceil(info.secondsLeft / 60)))
end
```

### release

Puts an impounded vehicle in a garage. With `src`, that player pays the fee (`accounts.pay`);
without, it is free (staff, scripts).

```lua
bzn.vehicles.release(id, opts?)
```

- opts?: `table`
  - garage?: `string` default: its last garage
  - src?: `integer` the player who pays
  - method?: `'auto'` | `'cash'` | `'bank'`
  - force?: `boolean` also before the release time

**Returns**
- ok: `boolean`
- err?: `'not_impounded'` | `'locked'` (and seconds left) | `'invalid_garage'` | payment errors (`'insufficient_funds'`, ...)

```lua
local ok, err, seconds = bzn.vehicles.release(id, { src = src, method = 'bank', garage = 'impound_lot' })
```

## Access and keys

### canUse

May a character use (drive, lock) a vehicle?

```lua
bzn.vehicles.canUse(charId, id)
```

**Returns**
- `boolean`
- how?: `'owner'` | `'group'` | `'key'`

```lua
local can, how = bzn.vehicles.canUse(charId, id)
```

### canUseEntity

The same for a vehicle in the world, owned or temporary. Vehicles bzn does not know (traffic)
are never usable this way.

```lua
bzn.vehicles.canUseEntity(charId, entity)
```

**Returns**
- `boolean`
- how?: `string`

### giveKey

Gives access: permanent (shared), or for `minutes`. With `opts.charId` (a player sharing their
car) that character must own it, or have `vehicle.keys` in its group.

```lua
bzn.vehicles.giveKey(id, charId, opts?)
```

- charId: `integer` who gets the key
- opts?: `table`
  - minutes?: `number`
  - charId?: `integer` who gives it (checked)
  - actor?: `string`

**Returns**
- ok: `boolean`
- err?: `'not_found'` | `'unknown_character'` | `'no_permission'`

```lua
-- a player shares their car with a friend
bzn.vehicles.giveKey(id, friendCharId, { charId = myCharId })
-- a mechanic gets an hour
bzn.vehicles.giveKey(id, mechanicCharId, { minutes = 60 })
```

### removeKey

Takes a key back, or every key with `charId` nil. Anyone may give back their own key.

```lua
bzn.vehicles.removeKey(id, charId?, opts?)
```

- opts?: `{ charId?: integer }` who does it (checked)

**Returns**
- ok: `boolean`
- err?: `'not_found'` | `'no_permission'`

### keys

```lua
bzn.vehicles.keys(id)
```

**Returns**
- `{ permanent: integer[], temporary: { charId, secondsLeft }[] }`

### giveEntityKey

A key to a temporary vehicle (rental, job vehicle).

```lua
bzn.vehicles.giveEntityKey(entity, charId, minutes?)
```

**Returns**
- ok: `boolean` false if the entity is not a temporary vehicle

### giveKeyItem

Makes a key item for a vehicle (`keyMode = 'item'`), for the current locks.

```lua
bzn.vehicles.giveKeyItem(id, src)
```

**Returns**
- ok: `boolean`
- err?: `'not_found'` | `'no_inventory'` | `'cannot_carry'`

```lua
-- a locksmith
if bzn.accounts.pay(src, 150, { reason = 'Spare key' }) then
    bzn.vehicles.giveKeyItem(id, src)
end
```

### hasKeyItem

```lua
bzn.vehicles.hasKeyItem(src, id)
```

**Returns**
- `boolean` true if the player carries a key for the current locks

### changeLocks

New locks: every key item stops working, and shared and temporary access is taken back.

```lua
bzn.vehicles.changeLocks(id)
```

**Returns**
- ok: `boolean`
- versionOrErr: `integer` | `'not_found'`

## Locks

### setLocked

Locks or unlocks a vehicle. With `opts.charId` the character must be allowed to use it;
without, the call is trusted (a lockpick after success, staff).

```lua
bzn.vehicles.setLocked(entity, locked, opts?)
```

- entity: `integer`
- locked: `boolean`
- opts?: `{ charId?: integer }`

**Returns**
- ok: `boolean`
- err?: `'not_found'` | `'no_access'` | hook reason

```lua
-- lockpick script, after the minigame succeeded
bzn.vehicles.setLocked(vehicle, false)
```

### toggleLock

```lua
bzn.vehicles.toggleLock(entity, opts?)
```

**Returns**
- ok: `boolean`
- lockedOrErr: `boolean` the new state, or an error

```lua
RegisterNetEvent('mykeys:toggle', function(netId)
    local character = bzn.characters.get(source)
    local entity = NetworkGetEntityFromNetworkId(netId)
    local ok, locked = bzn.vehicles.toggleLock(entity, { charId = character.id })
end)
```

### isLocked

```lua
bzn.vehicles.isLocked(entity)
```

**Returns**
- `boolean`
