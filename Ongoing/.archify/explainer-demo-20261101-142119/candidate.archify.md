# How do we demonstrate SurakshaSetu? {#demo}

Show the **local web app**, then Module 1 analysis. Citizens save reports and Risk Alerts to a JSON file. The pipeline clusters them. This demo does **not** call 112.

- Sign in as `citizen` / `suraksha-demo` before you file anything.
- The store is an in-app record, not a police FIR.
- Hotspots need 3 points in a 0.01 degree cell. Empty cells are not safe.

@answer scope="Local demo on 127.0.0.1:3000. HMAC accounts. No 112 dispatch."
@meta locale=en

## What do we open first? {#open}

@workflow id=demo-flow title="Demonstration order"
| lane show | Show |
| start | Open localhost | external | show |
| login | Citizen login | security | show |
| report | File a report | frontend | show |
| sos | Two-press alert | frontend | show |
| map | Safety map | frontend | show |
| auth | Authority review | backend | show |
| start > login | |
| login > report | citizen | emphasis |
| report > sos | |
| sos > map | |
| map > auth | supervisor |

@steps id=demo-steps
| start | Open localhost | Run `npm run dev` in `Ongoing/web`. Open `127.0.0.1:3000`. | demo-flow | start |
| login | Citizen login | Username `citizen`, password `suraksha-demo`. | demo-flow | login |
| report | File a report | Use Report an Incident. Add GPS if the browser allows it. | demo-flow | report |
| sos | Two-press alert | Press Risk Alert once, then again within 3 seconds. | demo-flow | sos |
| map | Safety map | Say the overlay is labelled demo until a reviewer verifies rows. | demo-flow | map |
| auth | Authority review | Log out. Sign in as `supervisor` / `suraksha-demo`. | demo-flow | auth |

## What is live in this demo? {#live}

| Piece | Show this | Do not claim |
| --- | --- | --- |
| Citizen reports | Row appears in My Reports {good:Live} | Not a police FIR |
| Risk Alert | In-app SOS id is saved {good:Live} | Does not call 112 {bad:No dispatch} |
| Safety map | Page and demo points load | Not a live crime map {caution:Demo overlay} |
| Module 1 | Grid hotspots, min 3 points {good:Method} | Empty cell is not safe |
| Notices | In-app inbox | No SMS to a phone {bad:No SMS} |

## What must the audience hear? {#say}

@callout level=warning title="Say these three lines"
| This is a decision-support demo, not a control room. |
| A street with no reports is unknown, not safe. |
| If someone is in danger, call 112. |

- [ ] App is running at `127.0.0.1:3000`
- [ ] Citizen login works
- [ ] One report or one Risk Alert is saved
- [ ] Supervisor workspace opens
- [ ] You stated that 112 is not called
