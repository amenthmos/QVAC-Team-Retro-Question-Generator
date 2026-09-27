# QVAC Team Retro Question Generator

Describe your team/sprint context, get 4-5 real retrospective discussion questions fitting that context — generated on-device. No cloud call, no API key.

## Run

```bash
npm install
npm start
```

Then open http://localhost:32025

## QVAC SDK version

`@qvac/sdk` ^0.19.0 (see `package.json`).

## How it works

Built on [Tether's QVAC SDK](https://www.npmjs.com/package/@qvac/sdk) — all inference runs on-device, no cloud call, no API key. The app loads `LLAMA_3_2_1B_INST_Q4_0` locally with `loadModel()`, generates with `completion()` (streamed via `tokenStream`), and releases the model with `unloadModel()` on shutdown.

## Example

**Input:** `6-person team just wrapped a two-week sprint focused on migrating our payments system to a new provider, with one near-miss outage`

**Output:**
```
1. In the sprint planning session, was there a clear "good enough" threshold for feature acceptance, and did we prioritize or defer those decisions?
2. What was the team's process for verifying and validating the migrated payments provider, and did we catch any errors or omissions?
3. How did the team handle the "near-miss" outage — was it reported to the team, and if so, how did it impact the team's focus and workflow?
4. Were there any team members who felt overwhelmed or under-resourced during the sprint, and if so, what steps did we take to support them?
5. Did the team's communication and collaboration processes shift to handle a more complex and high-stakes environment, and if so, what changes were made?
```

## License

MIT
