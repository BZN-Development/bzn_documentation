# Client

The client knows only the local player's own groups, sent by the server when they change.
Use these for UI only; the server checks again.

### getMemberships

The local player's groups and grades.

```lua
bzn.groups.getMemberships()
```

**Returns**
- memberships: [`Memberships`](../../types.md#memberships)

```lua
local groups = bzn.groups.getMemberships()   -- { police = 2 }
```

### has

Whether the local player is in a group, optionally at or above a grade.

```lua
bzn.groups.has(name, minGrade?)
```

- name: `string`
- minGrade?: `integer`

**Returns**
- `boolean`

```lua
if bzn.groups.has('police', 2) then
    showChiefMenu()
end
```

### getDuty

The group the local player is on duty in.

```lua
bzn.groups.getDuty()
```

**Returns**
- name?: `string`

```lua
local duty = bzn.groups.getDuty()   -- 'police' or nil
```

### isOnDuty

```lua
bzn.groups.isOnDuty(name)
```

- name: `string`

**Returns**
- `boolean`

```lua
if bzn.groups.isOnDuty('police') then
    showPoliceHud()
end
```

## Hooks

```lua
bzn.hooks.on('groups:changed', function(memberships, duty) end)
bzn.hooks.on('groups:dutyChanged', function(duty, previous) end)
```

See [client hooks](../../hooks/client.md#groups).
