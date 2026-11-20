# Server

### owed

What a character is owed, per group. Works for offline characters.

```lua
bzn.payroll.owed(charId)
```

- charId: `integer`

**Returns**
- owed: `table<string, integer>` group → amount

```lua
local owed = bzn.payroll.owed(charId)   -- { mechanic = 400 }
```

### owedBy

What a group owes its people: online earnings not paid yet, and saved debts of offline
characters.

```lua
bzn.payroll.owedBy(group)
```

- group: `string`

**Returns**
- total: `integer`
- perCharacter: `table<integer, integer>` character id → amount

```lua
local total, people = bzn.payroll.owedBy('mechanic')
for charId, amount in pairs(people) do
    print(('character %d is owed %d'):format(charId, amount))
end
```

### collect

Pays a loaded character everything it is owed. For `collect` mode: a bank, a boss menu, a
city hall. Groups that cannot pay are left owed.

```lua
bzn.payroll.collect(charId)
```

- charId: `integer`

**Returns**
- paid: `integer`
- failed: `table<string, string>` group → reason (`'insufficient_funds'`, `'group_deleted'`, ...)

```lua
RegisterNetEvent('cityhall:collectPay', function()
    local character = bzn.characters.get(source)
    if not character then return end
    local paid, failed = bzn.payroll.collect(character.id)
    TriggerClientEvent('ox_lib:notify', source, { description = ('You collected $%d'):format(paid) })
end)
```

## Statement lines

Salary appears on the account statement with `type = 'salary'` and
`reason = 'Salary: <group label>'`.

## Hooks

### payroll:paid

`(charId, group, amount, paidBy)` Salary reached a character's account. `paidBy` is `'city'` or
`'account'`.
