# BookCollector

A personal app for finding books and keeping a private, on-device list of the ones you own or care about. Built with [Expo](https://expo.dev) and Expo Router. See [GLOSSARY.md](GLOSSARY.md) for the domain terms.

## Setup

1. Install dependencies

   ```bash
   npm install
   ```

2. Add a Google Books API key. Create one in the [Google Cloud Console](https://console.cloud.google.com/) (enable the Books API and restrict the key to it), then put it in `.env.local` in the project root:

   ```
   EXPO_PUBLIC_GOOGLE_BOOKS_KEY=your_key_here
   ```

   `.env*.local` is git-ignored. `EXPO_PUBLIC_*` variables are bundled into the app, so never reuse this key for anything else.

3. Start the app

   ```bash
   npx expo start
   ```

   Restart with `-c` after changing env vars.

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the dev server |
| `npm run ios` / `npm run android` / `npm run web` | Start on a platform |
| `npm test` | Run unit tests (Jest) |
| `npm run lint` | Lint |
| `npx tsc --noEmit` | Typecheck |

## Structure

- `src/app/`: screens (Expo Router). `(tabs)` holds Search and Collection, `book/[volumeId]` the detail view.
- `src/components/`: shared UI.
- `src/lib/`: collection model and storage (in-memory and SQLite), Google Books search and parsing, strings, theme.

## Builds

Builds run on [EAS](https://docs.expo.dev/eas/). The API key is stored as the EAS environment variable `EXPO_PUBLIC_GOOGLE_BOOKS_KEY`.

```bash
npx eas-cli@latest build --profile development
```
