# Hooks

Hooks are how you plug into bzn without editing it: react when something happens, or add
your own rules before it happens.

- **[Server hooks](server.md)**: characters, groups, money, salary, statuses.
- **[Client hooks](client.md)**: what changed for the local player (for UIs).

## Two kinds

| Kind | Name looks like | Can stop it? | Use for |
| --- | --- | --- | --- |
| **Before-hook** | `groups:beforeAdd` | yes: `return false, 'reason'` | rules (limits, bans, whitelists) |
| **After-hook** | `groups:added` | no | reacting (give items, update a UI, log) |

```lua
-- Before-hook: a rule. Return false and a reason to stop it.
bzn.hooks.on('groups:beforeAdd', function(charId, group, grade)
    if group == 'police' and bzn.groups.countOnDuty('police') >= 20 then
        return false, 'police_full'
    end
end)

-- After-hook: react to it.
bzn.hooks.on('groups:added', function(charId, group, grade, src)
    print(('character %d joined %s'):format(charId, group))
end)
```

The reason from a before-hook is returned to whoever asked:

```lua
local ok, err = bzn.groups.add(charId, 'police', 0)   -- false, 'police_full'
```

## Rules

- **Register**: `local id = bzn.hooks.on(name, fn, { priority = 0 })`.
  **Remove**: `bzn.hooks.off(id)`.
- **Order**: higher `priority` runs first. In a before-hook the first `false` stops the rest.
- **Local to their side**: a server hook never fires on a client, and the other way round.
- **Cleaned up for you**: handlers from your resource are removed when it stops.
- **Copies**: tables your handler receives in another resource are copies. Changing them
  changes nothing in bzn; use the API.
- **Keep them short**: handlers run in the middle of the action. Start a thread for slow
  work:

  ```lua
  bzn.hooks.on('character:loaded', function(src, character)
      CreateThread(function() slowSetup(src, character) end)
  end)
  ```

- **Also events**: every after-hook is also a local event `bzn:<name>`, so
  `AddEventHandler('bzn:character:loaded', ...)` works. It never goes over the network.

## Naming

`<area>:<event>` for after-hooks, `<area>:before<Action>` for before-hooks. Areas:
`core`, `module`, `player`, `character`, `spawn`, `role`, `groups`, `accounts`, `payroll`,
`status`. Use your own area for hooks in your own modules.
