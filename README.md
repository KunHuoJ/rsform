# rsform

High-performance React form library built on Formily v2 + antd 5.

> Status: pre-0.1.0, work in progress.

## Why

- **Effect-driven**: write field linkage declaratively in an `effects` callback with typed helpers.
- **Auto-injecting Field**: drop a control into `<Form.Field>` and value/onChange flow automatically.
- **Fast editable Table**: an editable table that won't re-render every cell on each keystroke.

## Tech

- Engine: `@formily/core` + `@formily/react` v2 (open-source, MIT).
- UI: antd 5 + React 19.
- Build: `@rslib/core` (bundleless). Docs: Rspress v2. Tests: Vitest.
- Single package `rsform` with subpath exports: `rsform`, `rsform/antd`, `rsform/table`, `rsform/array-items`, `rsform/effects`.

## Scripts

```sh
pnpm install
pnpm build          # bundleless build to dist/
pnpm test           # vitest
pnpm typecheck      # tsc --noEmit
pnpm docs:dev       # rspress docs site
```

## License

MIT.
