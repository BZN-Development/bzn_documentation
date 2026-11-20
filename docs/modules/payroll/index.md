# Payroll

Salary for time on duty. Depends on [groups](../groups/) and [accounts](../accounts/).

- **[Server](server.md)**: what is owed, collecting, what a group owes.

## How it works

- **Earning**: every minute a character is on duty, it earns its grade's salary divided by
  `salaryPeriod` (by default the salary is per hour: a Chief with 1200 earns 20 a minute).
  This is counted in memory; fractions carry over.
- **Paying**, set by `mode`:
  - `auto`: everything earned is paid every `interval` minutes, in **one transaction per
    group** for everyone at once, and on logout.
  - `collect`: earnings wait until the character collects them (`payroll.collect`, e.g. at
    a bank or from the boss). They survive logouts, crashes and restarts.
- **Who pays** is set on each group (`paidBy`):
  - `city`: new money (police, EMS, city jobs).
  - `account`: the group's own account. If it cannot pay, the salary stays **owed** and is
    paid as soon as the money is there.

The database is touched only when paying, on logout, and (in collect mode) with the save
system. Owed salary lives in `bzn_payroll_owed`; duty time itself is not stored.

### Crash safety

Salary already saved as owed is lowered in the database **before** it is paid and put back
if paying fails. A crash in between can lose that one payment, but never pays it twice.

## Who pays: per group, in game

```
bzn groups paidby mechanic account
bzn groups paidby police city
bzn groups paidby mechanic default     # follow the group type again
```

The default per group type is in the groups config (`types.<type>.paidBy`). An admin menu
calls `bzn.groups.setPaidBy(name, value)`.

## Config

Server (`bzn_config/server/payroll.lua`):

| Option | Default | |
| --- | --- | --- |
| `mode` | `'auto'` | `'auto'` or `'collect'` |
| `interval` | `10` | minutes between automatic payouts |
| `salaryPeriod` | `60` | a grade's salary is for this many minutes on duty |

## Commands

```
bzn payroll status              mode, interval, who is on duty and who pays
bzn payroll owed <target>       what a character is owed
bzn payroll debts <group>       what a group owes its people
bzn payroll payout              pay everything earned now
bzn payroll collect <id>        collect for an online player
bzn payroll tick <minutes>      fast-forward duty time (bzn:debug 1 only)
```

## Hooks

[Server hooks](../../hooks/server.md#payroll)
