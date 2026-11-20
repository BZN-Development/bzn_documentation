# Server

## Reading

### get

Returns a group with its grades.

```lua
bzn.groups.get(name)
```

- name: `string`

**Returns**
- group?: [`Group`](../../types.md#group)

```lua
local police = bzn.groups.get('police')
print(police.label, police.grades[2].label)   -- Police  Chief
```

### list

Returns every group, optionally of one type, sorted by name.

```lua
bzn.groups.list(type?)
```

- type?: `string`

**Returns**
- groups: [`Group[]`](../../types.md#group)

```lua
for _, gang in ipairs(bzn.groups.list('gang')) do
    print(gang.name)
end
```

### getMemberships

Returns a character's groups and grades. Works for offline characters too (reads the
database).

```lua
bzn.groups.getMemberships(charId)
```

- charId: `integer`

**Returns**
- memberships: [`Memberships`](../../types.md#memberships)

```lua
local groups = bzn.groups.getMemberships(charId)   -- { police = 2 }
```

### has

Whether a character is in a group, optionally at or above a grade.

```lua
bzn.groups.has(charId, name, minGrade?)
```

- charId: `integer`
- name: `string`
- minGrade?: `integer`

**Returns**
- `boolean`

```lua
if bzn.groups.has(charId, 'police', 1) then
    -- officer or higher
end
```

### hasPermission

Whether a character's grade in a group has a permission. Owners have every permission.

```lua
bzn.groups.hasPermission(charId, name, permission)
```

- charId: `integer`
- name: `string`
- permission: `string`

**Returns**
- `boolean`

```lua
if not bzn.groups.hasPermission(charId, 'police', 'armory') then
    return TriggerClientEvent('ox_lib:notify', src, { type = 'error', description = 'No access' })
end
```

### paidBy

Who pays a group's salary: the group's own setting, else its type's default.

```lua
bzn.groups.paidBy(name)
```

- name: `string`

**Returns**
- `'city'` | `'account'`

```lua
if bzn.groups.paidBy('mechanic') == 'account' then
    -- salaries come from the mechanic account
end
```

### getPrincipals

The ACE principals a player has from groups (for debugging).

```lua
bzn.groups.getPrincipals(src)
```

- src: `integer`

**Returns**
- principals: `string[]`

```lua
print(table.concat(bzn.groups.getPrincipals(src), ' '))
-- bzn.group.police bzn.group.police.0 bzn.group.police.1 bzn.duty.police
```

## Members

### add

Adds a character to a group at a grade.

```lua
bzn.groups.add(charId, name, grade)
```

- charId: `integer`
- name: `string`
- grade: `integer`

**Returns**
- ok: `boolean`
- err?: `'unknown_group'` | `'unknown_grade'` | `'already_member'` | `'limit_reached'` | `'conflict'` | hook reason

```lua
local ok, err = bzn.groups.add(charId, 'mechanic', 0)
if not ok and err == 'limit_reached' then
    -- already in two jobs
end
```

### setGrade

Changes a member's grade. Demoting the last owner is refused unless `force` is set.

```lua
bzn.groups.setGrade(charId, name, grade, opts?)
```

- charId: `integer`
- name: `string`
- grade: `integer`
- opts?: `table`
  - force?: `boolean` skip owner protection (admins)

**Returns**
- ok: `boolean`
- err?: `'unknown_group'` | `'unknown_grade'` | `'not_member'` | `'last_owner'` | hook reason

```lua
bzn.groups.setGrade(charId, 'police', 1)
```

### remove

Removes a character from a group (and from duty in it). Removing the last owner is refused
unless `force` is set.

```lua
bzn.groups.remove(charId, name, opts?)
```

- charId: `integer`
- name: `string`
- opts?: `table`
  - force?: `boolean`

**Returns**
- ok: `boolean`
- err?: `'unknown_group'` | `'not_member'` | `'last_owner'` | hook reason

```lua
local ok, err = bzn.groups.remove(charId, 'mechanic')
if err == 'last_owner' then
    -- promote someone else first
end
```

## Duty

### setDuty

Goes on duty in a group, or off duty with `nil`. Going on duty in one group leaves duty in
the previous one. Only for loaded characters.

```lua
bzn.groups.setDuty(charId, name?)
```

- charId: `integer`
- name?: `string`

**Returns**
- ok: `boolean`
- err?: `'not_loaded'` | `'unknown_group'` | `'not_member'` | `'no_duty'` | hook reason

```lua
bzn.groups.setDuty(charId, 'police')   -- on duty
bzn.groups.setDuty(charId, nil)        -- off duty
```

### getDuty

The group a character is on duty in.

```lua
bzn.groups.getDuty(charId)
```

- charId: `integer`

**Returns**
- name?: `string`

```lua
local duty = bzn.groups.getDuty(charId)
```

### isOnDuty

```lua
bzn.groups.isOnDuty(charId, name)
```

- charId: `integer`
- name: `string`

**Returns**
- `boolean`

```lua
if not bzn.groups.isOnDuty(charId, 'police') then
    return false, 'not_on_duty'
end
```

### countOnDuty

How many loaded characters are on duty in a group.

```lua
bzn.groups.countOnDuty(name)
```

- name: `string`

**Returns**
- `integer`

```lua
if bzn.groups.countOnDuty('police') < 3 then
    return false, 'not_enough_police'
end
```

## Managing groups

For admin menus and business systems. Every change is saved at once and applied to online
members (principals, account access).

### create

Creates a group.

```lua
bzn.groups.create(name, def)
```

- name: `string` lowercase letters, digits and `_`, max 32
- def: `table`
  - label: `string`
  - type: `string` a type from the config
  - paidBy?: `'city'` | `'account'`
  - grades: `table<integer, { label: string, salary?: integer, permissions?: string[] }>`

**Returns**
- ok: `boolean`
- err?: `'already_exists'` | a validation message | hook reason

```lua
bzn.groups.create('tacos', {
    label = 'Taco Stand', type = 'business',
    grades = {
        [0] = { label = 'Cook', salary = 300 },
        [1] = { label = 'Owner', permissions = { 'owner' } },
    },
})
```

### setLabel

```lua
bzn.groups.setLabel(name, label)
```

- name: `string`
- label: `string` 1-64 characters

**Returns**
- ok: `boolean`
- err?: `'unknown_group'` | `'invalid_label'`

```lua
bzn.groups.setLabel('tacos', 'Tacos Del Sol')
```

### addGrade

```lua
bzn.groups.addGrade(name, grade, data)
```

- name: `string`
- grade: `integer` 0-255
- data: `table`
  - label: `string`
  - salary?: `integer`
  - permissions?: `string[]`

**Returns**
- ok: `boolean`
- err?: `'unknown_group'` | `'invalid_grade'` | `'grade_exists'` | `'invalid_label'` | `'invalid_salary'` | `'invalid_permission'`

```lua
bzn.groups.addGrade('police', 3, { label = 'Commissioner', salary = 1500, permissions = { 'owner' } })
```

### updateGrade

Changes a grade's label and/or salary.

```lua
bzn.groups.updateGrade(name, grade, data)
```

- name: `string`
- grade: `integer`
- data: `table`
  - label?: `string`
  - salary?: `integer` whole number, 0 or more

**Returns**
- ok: `boolean`
- err?: `'unknown_group'` | `'unknown_grade'` | `'invalid_label'` | `'invalid_salary'`

```lua
bzn.groups.updateGrade('police', 1, { salary = 800 })
```

### setGradePermissions

Replaces a grade's permissions.

```lua
bzn.groups.setGradePermissions(name, grade, permissions)
```

- name: `string`
- grade: `integer`
- permissions: `string[]` letters, digits and `. _ : -`

**Returns**
- ok: `boolean`
- err?: `'unknown_group'` | `'unknown_grade'` | `'invalid_permission'`

```lua
bzn.groups.setGradePermissions('police', 1, { 'account.view', 'armory' })
```

### removeGrade

Removes a grade nobody has.

```lua
bzn.groups.removeGrade(name, grade)
```

- name: `string`
- grade: `integer`

**Returns**
- ok: `boolean`
- err?: `'unknown_group'` | `'unknown_grade'` | `'last_grade'` | `'in_use'`

```lua
local ok, err = bzn.groups.removeGrade('police', 3)   -- 'in_use' while someone has it
```

### setPaidBy

Sets who pays the group's salary. `nil` follows the group type again.

```lua
bzn.groups.setPaidBy(name, paidBy?)
```

- name: `string`
- paidBy?: `'city'` | `'account'`

**Returns**
- ok: `boolean`
- err?: `'unknown_group'` | `'invalid_value'`

```lua
bzn.groups.setPaidBy('mechanic', 'account')   -- the shop pays its own staff
bzn.groups.setPaidBy('mechanic', nil)         -- back to the type default
```

### delete

Deletes a group. Refused while it has members, unless `force`: then everyone is removed
first.

```lua
bzn.groups.delete(name, opts?)
```

- name: `string`
- opts?: `table`
  - force?: `boolean`

**Returns**
- ok: `boolean`
- err?: `'unknown_group'` | `'has_members'`

```lua
local ok, err = bzn.groups.delete('tacos')
if err == 'has_members' then
    bzn.groups.delete('tacos', { force = true })
end
```

::: tip
The group's account and any salary it owes are kept. Money never disappears with a group.
:::
