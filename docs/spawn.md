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

- While the character is in the open world, its position is checked once per save interval
  and written only if it moved more than `spawn.saveDistance` metres.
- On unload (logout, disconnect, shutdown) the exact position is always written.
- Inside an instance, the open-world position is left alone (it keeps pointing at the
  door). The instance position is written on unload and available as `character.instance`.

## Crash safety

A crash on join used to be able to save a position of `0, 0, 0`, or a position far under
the map after falling through it. bzn prevents both:

- **Nothing is saved before the client confirmed its spawn**, nor in the first
  `spawn.saveDelay` seconds after it (the server's copy of the ped can lag behind a
  teleport).
- **A position is never saved** near the origin, below `spawn.minWorldZ`, or while the ped
  is falling fast. The last good position is kept instead.
- **At spawn**, a saved position near the origin is ignored (default spawn). For any other
  saved position, the client looks for ground at the same x/y, searching downwards, then
  upwards, then from the sky. If it finds ground more than 2 m away it moves the player
  onto it; only if there is none at all does it ask for the default spawn.

## Hooks

- `spawn:beforeSpawn (src, character, point)`: change `point` in place or return `false`.
  Runs inside bzn_core, so in-place changes only work for handlers in bzn_core modules; from
  another resource, use a provider.
- `spawn:spawned (src, character, point)`: the client confirmed the spawn.
