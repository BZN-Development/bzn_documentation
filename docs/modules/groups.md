# Groups

Jobs, gangs, businesses and anything else are one thing in bzn: a **group**. A group has a
type, grades, and members. One model means one set of rules, one admin tool and one API,
whether it is the police or a taco stand.

## The model

- A **group** has a name (`police`), a label (`Police`), a **type** (`job`, `gang`,
  `business`, or your own) and who pays its salary (`paidBy`).
- A **grade** has a number (0-255), a label, a salary (per hour on duty, see
  [Payroll](payroll.md)) and a list of **permissions**.
- A **member** is a character at one grade. A character can be in several groups, limited
  per type.
- **Owners**: a grade with the permission `owner` has every permission. A group can have
  several owners, and the last owner cannot be removed or demoted except by an admin.
- **Duty**: a character is on duty in at most one group at a time (no double salary).

Groups live in the database. Config only creates them on the first start (`seed`); after
that they are managed in game, with commands or an admin menu, without restarts.

## Config

Shared (`bzn_config/shared/groups.lua`):

```lua
return {
    types = {
        job      = { limit = 2, duty = true,  paidBy = 'city' },
        gang     = { limit = 1, duty = false, paidBy = 'account' },
        business = { limit = 1, duty = true,  paidBy = 'account' },
    },
}
```

| Option | |
| --- | --- |
| `limit` | groups of this type one character may be in |
| `duty` | whether the type has on/off duty |
| `paidBy` | default payer of salary: `'city'` (new money) or `'account'` (the group's account) |

Server (`bzn_config/server/groups.lua`):

```lua
return {
    -- Created on the first start only; then managed in game.
    seed = {
        police = {
            label = 'Police', type = 'job',
            grades = {
                [0] = { label = 'Cadet', salary = 500 },
                [1] = { label = 'Officer', salary = 750, permissions = { 'account.view' } },
                [2] = { label = 'Chief', salary = 1200, permissions = { 'owner' } },
            },
        },
    },
    -- Groups a character cannot be in at the same time. A side is a group name or 'type:<type>'.
    conflicts = {
        { 'police', 'type:gang' },
    },
    -- Give players ACE principals for their groups.
    ace = true,
}
```

## Permissions

Permissions are free-form strings on a grade. bzn itself uses:

| Permission | Used by |
| --- | --- |
| `owner` | everything; owner protection |
| `account.view`, `account.deposit`, `account.withdraw`, `account.transfer`, `account.manage` | the group's [account](accounts.md) |

Your resources add their own (`armory`, `garage.impound`, `boss.hire`):

```lua
if bzn.groups.hasPermission(charId, 'police', 'armory') then ... end
```

## ACE

With `ace = true` every player gets principals for their groups, kept up to date as they
join, change grade, go on duty or leave:

| Principal | Who |
| --- | --- |
| `bzn.group.<name>` | every member |
| `bzn.group.<name>.<grade>` | members at that grade or higher |
| `bzn.duty.<name>` | members on duty |

```cfg
add_ace bzn.group.police.2 command.impound allow
add_ace bzn.duty.police armory.police allow
```

## Server API

**Reading**

| Function | Returns |
| --- | --- |
| `groups.get(name)` | `{ name, label, type, paidBy, grades = { [grade] = { label, salary, permissions = {...} } } }` |
| `groups.list(type?)` | list of groups |
| `groups.getMemberships(charId)` | `{ [group] = grade }` (online or offline) |
| `groups.has(charId, name, minGrade?)` | boolean |
| `groups.hasPermission(charId, name, permission)` | boolean (owners: always true) |
| `groups.getDuty(charId)` | group name or nil |
| `groups.isOnDuty(charId, name)` | boolean |
| `groups.countOnDuty(name)` | number (e.g. police needed for a robbery) |
| `groups.paidBy(name)` | `'city'` or `'account'` |
| `groups.getPrincipals(src)` | ACE principals a player has from groups |

**Members**

| Function | Errors |
| --- | --- |
| `groups.add(charId, name, grade)` | `unknown_group`, `unknown_grade`, `already_member`, `limit_reached`, `conflict`, hook reason |
| `groups.setGrade(charId, name, grade, { force? })` | `unknown_group`, `unknown_grade`, `not_member`, `last_owner`, hook reason |
| `groups.remove(charId, name, { force? })` | `unknown_group`, `not_member`, `last_owner`, hook reason |
| `groups.setDuty(charId, name?)` | `not_loaded`, `unknown_group`, `not_member`, `no_duty`, hook reason |

`force` skips owner protection (for admins). Going on duty in one group goes off duty in
the previous one; `nil` goes off duty.

**Managing groups** (admin menu)

| Function | Errors |
| --- | --- |
| `groups.create(name, { label, type, paidBy?, grades })` | `already_exists`, validation errors, hook reason |
| `groups.setLabel(name, label)` | `unknown_group`, `invalid_label` |
| `groups.addGrade(name, grade, { label, salary?, permissions? })` | `invalid_grade`, `grade_exists`, `invalid_label`, `invalid_salary`, `invalid_permission` |
| `groups.updateGrade(name, grade, { label?, salary? })` | `unknown_grade`, `invalid_label`, `invalid_salary` |
| `groups.setGradePermissions(name, grade, { ... })` | `unknown_grade`, `invalid_permission` |
| `groups.removeGrade(name, grade)` | `last_grade`, `in_use` |
| `groups.setPaidBy(name, 'city' \| 'account' \| nil)` | `invalid_value`; `nil` follows the type |
| `groups.delete(name, { force? })` | `has_members` (without force) |

Every change applies at once: online members get their principals and account access
updated. Deleting a group keeps its account and any salary it owes.

## Client API

The client knows only its own memberships:

```lua
bzn.groups.getMemberships()      -- { police = 2 }
bzn.groups.has('police', 1)
bzn.groups.getDuty()             -- 'police' or nil
bzn.groups.isOnDuty('police')
```

Hooks `groups:changed (memberships, duty)` and `groups:dutyChanged (duty, previous)`.

## Commands

See [Commands](../commands.md#groups).
