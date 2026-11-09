# Journée

A personal companion PWA: My Day, French (Langue), Kitchen & Drinks, Stoic & Growth, Culture, Mind Gym and Insights,
with an AI companion that remembers you. All personal data stays on the device (IndexedDB).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build (service worker active)
```

## Where things live

| Path | What |
|---|---|
| `src/sections/<id>/config.ts` | Each Section, described as data (`SectionConfig` in `src/sections/types.ts`) |
| `src/sections/registry.ts` | Built-in Sections + user-made Sections from Dexie |
| `src/ai/prompts/*.md` | The AI personas: edit these freely. `_shared.md` is the house voice + accuracy rules |
| `src/db/schema.ts` | Dexie (IndexedDB) schema. Never edit version 1; add a new version |
| `src/lib/time.ts` | All "today" logic, in Indian/Mauritius time |
| `src/settings/` | Settings and JSON backup/restore |
| `src/content/` | Offline content packs (added per phase) |

## Build phases

1. ✅ Skeleton: Sections system, navigation, theme, Dexie schema, Settings with backup
2. AI backend (serverless proxy, passcode, streaming) + chat component
3. Deploy + install on phone
4. Memory system
5. My Day · 6. Langue · 7. Kitchen & Drinks · 8. Stoic & Growth · 9. Culture + Mind Gym
10. Today brief + Insights + Add a Section
