# Client

### character.get

The local player's loaded character.

```lua
bzn.character.get()
```

**Returns**
- character?: [`Character`](../types.md#character) nil while in character selection

```lua
local character = bzn.character.get()
if character then
    print('Playing as ' .. character.firstName)
end
```

## Hooks

```lua
bzn.hooks.on('character:selecting', function() end)          -- open your selection UI
bzn.hooks.on('character:loaded', function(character) end)
bzn.hooks.on('character:unloaded', function(reason) end)
```

See [client hooks](../hooks/client.md#character).
