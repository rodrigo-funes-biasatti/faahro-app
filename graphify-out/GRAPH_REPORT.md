# Graph Report - .  (2026-07-16)

## Corpus Check
- Corpus is ~12,186 words - fits in a single context window. You may not need a graph.

## Summary
- 75 nodes · 68 edges · 11 communities (8 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Dev Dependencies
- TS Compiler Options
- TS File Includes
- Package Scripts
- Runtime Dependencies (Next/React)
- Root Layout & Fonts
- TS Lib Targets
- ESLint Config
- Next Config
- PostCSS Config

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `include` - 7 edges
3. `scripts` - 5 edges
4. `lib` - 4 edges
5. `next` - 2 edges
6. `react` - 2 edges
7. `react-dom` - 2 edges
8. `@tailwindcss/postcss` - 2 edges
9. `@types/node` - 2 edges
10. `@types/react` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (11 total, 3 thin omitted)

### Community 0 - "Dev Dependencies"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+9 more)

### Community 1 - "TS Compiler Options"
Cohesion: 0.13
Nodes (15): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, module, moduleResolution (+7 more)

### Community 2 - "TS File Includes"
Cohesion: 0.20
Nodes (9): **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, exclude (+1 more)

### Community 3 - "Package Scripts"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 4 - "Runtime Dependencies (Next/React)"
Cohesion: 0.29
Nodes (7): next, dependencies, next, react, react-dom, react, react-dom

### Community 5 - "Root Layout & Fonts"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 6 - "TS Lib Targets"
Cohesion: 0.50
Nodes (4): dom, dom.iterable, esnext, lib

## Knowledge Gaps
- **48 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+43 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Dev Dependencies` to `Package Scripts`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Why does `compilerOptions` connect `TS Compiler Options` to `TS File Includes`, `TS Lib Targets`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Runtime Dependencies (Next/React)` to `Package Scripts`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _48 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dev Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `TS Compiler Options` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._