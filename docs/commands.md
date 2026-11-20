# Commands

Everything is under one command, `bzn`. It works in the server console, and in game for
players with the ACE `command.bzn` (admins get it through `group.admin`). Every use is
written to the server log with who ran it.

`bzn` on its own lists the subcommands.

## Targets

| Form | Means |
| --- | --- |
| `12` | the online player with server id 12 |
| `char:34` | character 34, online or offline |
| `user:5` | user 5 (roles, slots, characters) |
| `license:abc…`, `fivem:123`, `discord:…` | the user who has connected with that identifier (slots, characters) |
| `group:police` | the police group's account (accounts only) |
| `acc:7` | account 7 (accounts only) |
| `4821-093317` | an account number (accounts only) |

## Core

```
bzn modules                      every module and its status
bzn save                         write all pending saves now
bzn config <section>             the merged config of a section
```

`/logout` (for players) goes back to character selection.

## Characters and slots

```
bzn slots info <target>
bzn slots add <target> <amount> [note]
bzn slots remove <target> <amount> [note]

bzn char list <target>             every character of a user, deleted ones included
bzn char info <charId>
bzn char freeze <charId> <reason>  the reason is shown to the player
bzn char unfreeze <charId>
bzn char deletions                 characters waiting for a deletion to be approved
bzn char approve <charId>
bzn char deny <charId> [reason]
bzn char restore <charId>          bring a deleted character back
```

A user has `slots.base` slots plus what `bzn slots add` gives, never more than `slots.max`.
Removing slots never touches characters: a user with more characters than slots just
cannot create new ones.

Because the console can target offline users by identifier, a web store can give slots
after a purchase. With Tebex, a command like this (check the variable names your store
offers):

```
bzn slots add fivem:{id} 1 tebex {transaction}
```

`/multichar_here` (admins, from [bzn_multichar](addons/multichar.md)) shows the selection
scene where you stand.

## Roles

```
bzn role list
bzn role set <id|user:<id>> <mod|admin|senioradmin|dev>
bzn role remove <id|user:<id>>
```

In game you can only change roles below your own. See [Staff roles](roles.md).

## Groups

```
bzn groups list [type]
bzn groups info <group>
bzn groups player <target>
bzn groups add <target> <group> <grade>
bzn groups grade <target> <group> <grade>
bzn groups remove <target> <group>
bzn groups duty <target> <group|off>
bzn groups create <name> <type> <label...>                 grades 0 Member, 1 Owner
bzn groups label <group> <label...>
bzn groups addgrade <group> <grade> <salary> <label...>
bzn groups editgrade <group> <grade> <salary|label> <value...>
bzn groups perms <group> <grade> [permission ...]           replaces them; none clears
bzn groups delgrade <group> <grade>                         only if nobody has it
bzn groups paidby <group> <city|account|default>
bzn groups delete <group> [force]                           force removes all members first
```

Admin commands always use `force` for owner protection: they can remove or demote the last
owner. Type limits, conflicts and before-hooks still apply.

## Accounts

```
bzn accounts info <account|id|char:<id>>       a character's accounts, or one account with members
bzn accounts tx <account> [count]              newest transactions
bzn accounts audit <account> [count]           member, freeze and rename history
bzn accounts give <account> <amount> [reason...]
bzn accounts take <account> <amount> [reason...]      also from frozen accounts
bzn accounts freeze <account> <reason...>
bzn accounts unfreeze <account>
bzn accounts cash <id> <+amount|-amount>
bzn accounts reload <account>                  read again from the database after a manual edit
```

The admin is recorded as the actor on every statement line.

## Vehicles

A vehicle is its id, `vin:<VIN>` or `plate:<PLATE>` (registered plate).

```
bzn vehicles list <target>
bzn vehicles info <vehicle>
bzn vehicles give <target> <model> [garage]
bzn vehicles spawn <vehicle> <server id>            next to that player
bzn vehicles park <vehicle> <garage>
bzn vehicles plate <vehicle> <plate>                re-register
bzn vehicles fakeplate <vehicle> <plate|off>
bzn vehicles repair <vehicle>
bzn vehicles impound <vehicle> <fee> [reason...]
bzn vehicles release <vehicle> [garage]             free, also before the release time
bzn vehicles keys <vehicle>
bzn vehicles givekey <vehicle> <target> [minutes]
bzn vehicles removekey <vehicle> [target]           no target = every key
bzn vehicles keyitem <vehicle> <server id>          a key item
bzn vehicles changelocks <vehicle>                  old keys stop working
bzn vehicles lock <vehicle>                         toggle (vehicle must be out)
bzn vehicles delete <vehicle>
```

## Payroll

```
bzn payroll status
bzn payroll owed <id|char:<id>>
bzn payroll debts <group>
bzn payroll payout
bzn payroll collect <id>
bzn payroll tick <minutes>          bzn:debug 1 only
```

## Status

```
bzn status <id>
bzn status <id> <name> <value>
bzn status <id> all <value>
```

## Adding your own

From a bzn module:

```lua
bzn.commands.register('garages', 'garages <list|impound> ...', function(src, args, out)
    out('you said %s', args[1] or 'nothing')   -- replies in chat or the console
end)
```
