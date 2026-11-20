# Rackbench Explorer

An interactive site about how server racks are tested before they ship: BMCs, IPMI and Redfish, network boot, firmware updates, burn-in, network tests and fault finding. Live at https://rackbench.vercel.app

- Step-through lessons with a map view, a sequence view, a message list and an inspector: IPMI power-on, one-time network boot, Redfish, the event log during burn-in, PXE and iPXE, a rack BIOS update, an intermittent cable.
- Interactive lessons: a rack tour with the cabling table, DIMM population and NUMA, PCIe link width, a BOM check, the burn-in outlier rule, jumbo frames, bond failover.
- A fault-hunt game: a simulated rack with one hidden fault and a terminal.

Every lesson has a hands-on counterpart in the lab: https://github.com/adam-bouafia/rackbench, a three-node rack on KVM with emulated BMCs, OpenBMC in QEMU, network boot and a fault injector.

The traces are illustrative and the numbers simulated. Not affiliated with any hardware vendor.

## Run it

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

The fault-hunt simulator (`src/hunt/sim.ts`) mirrors the faults of `lab/faults.sh` in the rackbench repository, and the lessons quote its commands and file names. When a fault or a script changes there, update the simulator and the lessons here.

## Layout

```
src/engine/     the step-through player: map view, sequence view, message list, inspector
src/lessons/    lesson list and the step-through lesson content
src/widgets/    the interactive lessons
src/hunt/       the fault-hunt simulator and its terminal
src/pages/      home and lab pages
api/ask.ts      the assistant function
scripts/        the narration script
```

## License

MIT, see `LICENSE`.
