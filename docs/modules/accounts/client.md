# Client

The local player's own accounts (those it may view), pushed by the server when they change.
For UI only; the server checks every action again.

### getAll

```lua
bzn.accounts.getAll()
```

**Returns**
- accounts: `table<integer, ClientAccount>` account id → [`ClientAccount`](../../types.md#clientaccount)

```lua
for id, account in pairs(bzn.accounts.getAll()) do
    print(account.label, account.balance)
end
```

### getPersonal

```lua
bzn.accounts.getPersonal()
```

**Returns**
- account?: [`ClientAccount`](../../types.md#clientaccount)

```lua
local personal = bzn.accounts.getPersonal()
if personal then
    print(personal.number, personal.balance)
end
```

### balance

The balance of an account, or of the personal account without an id.

```lua
bzn.accounts.balance(accountId?)
```

- accountId?: `integer`

**Returns**
- balance?: `integer`

```lua
local bank = bzn.accounts.balance()            -- personal
local shared = bzn.accounts.balance(accountId)  -- another account
```

### can

Whether the local player has a permission on an account. For showing buttons.

```lua
bzn.accounts.can(accountId, permission)
```

- accountId: `integer`
- permission: [`AccountPermission`](../../types.md#accountpermission)

**Returns**
- `boolean`

```lua
if bzn.accounts.can(accountId, 'withdraw') then
    showWithdrawButton()
end
```

### Cash

Cash is an item. Read it from ox_inventory:

```lua
local cash = exports.ox_inventory:Search('count', 'money')
```

## Hooks

```lua
bzn.hooks.on('accounts:changed', function(accounts) end)          -- the list was sent again
bzn.hooks.on('accounts:balance', function(accountId, balance) end) -- one balance changed
```

See [client hooks](../../hooks/client.md#accounts).
