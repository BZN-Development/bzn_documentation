# Client

The client has the local player's anchors and computes values from its own clock. Reading
them costs nothing: no network, no callback. Read them as often as your HUD needs.

### get

The current value of a status.

```lua
bzn.status.get(name)
```

- name: `string`

**Returns**
- value?: `number`

```lua
local hunger = bzn.status.get('hunger')   -- 73.4
```

### getAll

```lua
bzn.status.getAll()
```

**Returns**
- values: `table<string, number>`

```lua
for name, value in pairs(bzn.status.getAll()) do
    print(name, math.floor(value))
end
```

### rate

The current change per minute (negative goes down). For a trend arrow on a HUD.

```lua
bzn.status.rate(name)
```

**Returns**
- perMinute?: `number`

```lua
local arrow = bzn.status.rate('thirst') < 0 and 'down' or 'up'
```

## A HUD

```lua
CreateThread(function()
    while true do
        if bzn.character.get() then
            SendNUIMessage({
                action = 'status',
                hunger = bzn.status.get('hunger'),
                thirst = bzn.status.get('thirst'),
            })
        end
        Wait(500)
    end
end)
```

## Hooks

### status:changed

`(name, value, rate)` A new anchor arrived: the player ate, a rate changed, or an admin set
it.
