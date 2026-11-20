# bzn_multichar

Character selection for bzn. The player's characters stand in a line in a scene; clicking
one moves the camera in on it (with a soft background) and shows its card: name, CPR, age,
height, nationality, jobs, bank, cash, last played and playtime. Repository:
[BZN-Development/bzn_multichar](https://github.com/BZN-Development/bzn_multichar).

The resource is only the UI. Slots, names, ages, CPR numbers, freezing and deletion are
bzn_core's rules (see [Players and characters](../characters/index.md)), so they hold
whatever UI a server uses.

## Install

```cfg
ensure bzn_core
ensure ox_inventory
ensure bzn_multichar
```

Requires bzn_core and ox_lib. When it starts it takes over character selection
([`useSelector`](../characters/server.md#useselector)); when it stops, core selects
automatically again.

## What the player sees

| Spot | |
| --- | --- |
| a character | its name and main job above it; hover highlights the name, click to move in |
| frozen | marked *Frosset*; the card shows the staff member's reason and **Spil** is off |
| waiting for deletion | marked *Afventer sletning*; the player can take the request back |
| free slot | *+ Ny karakter*: the camera moves in on a stand-in ped and the creation form opens |
| locked slot | the slots up to `slots.max` the user does not have (`showLockedSlots`) |

Characters stand oldest first (by character id), so each keeps its place. When one is
picked, the others turn see-through. In the card, ← → switch between characters and Esc
goes back. A new character is played
right after it is created (`playAfterCreate`).

The creation form asks for what the `identity` config asks for (height and nationality
required, optional or not at all) and checks it the same way the server does, so mistakes
show before anything is sent. The CPR number is made by core.

## Into the world

When Play is pressed the card fades away and the camera moves in on the character's face.
Then it rises into the sky, flies to where the character spawns, waits there while the world
loads, and comes down behind the character before handing over to the game camera. The
world streams in while the camera is high up, so nothing pops in on screen. A new character
takes the same way after it is created.

## Config

`config.lua` in the resource. Everything about the rules is in bzn_config instead.

| Option | Default | |
| --- | --- | --- |
| `serverName` | `'BZN Development'` | shown above the title |
| `currency`, `numberLocale` | `'DKK'`, `'da-DK'` | money in the card |
| `showLockedSlots` | `true` | show slots the user does not have, up to `slots.max` |
| `lockedSlotHint` | `nil` | text under a locked slot, e.g. where to get more |
| `playAfterCreate` | `true` | play a new character at once |
| `scene.center`, `scene.heading` | Galileo Observatory | where the line stands and the way it faces (towards the camera) |
| `scene.spacing`, `scene.curve` | `1.25`, `0.14` | metres between characters, how much the ends bend forward |
| `scene.maxSpots` | `8` | most spots shown |
| `scene.camera` | | overview camera: `distance`, `height`, `lookHeight`, `fov` |
| `scene.focus` | | camera on a picked character: `distance`, `height`, `shift` (sideways), `fov`, `duration` (ms) |
| `scene.time`, `scene.weather` | 17:00, `EXTRASUNNY` | while selecting |
| `scene.idles` | scenarios | what each spot's character does while waiting |
| `scene.greeting` | wave | played once when a character is picked |
| `scene.markers` | `false` | rings on the ground under the hovered spot and the free spots |
| `scene.dimOthers` | `250` | how see-through the other characters are while one is picked (0-255, `false` = solid) |
| `scene.playPushIn` | `1400` | ms the camera moves in on the face when Play is pressed |
| `spawnTransition.enabled` | `true` | into the world through the sky (below); `false` = fade to black |
| `spawnTransition.height` | `220.0` | metres above the ground the camera flies |
| `spawnTransition.rise`, `land`, `handover` | `1800`, `2400`, `900` | ms to go up, to come down behind the character, and to blend into the game camera |
| `spawnTransition.flightSpeed`, `flightMin`, `flightMax` | `1400`, `2200`, `4500` | flight speed (m/s) and its time limits (ms) |
| `previewModel(character)`, `applyAppearance(ped, character)` | placeholders | how a character looks in the scene (below) |

### Moving the scene

Stand where the line should be, face where the camera should be, and run
`/multichar_here` (admins). The line appears around you, and the two lines to put in
`Config.scene` are printed in F8. Backspace closes the preview. Every spot is put on the
ground, so `center.z` only has to be roughly right.

### Looks

Until bzn has its own appearance resource, characters are shown as dressed ambient peds,
picked from `placeholderModels` by character id (so each always looks the same). An
appearance resource replaces two functions in `config.lua`:

```lua
function Config.previewModel(character)
    return character.sex == 'f' and 'mp_f_freemode_01' or 'mp_m_freemode_01'
end

function Config.applyAppearance(ped, character)
    exports.my_appearance:apply(ped, character.id)
end
```

## Languages

Texts are in `locales/<lang>.json` and follow ox_lib's language (`setr ox:locale "da"`).
English is the fallback for missing keys. Server error codes are shown as `err_<code>`.

## Changing the UI

The UI is Svelte, in the `bzn_ui` workspace (`apps/multichar`). It builds straight into
`web/dist` of the resource:

```sh
cd bzn_ui
pnpm install
pnpm build              # every app
pnpm dev:multichar      # in a browser with sample data, http://localhost:5174
```

`web/dist` is committed, so a server never has to build anything.

## Each player alone

While selecting, each player is in a routing bucket of their own with no traffic or
pedestrians, so nobody sees anyone else's lineup. Core puts the player back in the right
bucket when the character spawns.
