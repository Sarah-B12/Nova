# Nova Epic

A browser-based multiplayer survival and management game set on **Maar**, a
planet that the corporation **AREPO** used as a testing ground for its seeds, then
left behind. The players descend from the AREPO staff who stayed. Five factions
share what is left of the **Silène** sector, alongside the **Protocole** — the
people who obeyed the evacuation order three centuries ago, and are still
waiting at the dock for a ship that never came.

Built solo, in **vanilla JavaScript with no framework and no build step**,
backed by **Supabase** (PostgreSQL, Auth, Row Level Security).

> 🎮 **Play:** https://nova-epic.pages.dev/

---

## What's in it

**Survival & management** — mine, farm, raise animals, craft, manage energy,
oxygen, health and morale. Items perish over time, in per-batch lots with
independent expiry dates; everything you equip wears out too.

**Player-run governments** — each faction elects a **Régent** every cycle, who
appoints an **Architecte** (defence), a **Stratège** (war) and an **Ombre**
(intelligence). A faction treasury collects market taxes and funds defence.

**Faction warfare** — the Stratège schedules expeditions 1 to 5 days ahead.
Members enlist; at the deadline the **server** resolves the battle on its own.
Four objectives — raid, pillage, sabotage, assault — each with its own risk and
reward profile.

**Espionage and theft** — hack the Protocole through timed minigames, pick
other players' pockets, post bounties, hunt thieves down.

**Ideological Circles** — five reputations earned through quest choices and
combat style. Nobody joins a Circle: you end up in one through what you do.

**A narrative campaign** — thirty quests across several maps (the surface of
Silène, the orbital sector of Triptolème, two planetary descents, the far-away
sector of Ancolie), with more than twenty kinds of challenges: riddles, lock-picking,
sequence and memory games, maze crawling, signal tracking, level-gated combat,
and choices that cost something.

**Shared life** — cooperative missions, a duel arena, a bar with games of
chance, marriages, children who grow up and write letters.

**Consequences that persist** — characters decline while you're away, and can
die. A 30-day grace period lets you resurrect; past that, the character is
permanently deleted. Pausing protects you, freezes item decay, and is capped.

---

## Technical notes

The interesting problem in this project isn't the gameplay — it's that a browser
game is a **hostile client**. Everything the player can see, the player can
change.

**Server-authoritative state.** Inventory, energy, gauges, credits, pause and
death all live in PostgreSQL. The browser holds a *mirror*, rewritten from the
server's response after every action. The guiding rule, learned the hard way:
*data owned by the server must have no persistent copy on the client.*

**Atomic actions.** A single RPC — `agir(cost, remove, add, …)` — handles energy,
item removal and item gain in one transaction. There is no intermediate state
where a player pays without receiving. Crafting uses an all-or-nothing flag so a
full inventory can't swallow the ingredients.

**Row Level Security, with a caveat.** RLS is row-level, not column-level: a
policy letting players update their own profile lets them update *every column*
of it, including their admin role. A trigger guards the sensitive ones.

**Scheduled work with pg_cron**, running inside Postgres — no external secrets,
no service_role key outside the server. Eleven jobs handle expedition
resolution, Protocole attacks, the daily turnover, quiet mode, complaints,
debris falls, children, the Protocole's register, missions and purges. Each task is isolated in its own
exception block so one failure can't roll back the others.

**Automated backups** to a separate private repository via GitHub Actions, with
a documented and rehearsable restore procedure.

---

## Stack

| | |
|---|---|
| Front | Vanilla JS, CSS, HTML — no framework, no build |
| Back | Supabase — PostgreSQL, Auth, RLS, `security definer` functions |
| Scheduling | pg_cron |
| CI | GitHub Actions (backups, keep-alive) |
| Hosting | Cloudflare Pages |

## Layout

```
index.html          Single page — everything is rendered in JS
css/                base, components, character sheet, map, terrain, skills
js/
  serveur.js        Supabase: auth, save/load, credits
  inventaire.js     Server-side inventory (bag, storage, ship hold, equipped)
  terrain.js        Plots, structures, harvesting
  gouvernement.js   Elections, offices, expeditions, combat
  quetes*.js        Quest engine and content
  espionnage.js     Intelligence and hacking minigames
  ...
```

---

## Status

In active development, in beta.

Built in French — code comments, UI and documentation are all in French, since
that's the language the game is written in.
