# Status

Hunger, thirst, stress, and any other value from 0 to 100 that changes over time.

## Anchors, not ticks

Nothing is updated on a timer. Each status is stored as an **anchor**: its value at one
moment and how fast it changes per minute. The current value is computed from the clock
when someone asks:

```
value now = value at anchor + rate × minutes since anchor     (kept between 0 and 100)
```

Eating, a new rate (running, sick) or an admin setting it are events that write a new
anchor and send it to that player. The client computes the same value from its own clock,
so a HUD can read `bzn.status.get('hunger')` every frame and moves smoothly, without the
server sending anything in between.

Time only counts while the character is loaded.

## Config

Shared (`bzn_config/shared/status.lua`):

```lua
return {
    statuses = {
        hunger = { label = 'Hunger', start = 100, perMinute = -1.0, damage = 5 },
        thirst = { label = 'Thirst', start = 100, perMinute = -1.5, damage = 8 },
        stress = { label = 'Stress', start = 0,   perMinute = -0.5, damage = 0 },
        -- your own:
        drunk  = { label = 'Drunk',  start = 0,   perMinute = -2.0, damage = 0 },
    },
}
```

| Option | |
| --- | --- |
| `start` | value of a new character |
| `perMinute` | change per minute while loaded; negative goes down (`-1` = 100 to 0 in 100 minutes) |
| `damage` | health lost per minute while the status is at 0 |

Damage is applied on the client by a timer set to the moment the status runs out, not by a
loop that checks.

## Food and drink

The effect is written on the item, in ox_inventory's `data/items.lua`, in points:

```lua
['burger'] = {
    label = 'Burger',
    weight = 220,
    server = { status = { hunger = 20 } },
    client = { anim = 'eating', prop = 'burger', usetime = 2500 },
},
['coffee'] = {
    label = 'Coffee',
    server = { status = { thirst = 10, stress = -5 } },
    client = { anim = { dict = 'mp_player_intdrink', clip = 'loop_bottle' }, usetime = 2500 },
},
```

ox_inventory keeps `server` on the server only and tells bzn after it confirmed the use, so
a client can neither see nor fake the amounts. ox_inventory's own `client.status` is not
used.

## Server API

| Function | |
| --- | --- |
| `status.get(charId, name)` | current value |
| `status.getAll(charId)` | `{ [name] = value }` |
| `status.set(charId, name, value, reason?)` | errors `unknown_status`, `not_loaded`, `invalid_value` |
| `status.add(charId, name, amount, reason?)` | negative takes away |
| `status.setModifier(charId, name, key, perMinute?)` | add, change or (with nil) remove a named rate modifier |
| `status.rate(charId, name)` | current rate per minute |

Modifiers are named so scripts never overwrite each other:

```lua
bzn.status.setModifier(charId, 'thirst', 'running', -1.0)   -- thirsty faster while running
bzn.status.setModifier(charId, 'thirst', 'running', nil)    -- back to normal
```

Hooks: `status:changed (charId, name, value, reason)` on set/add, `status:empty (charId, name)`
when it reaches 0, `status:recovered (charId, name)` when it leaves 0.

## Client API

```lua
bzn.status.get('hunger')    -- computed from the local clock
bzn.status.getAll()
bzn.status.rate('thirst')   -- for a trend arrow on a HUD
```

Hook `status:changed (name, value, rate)` when a new anchor arrives.

## Saving

Values are saved with the [save system](../database.md#the-save-system): batched, spread
over time, and always on logout. A crash loses at most one save interval.

## Commands

```
bzn status <id>                     every status with its rate
bzn status <id> <name> <value>      set one
bzn status <id> all 100             feed and water
```
