# Spawning and positions

## Where a character spawns

When a character loads, core asks **spawn providers**, highest priority first. The first
one that returns a point wins.

| Provider | Priority | Answers |
| --- | --- | --- |
| `instance` | 60 | only after unloading inside an instance, per `spawn.instanceSpawn` |
| `last` | 50 | the last saved open-world position |
| `default` | 0 | the first point in `spawn.defaults`; always answers |

A point is `{ x, y, z, heading?, bucket?, model? }`.

### Your own provider (housing, jail, hospital)

```lua
bzn.onReady(function()
    bzn.spawn.registerProvider('housing', 80, function(src, character)
        local house = getHouseInside(character.id)  -- your own data
        if not house then return nil end            -- nil = let the next provider decide
        return { x = house.x, y = house.y, z = house.z, heading = house.h, bucket = house.bucket }
    end)
end)
```

Providers are removed when their resource stops. Points from providers are trusted: they
may be interiors under the map, and no ground check is done for them.

### Moving into an instance

Call this right before you change a player's routing bucket, so that if they crash
inside, they come back at the door and not at a position from minutes ago:

```lua
bzn.spawn.rememberWorldPosition(src)
SetPlayerRoutingBucket(src, houseBucket)
```

What happens after unloading inside an instance is set by `spawn.instanceSpawn`:

| Value | Spawns at |
| --- | --- |
| `'world'` (default) | the last open-world position, bucket 0 (always safe) |
| `'position'` | the coordinates inside the instance, but in bucket 0 (careful: many interiors are under the map) |
| `'instance'` | the coordinates inside the instance, in the same bucket |

A housing provider overrides all three.

## How positions are saved

Positions are read on the server (OneSync), never sent by the client.

- **Every 5 seconds** (`spawn.trackInterval`) each character's position is read **into memory**
  (no database). The reads are staggered: every second a fifth of the players, so the work is
  spread evenly.
- **To the database**: once per save interval, only if the character moved more than
  `spawn.saveDistance` metres; and always on logout, disconnect and shutdown.
- **In a vehicle**: OneSync does not move a ped while it sits in a vehicle (it stays where the
  player got in), so the **vehicle's** position is used, and the character is placed 2 m from
  it on the driver's side (so it does not spawn inside its own car if that comes back there).
- **Inside an instance**, the open-world position is left alone (it keeps pointing at the door).
  The instance position is written on unload and available as `character.instance`.

### When a player disconnects or crashes

By the time the server hears a player is gone, its ped is often already deleted, so its
position can no longer be read. bzn then uses, in this order:

1. the ped handle it last saw (when it still exists);
2. the **vehicle** the player was last seen in: owned vehicles stay in the world when their
   driver leaves, so this is where the player quit, to the metre;
3. the last position read into memory (at most `trackInterval` seconds old).

The console says which one was used (`quit in a vehicle: saving next to it at ...`).

## Crash safety

- **Nothing is saved before the client confirmed its spawn**, nor in the first
  `spawn.saveDelay` seconds after it.
- **A position is never saved** near the origin, below `spawn.minWorldZ`, or while falling fast.
  The last good position is kept instead.
- **At spawn** (saved positions only):
  - a saved position near the origin is ignored (default spawn);
  - the client moves the player to the **nearest safe spot** a person can stand on (GTA's
    navmesh: road, pavement) if one is within 15 m;
  - then it finds the **ground nearest the saved height**, looking from just above and from a
    little higher, so a point inside a slope lands on top of it, and a point under the map is
    moved up. Only with no ground at all does it ask for the default spawn.

## API (server)

### spawn.registerProvider

Adds a spawn provider. Higher priority is asked first; the first that returns a point wins.
Registering a name again replaces it. Removed when your resource stops.

```lua
bzn.spawn.registerProvider(name, priority, fn)
```

- name: `string`
- priority: `integer` built in: instance 60, last 50, default 0
- fn: `function(src, character): SpawnPoint?` return nil to let the next provider decide

See [SpawnPoint](types.md#spawnpoint) and the [housing example](#your-own-provider-housing-jail-hospital).

```lua
bzn.spawn.registerProvider('jail', 90, function(src, character)
    local cell = getJailCell(character.id)
    if cell then return { x = cell.x, y = cell.y, z = cell.z, heading = cell.h } end
end)
```

### spawn.rememberWorldPosition

Saves a player's open-world position now. Call it right before moving them into an
instance.

```lua
bzn.spawn.rememberWorldPosition(src)
```

- src: `integer`

**Returns**
- saved: `boolean` false if the player is not in the open world, or spawned less than `saveDelay` seconds ago

```lua
bzn.spawn.rememberWorldPosition(src)
SetPlayerRoutingBucket(src, house.bucket)
SetEntityCoords(GetPlayerPed(src), house.inside)
```

### spawn.resume

Spawns a player whose spawn a `spawn:beforeSpawn` hook held back. The point is resolved
again. Does nothing if the spawn is not held back, so calling it twice is safe.

```lua
bzn.spawn.resume(src)
```

- src: `integer`

**Returns**
- resumed: `boolean`

### spawn.blockedReason

```lua
local reason = bzn.spawn.blockedReason(src) -- e.g. 'appearance_required', or nil
```

## Hooks

- `spawn:beforeSpawn (src, character, point)`: change `point` in place or return `false`
  (with a reason) to hold the spawn back until `spawn.resume(src)`.
  Runs inside bzn_core, so in-place changes only work for handlers in bzn_core modules; from
  another resource, use a provider.
- `spawn:spawned (src, character, point)`: the client confirmed the spawn.

Client: `spawn:spawning (point)`, `spawn:pedReady (ped, point)` (dress the ped here, before
the fade-in), `spawn:spawned (point)` and `spawn:blocked (reason)`.

## Taking over the picture (client)

By default core fades to black, places the character and fades in. A resource that wants
to show something else while that happens (e.g. a camera flying to the spawn point, as
[bzn_multichar](addons/multichar.md) does) takes over:

```lua
bzn.spawn.setTransition(true)   -- core does not fade out or in during spawns

bzn.hooks.on('spawn:spawning', function(point) --[[ start moving a camera to point ]] end)
bzn.hooks.on('spawn:spawned', function(point)
    -- bring the camera down, hand back to the game camera, then:
    bzn.spawn.setTransition(false)
end)
```

It is handed back automatically if the resource stops.
