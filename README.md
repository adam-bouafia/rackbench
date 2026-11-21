# Rackbench

**A data center rack, from order to shipping.**

Walk through the life of a data center rack: build it from the order, check every cable, power it on through the BMC, burn it in, find the failing part, write the report and ship it. You learn it in the browser with 25 animated lessons and a game, then do it for real on a three-node rack you run yourself.

**Live: https://rackbench.vercel.app**

![Rackbench: the lab map, the seven chapters and the way in](docs/screenshots/overview.webp)

## What you can do

- **Learn.** 25 lessons in seven chapters, from what is inside a two-socket server to GPU racks: Foundations, Server architecture, Out of band (the BMC), Boot and firmware, Rack networking, Testing a rack, Deep dives. A step-through lesson draws the devices as isometric blocks, sends each message along its route with a travelling packet, updates live metrics and explains every step with the decoded fields and the raw output. Each one has a Diagram, a Sequence and a Packets view, with Replay and Pause.
- **Play Rack Shift.** One shift on a rack integration floor, three orders: an edge rack, a storage rack and a GPU rack. For each one you build the rack by the placement rules, check every cable against the plan with LLDP, power it on and check every server against the order and the firmware baseline, burn it in and read the results against the test plan, fix and retest, then write the report with evidence and root cause and ship it. The faults change every shift, and QA shows you what you missed.
- **Practice.** A fault hunt (one hidden fault in a simulated rack, a terminal, the clock) and a 15-question quiz.
- **Rack Lab.** Build a 24U rack freely and check it against the integration rules: redundant feeds, the 80% power rule, switches on top, heavy servers low, blanking panels.
- **Cheatsheets.** ipmitool, Redfish, inventory, burn-in, network, boot, drives and power, Windows and PowerShell, cabling: filterable, one click to copy.
- **Run it yourself.** 13 hands-on labs, step by step, on the real three-node rack of [rackbench-lab](https://github.com/adam-bouafia/rackbench-lab).

Every page fits one screen. Next to the search are buttons to hide the course, show the diagram only, go full screen and list the keyboard shortcuts. Search (Ctrl K) covers lessons and commands; the interface switches between English, French and Dutch (the lessons are in English); light and dark themes.

## Screenshots

| | |
|---|---|
| ![A lesson: powering on a server over IPMI, step by step](docs/screenshots/lesson.webp) | ![Packets view of the network boot lesson](docs/screenshots/packets.webp) |
| A lesson: IPMI power-on, packet by packet | Packets view: network boot as a capture tool shows it |
| ![Rack Shift: building the rack, two rules not met](docs/screenshots/rackshift-build.webp) | ![Rack Shift: a slow drive found in the burn-in results](docs/screenshots/rackshift-burnin.webp) |
| Rack Shift, Build: the placement rules say what is wrong | Rack Shift, Burn-in: one drive 31% under the median |
| ![Dark theme: the GPU server lesson](docs/screenshots/dark.webp) | ![Rack Lab: a 24U rack checked against the integration rules](docs/screenshots/racklab.webp) |
| Dark theme: GPU servers, what changes | Rack Lab: free rack building with power checks |

## The lab behind it

Every lesson has a counterpart in [rackbench-lab](https://github.com/adam-bouafia/rackbench-lab): three Ubuntu nodes on KVM that report like two-socket servers, emulated BMCs that answer IPMI and Redfish, OpenBMC firmware in QEMU, iPXE network boot, a rack-wide BIOS update drill and a fault injector with 11 faults. Rackbench shows how it works; the lab is where you do it.

The traces are illustrative and the numbers simulated. Not affiliated with any hardware vendor.

## Run it locally

Node.js 24.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # static files in dist/
```

## Optional features

Their keys live in `.env.local` or in the Vercel project settings, never in git (`.gitignore` excludes every `.env` file). See `.env.example`.

- Ask the rack: a question box that sends the current lesson and step to a model through the Vercel AI Gateway (`api/ask.ts`). Build with `VITE_ASSISTANT=1`. On Vercel the function authenticates with the project's OIDC token; locally it uses `AI_GATEWAY_API_KEY` or the token that `vercel link` writes to `.env.local`. The function limits question length, answer length and requests per visitor; also set a spend limit for AI Gateway in the Vercel dashboard.
- Narration: `node scripts/narrate.ts` counts the characters of every lesson step and estimates the ElevenLabs credits; with `--yes` and `ELEVENLABS_API_KEY` set it writes MP3 files and a manifest to `public/audio/`, and the site offers a narration switch.

## Deploying

- Vercel: `vercel --prod` from this folder, or connect the repository in the Vercel dashboard. `vercel.json` holds the build settings.
- GitHub Pages: `.github/workflows/pages.yml` builds the static site without the assistant; it only runs when started by hand from the Actions tab.

## Keeping it in step with the lab

The fault-hunt simulator (`src/hunt/sim.ts`) and the faults of Rack Shift (`src/game/shift.ts`) mirror `lab/faults.sh` in [rackbench-lab](https://github.com/adam-bouafia/rackbench-lab), and the lessons quote its commands and file names. When a fault or a script changes there, update the simulator and the lessons here.

## Layout

```
src/engine/     lesson layout, isometric diagram (IsoStage), sequence view
src/lessons/    lesson list, step-through content (flows.ts, flows2.ts, flows3.ts) and its metrics and labels (extras.ts)
src/widgets/    the interactive lessons
src/hunt/       the fault-hunt simulator and its terminal
src/game/       Rack Shift: orders, faults and scoring (shift.ts), the screen (RackShift.tsx)
src/pages/      overview, practice and quiz, Rack Lab, cheatsheets, lab guide
src/i18n.ts     interface strings in English, French and Dutch
api/ask.ts      the assistant function
scripts/        the narration script
```

## License

MIT, see `LICENSE`. Font: JetBrains Mono (SIL Open Font License, `public/fonts/OFL.txt`).
