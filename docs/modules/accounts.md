# Accounts

Every balance in bzn: personal bank accounts, shared accounts, group accounts, and cash.

## Money you can trust

- **The database is the only truth.** Every money operation is one database transaction
  that changes the balance and writes a statement line together, or does neither.
- **Never negative.** A withdrawal only succeeds if the money is there at that moment. A
  hundred withdrawals at the same instant cannot spend the same money twice (tested: 100
  simultaneous withdrawals of 10 from 750 give exactly 75 successes and a balance of 0).
- **Whole numbers only.** No `123.43`. Amounts are integers everywhere.
- **Balances are cached for reading** and updated from each committed result, so a balance
  shown anywhere is never ahead of the database. Players get their balances pushed when they
  change; nothing polls.

## Account types

| Type | Owner | Who can use it |
| --- | --- | --- |
| `personal` | a character (one each, created automatically) | only the owner |
| `shared` | a character, who can add members | the owner, and members with the permissions they were given |
| `group` | a group (one each, created automatically) | members by their grade's `account.*` permissions; group owners have all |

Every account has a number like `4821-093317`.

## Permissions

`view`, `deposit`, `withdraw`, `transfer`, `manage` (manage includes the others).

```lua
bzn.accounts.can(charId, accountId, 'withdraw')   -- true / false
bzn.accounts.permissions(charId, accountId)       -- { 'view', 'deposit' }
```

For group accounts the permissions are group permissions on the grade:
`account.view`, `account.withdraw` and so on (see [Groups](groups.md#permissions)).

## Moving money

```lua
-- A script gives money (trusted: no permission check)
local ok, balance = bzn.accounts.credit(accountId, 500, { type = 'reward', reason = 'Delivery' })

-- A player acts: pass charId and the permission is checked inside the call
local ok, err = bzn.accounts.debit(accountId, 200, { charId = charId, type = 'purchase', reason = 'Burger' })
```

| Function | Permission with `charId` | Errors |
| --- | --- | --- |
| `credit(id, amount, info?)` | `deposit` | `invalid_amount`, `amount_too_large`, `not_found`, `no_permission`, hook reason |
| `debit(id, amount, info?)` | `withdraw` | as above, plus `frozen`, `insufficient_funds` |
| `transfer(fromId, toId, amount, info?)` | `transfer` on the sender | as above, plus `same_account`, `recipient_not_found` |
| `creditMany(rows, info?, payerId?)` | trusted only | `rows = { { id, amount }, ... }`; all or nothing |

`info = { type?, reason?, actor?, charId?, allowFrozen? }`:

- `type` and `reason` appear on the statement (`'salary'`, `'Salary: Police'`).
- `actor` is who did it; without it, `char:<id>` or the calling resource is recorded.
- `charId` makes the call act as that character and checks its permission.
- `allowFrozen` lets a trusted caller (staff) take money from a frozen account. It is
  ignored when `charId` is set.

`creditMany` pays many accounts in one transaction (salaries, refunds, events). With
`payerId` the total is taken from that account first; if it cannot pay, nobody is paid.

## Reading

| Function | Returns |
| --- | --- |
| `get(id)` | `{ id, number, type, label, balance, frozen, frozenReason, ownerCharacterId, groupName }` |
| `getByNumber(number)` | same |
| `getPersonal(charId)` | the character's personal account (created if missing) |
| `getGroup(name)` | the group's account (created if missing) |
| `forCharacter(charId)` | every account the character can see |
| `balance(id)` | number |
| `transactions(id, limit?, beforeId?)` | newest first, paged: `{ id, amount, balance_after, type, reason, actor, counterparty_id, created_at }` |
| `audit(id, limit?)` | member, freeze and rename history |

## Cash

Cash is the ox_inventory item `money` (config `cashItem`): it can be dropped, stolen and
found in a search like any item.

| Function | |
| --- | --- |
| `cash(src)` | cash a player carries |
| `addCash(src, amount, info?)` | errors `cannot_carry`, `no_inventory`, `not_loaded` |
| `removeCash(src, amount, info?)` | all or nothing; error `insufficient_cash` |
| `depositCash(src, accountId, amount)` | an ATM: needs `deposit`; cash given back if the account refuses |
| `withdrawCash(src, accountId, amount)` | an ATM: needs `withdraw`; money goes back if it cannot be carried |

### Paying in shops

```lua
local ok, method = bzn.accounts.pay(src, 120, {
    method = 'auto',            -- 'cash', 'bank' or 'auto' (cash if enough, else bank)
    type = 'purchase', reason = '24/7',
    to = shopAccountId,         -- optional: the shop's group account receives it
})
-- ok = true, method = 'cash' | 'bank'; or ok = false, method = 'insufficient_funds' ...
```

`pay` never splits an amount between cash and bank.

## Shared accounts

```lua
local ok, account = bzn.accounts.createShared(charId, 'Family savings')
bzn.accounts.setMember(account.id, otherCharId, { 'deposit', 'withdraw' }, { charId = charId })
bzn.accounts.removeMember(account.id, otherCharId, { charId = charId })
bzn.accounts.setLabel(account.id, 'Holiday fund', { charId = charId })
bzn.accounts.close(account.id, { charId = charId })   -- only when empty
```

- Members always have `view`. `opts.charId` is the character doing it and needs `manage`;
  a member may always remove itself. Without `opts.charId` the call is trusted.
- `close` needs the owner and an empty account (`not_empty`): money never disappears with
  an account.
- Errors: `not_shared`, `no_permission`, `invalid_permission`, `unknown_character`,
  `is_owner`, `not_member`, `limit_reached`, `invalid_label`.
- `members(id)` lists `{ charId, permissions }`.

## Freezing

Staff and scripts only; no character permission allows it.

```lua
bzn.accounts.freeze(accountId, 'Under investigation', { actor = 'admin:Ben' })
bzn.accounts.unfreeze(accountId, { actor = 'admin:Ben' })
```

A frozen account cannot send money; incoming money still arrives. Freezes, members and
renames are written to `bzn_account_audit` in the same transaction as the change.

## Client

The local player's own accounts (those it can view), pushed by the server:

```lua
bzn.accounts.getAll()        -- { [id] = { id, number, type, label, balance, frozen, permissions } }
bzn.accounts.getPersonal()
bzn.accounts.balance()       -- personal, or balance(id)
bzn.accounts.can(id, 'withdraw')
```

Hooks `accounts:changed (accounts)` and `accounts:balance (accountId, balance)`.

## Config

Server (`bzn_config/server/accounts.lua`):

| Option | Default | |
| --- | --- | --- |
| `startingBalance` | `0` | bank balance of a new character |
| `startingCash` | `0` | cash given on first load |
| `maxAmount` | `1000000000` | largest single operation |
| `maxSharedPerCharacter` | `3` | shared accounts one character may own |
| `maxMembers` | `10` | members of one shared account |
| `cashItem` | `'money'` | the ox_inventory item that is cash |

Shared: `currency = '$'` for UIs.

## Not in core

Loans, cards, fees and invoices belong in separate resources built on this API: a loan is
a `credit` plus its own table of debt (a balance never goes negative), repayments are
`debit` calls, and `freeze` handles defaulters.
