# Hooks

Hooks are how you extend bzn without editing it. There are two kinds:

- **Before-hooks** (`<area>:before<Action>`) run before something happens and can stop it
  by returning `false, '<reason>'`. The reason is returned to whoever asked for the action.
- **After-hooks** (`<area>:<event>`) tell you something happened. They cannot stop anything.

```lua
-- Server: no more than 20 police officers.
bzn.hooks.on('groups:beforeAdd', function(charId, name, grade)
    if name == 'police' and bzn.groups.countOnDuty('police') >= 20 then
        return false, 'police_full'
    end
end)

-- Server: welcome message.
bzn.hooks.on('character:loaded', function(src, character)
    TriggerClientEvent('chat:addMessage', src, { args = { 'Welcome back, ' .. character.firstName } })
end)
```

## Rules

- `bzn.hooks.on(name, fn, { priority = n })` returns an id; `bzn.hooks.off(id)` removes it.
  Higher priority runs first (default 0). For before-hooks, the first rejection stops the
  rest.
- Hooks are **local to their side**: a server hook never fires on a client.
- Handlers from your resource are **removed when it stops**.
- In another resource, tables you receive are **copies**: changing them changes nothing in
  core. Use the API to change things.
- Every after-hook is also a local event `bzn:<name>`, so `AddEventHandler('bzn:character:loaded', ...)`
  works too (not across the network).
- Hook handlers run synchronously in the middle of the action. Keep them short; start a
  thread (`CreateThread`) for slow work.

## Server hooks

### Core

| Hook | Arguments | Notes |
| --- | --- | --- |
| `core:ready` | | bzn_core and every module started |
| `module:started` | `name` | |
| `player:beforeConnect` | `src, { name, identifiers }` | before-hook: `return false, 'message shown to the player'` (bans, whitelist) |
| `player:identified` | `src, player` | joined; `player.userId`, `player.role` |
| `player:stateChanged` | `src, state, from` | `identified`, `selecting`, `loaded`, `unloading` |
| `player:dropping` | `src, player, reason` | still registered; the character unloads here |
| `player:dropped` | `src, player, reason` | gone |
| `character:beforeCreate` | `src, data` | before-hook |
| `character:created` | `src, character` | |
| `character:beforeDelete` | `src, character` | before-hook |
| `character:deleted` | `src, character` | soft-deleted |
| `character:selecting` | `src` | a selector UI should show the player's characters |
| `character:loading` | `src, character` | before-hook; modules load their data here |
| `character:loaded` | `src, character` | everything is loaded |
| `character:starter` | `src, character` | first load: give your part of the starter kit |
| `character:unloading` | `src, character, reason` | save and clean up here; `logout`, `dropped` or `shutdown` |
| `character:unloaded` | `src, character, reason` | |
| `spawn:beforeSpawn` | `src, character, point` | before-hook; change `point` in place (server only, same resource) |
| `spawn:spawned` | `src, character, point` | the client confirmed the spawn |
| `role:changed` | `userId, role, old, src` | `src` is nil if the user is offline |

### Groups

| Hook | Arguments | Notes |
| --- | --- | --- |
| `groups:beforeAdd` | `charId, name, grade` | before-hook |
| `groups:added` | `charId, name, grade, src` | `src` nil if offline |
| `groups:beforeSetGrade` | `charId, name, grade, old` | before-hook |
| `groups:gradeChanged` | `charId, name, grade, old, src` | |
| `groups:beforeRemove` | `charId, name, grade` | before-hook |
| `groups:removed` | `charId, name, grade, src` | |
| `groups:beforeDuty` | `charId, name, previous` | before-hook; `name` nil = going off duty |
| `groups:dutyChanged` | `charId, name, previous, src` | `name` nil = off duty |
| `groups:beforeCreate` | `name, def` | before-hook |
| `groups:created` | `name` | |
| `groups:updated` | `name, field, loadedMembers` | label, grade, grades, permissions or paidBy changed |
| `groups:deleted` | `name` | |

### Accounts

| Hook | Arguments | Notes |
| --- | --- | --- |
| `accounts:beforeTransaction` | `data` | before-hook; `data.kind` = `credit`, `debit`, `transfer` or `creditMany` |
| `accounts:transaction` | `data` | after commit, with the new balances |
| `accounts:created` | `account` | |
| `accounts:changed` | `accountId, action, detail` | member, freeze, rename or close |
| `accounts:cash` | `{ source, charId, amount, entry }` | cash given (+) or taken (-) |

### Payroll and status

| Hook | Arguments | Notes |
| --- | --- | --- |
| `payroll:paid` | `charId, group, amount, paidBy` | salary reached the account; `paidBy` = `city` or `account` |
| `status:changed` | `charId, name, value, reason` | set or added (eating, admin), not the slow change over time |
| `status:empty` | `charId, name` | reached 0 |
| `status:recovered` | `charId, name` | left 0 again |

## Client hooks

| Hook | Arguments | Notes |
| --- | --- | --- |
| `core:ready` | | |
| `module:started` | `name` | |
| `character:selecting` | | open your character selection UI |
| `character:loaded` | `character` | |
| `character:unloaded` | `reason` | |
| `spawn:spawned` | `point` | |
| `role:changed` | `role` | |
| `groups:changed` | `memberships, duty` | |
| `groups:dutyChanged` | `duty, previous` | |
| `accounts:changed` | `accounts` | the account list was sent again |
| `accounts:balance` | `accountId, balance` | one balance changed |
| `status:changed` | `name, value, rate` | a new anchor arrived |
