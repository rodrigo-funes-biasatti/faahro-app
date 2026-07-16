# Setup de Graphify — faahro-app

[Graphify](https://github.com/Graphify-Labs/graphify) convierte el código del repo en un
**knowledge graph consultable**. Claude Code (u otro asistente) consulta ese grafo en vez de
leer todos los archivos → **ahorra tokens**. El código se extrae con `tree-sitter` (AST)
**100% local, sin LLM y sin API key**.

Esta guía es para clonar el repo y dejar Graphify funcionando. **Se hace una sola vez por máquina.**

> ⚠️ El nombre del paquete en PyPI es `graphifyy` (con doble **y**) — es temporal mientras
> reclaman el nombre `graphify`. El comando/CLI sigue siendo `graphify`. No es un typo.

---

## Requisitos previos

- **Python 3.10+**
- **Git** (para clonar el repo)
- La app usa además Node.js 20+ y npm (para Next.js), pero eso no es parte de Graphify.

---

## macOS

### 1. Instalar `uv` (gestor de entornos aislado, recomendado)

Con [Homebrew](https://brew.sh):

```bash
brew install uv
```

Si no tenés Homebrew, usá el instalador oficial:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

> Alternativa sin `uv`: `pipx install graphifyy` (requiere `brew install pipx` primero).

### 2. Instalar Graphify

```bash
uv tool install graphifyy
```

Esto deja los ejecutables `graphify` y `graphify-mcp` en `~/.local/bin`.

### 3. Verificar que está en el PATH

```bash
which graphify        # debería imprimir: /Users/<vos>/.local/bin/graphify
graphify --help
```

Si `which graphify` no devuelve nada, agregá `~/.local/bin` al PATH en tu `~/.zshrc`:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### 4. Registrar la skill con tu asistente

El repo ya trae la skill commiteada (`.claude/skills/graphify`), así que este paso es opcional.
Si querés (re)registrarla o instalarla también a nivel global:

```bash
# dentro del repo, a nivel proyecto (ya hecho en este repo):
graphify install --project --platform claude

# o global, para todos tus proyectos:
graphify install --platform claude
```

---

## Windows

### 1. Instalar `uv`

En **PowerShell**:

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

> Alternativas:
> - Con [Scoop](https://scoop.sh): `scoop install uv`
> - Con [winget](https://learn.microsoft.com/windows/package-manager/): `winget install --id=astral-sh.uv`
> - Sin `uv`: `pipx install graphifyy` (o `pip install graphifyy`).

Cerrá y reabrí PowerShell después de instalar `uv` para refrescar el PATH.

### 2. Instalar Graphify

```powershell
uv tool install graphifyy
```

### 3. Verificar

```powershell
where.exe graphify
graphify --help
```

Si `graphify` no se reconoce, agregá al PATH la carpeta que muestra `uv tool dir`
(normalmente `%USERPROFILE%\.local\bin`):

1. Buscá **"Editar las variables de entorno del sistema"**.
2. **Variables de entorno → Path → Editar → Nuevo** → pegá `%USERPROFILE%\.local\bin`.
3. Aceptar y reabrir la terminal.

### 4. Registrar la skill

Igual que en macOS (ya viene commiteada en el repo):

```powershell
graphify install --project --platform claude
```

---

## Uso en este proyecto

El grafo ya viene **commiteado** en `graphify-out/` (`graph.json`, `GRAPH_REPORT.md`, `graph.html`),
así que podés usarlo apenas clonás, sin reconstruir nada.

| Acción | Comando |
|---|---|
| Ver el grafo interactivo | abrí `graphify-out/graph.html` en el navegador |
| Preguntar sobre el código | `graphify query "¿cómo funciona X?"` |
| Camino entre dos conceptos | `graphify path "A" "B"` |
| Explicar un concepto/nodo | `graphify explain "RootLayout"` |
| Refrescar el grafo tras cambios (gratis, sin LLM) | `graphify update .` |
| Reconstruir desde cero | `/graphify .` (en Claude Code) |

En Claude Code, con la skill instalada, alcanza con hacerle preguntas del código en lenguaje
natural: consulta el grafo automáticamente antes de leer archivos.

---

## Notas

- **No hace falta ninguna API key** para el código (extracción AST local). Solo se necesitaría
  una key (ej. `GEMINI_API_KEY`) si algún día querés grafear **docs/PDFs/imágenes** con extracción
  semántica — no es el caso hoy.
- Los hooks de `.claude/settings.json` son **fail-safe**: si Graphify no está instalado, hacen
  no-op y **no rompen nada**. Igual conviene instalarlo para aprovechar el ahorro de tokens.
- Archivos de `graphify-out/` específicos de cada máquina (`.graphify_python`, `.graphify_root`,
  `cache/`, `cost.json`) están en `.gitignore` y se regeneran solos.

### Desinstalar

```bash
graphify uninstall           # quita la skill de las plataformas detectadas
uv tool uninstall graphifyy  # quita el CLI
```
