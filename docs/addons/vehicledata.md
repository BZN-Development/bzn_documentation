# bzn_vehicledata

Mileage and bodywork deformation (dents) for bzn's [owned vehicles](../modules/vehicles/index.md),
in one resource. Repository: [BZN-Development/bzn_vehicledata](https://github.com/BZN-Development/bzn_vehicledata).

Both live in entity state bags that bzn_core [saves with the vehicle](../modules/vehicles/index.md#saved-state-bags)
in the same writes as its position and fuel, and sets again when it spawns. The resource
itself writes nothing to the database.

## Install

```cfg
ensure bzn_core
ensure ox_inventory
ensure bzn_vehicledata
```

Requires bzn_core with the vehicles module, ox_lib and OneSync. Settings are in the
resource's `config.lua`.

## Mileage

- **Counted on the server.** Every `interval` seconds the position of each owned vehicle with a
  driver is compared to the last one. A client cannot fake it.
- Towed vehicles (no driver) and teleports (faster than `maxSpeed`) do not count.
- Kept in **metres** in the `mileage` state bag, and shown in km or miles (`unit`). The unit can
  be changed any time: the stored value is always metres.
- The state bag is updated every `stateBagStep` metres (100 m), not every metre, so players near
  the vehicle are not flooded with updates.

### getMileage

Mileage of a vehicle in the world. Server and client.

```lua
exports.bzn_vehicledata:getMileage(entity, unit?)
```

- entity: `integer`
- unit?: `'km'` | `'mi'` default `Config.mileage.unit`

**Returns**
- mileage?: `number` one decimal

```lua
-- client: an odometer on a HUD
local km = exports.bzn_vehicledata:getMileage(cache.vehicle, 'km')
```

### getMileageById

Server. Also when the vehicle is parked.

```lua
exports.bzn_vehicledata:getMileageById(vehicleId, unit?)
```

**Returns**
- mileage?: `number`

```lua
-- a dealership showing a used car
local km = exports.bzn_vehicledata:getMileageById(id, 'km')
```

### convert

Server. Metres to km or miles.

```lua
exports.bzn_vehicledata:convert(metres, unit?)
```

### getUnit

Client. The unit the server shows mileage in.

```lua
exports.bzn_vehicledata:getUnit()   -- 'km' or 'mi'
```

You can also read the state bag directly: `Entity(vehicle).state.mileage` (metres).

## Deformation

- When an owned vehicle takes damage, the client that owns it measures the dents (once the hits
  have settled, `settle` seconds) at points spread over its body (`grid`) and sends them to the
  server.
- The server checks them: only from the client that owns the vehicle, sane numbers, at most once
  a second. It keeps the **worst dent per point**, so dents only ever get worse, and sets the
  `deformation` state bag. Works with `sv_stateBagStrictMode`.
- Every client that sees the vehicle dents it to match, a few passes spread over frames, and the
  vehicle's health is put back afterwards (denting must not damage the engine).
- [`bzn.vehicles.repair`](../modules/vehicles/server.md#repair) clears the dents.
- Only the vehicle `types` in config (default: cars). Bikes and aircraft look wrong when dents
  are put back.

Written for bzn from GTA's own natives (`GetVehicleDeformationAtPos`, `SetVehicleDamage`,
`SetVehicleDeformationFixed`).

### getDeformation

Server. The dents of a vehicle in the world (what is saved).

```lua
exports.bzn_vehicledata:getDeformation(entity)
```

**Returns**
- dents?: `{ x, y, z, size }[]` a point on the body (offset from the centre) and how deep the dent is

### measureDeformation

Client. Measures the dents on a vehicle now.

```lua
exports.bzn_vehicledata:measureDeformation(vehicle)
```

## Config

```lua
Config.mileage = {
    enabled = true,
    unit = 'km',          -- 'km' or 'mi'
    interval = 2,         -- seconds between samples
    maxSpeed = 100.0,     -- m/s; a faster jump is a teleport
    stateBagStep = 100,   -- metres between state bag updates
}

Config.deformation = {
    enabled = true,
    types = { automobile = true },
    grid = 5,             -- points per side: 5 = up to 125 points
    threshold = 0.05,     -- smaller dents are ignored
    settle = 1.5,         -- seconds after the last hit before measuring
    maxPasses = 12,       -- passes when putting dents back
}
```
