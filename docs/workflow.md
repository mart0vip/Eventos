# Workflow de desarrollo

## Gitflow

| Branch      | Propósito                                      |
| ----------- | ---------------------------------------------- |
| `main`      | Producción. Solo recibe merges via PR          |
| `develop`   | Integración. Features se mergean aquí          |
| `feature/*` | Nuevas funcionalidades, parten de `develop`    |
| `fix/*`     | Correcciones, parten de `develop`              |
| `hotfix/*`  | Fixes urgentes en producción, parten de `main` |

Nunca commitear directo a `main` ni a `develop`.

## CHANGELOG.md

Seguimos el formato [Keep a Changelog](https://keepachangelog.com/).

La versión más reciente siempre está arriba. **No** usar una sección `## [Unreleased]` separada — la versión en desarrollo lleva `Unreleased` como fecha hasta que se mergea a main.

```markdown
# Changelog

## [1.2.0] - Unreleased

### Added

- Nueva funcionalidad X

### Fixed

- Bug en Y

## [1.1.0] - 2026-05-20

...
```

### PR a `develop` (feature/fix → develop)

1. Crear una nueva sección con la versión incrementada (semántica) y fecha `Unreleased`
   - Ej: `## [1.2.0] - Unreleased`
2. Agregar las entradas correspondientes bajo `### Added`, `### Changed`, `### Fixed`, etc.
3. Si ya existe una sección `Unreleased`, agregar las entradas ahí (no crear otra)

### PR a `main` (release: develop → main)

1. Crear branch `release/vX.Y.Z` desde `develop`
2. Reemplazar `Unreleased` por la fecha actual (ej: `## [1.2.0] - 2026-05-20`)
3. Push del branch y crear PR `release/vX.Y.Z` → `main`
4. **OBLIGATORIO: esperar que el CI pase antes de mergear.** No mergear con checks en queued o pendientes. El plan Team de GitHub no permite branch protection, así que esto es responsabilidad del que mergea.
5. Mergear la PR (squash merge recomendado)
6. **Crear tag y release en GitHub:**
   ```bash
   git checkout main && git pull
   git tag vX.Y.Z
   git push origin vX.Y.Z
   gh release create vX.Y.Z --title "vX.Y.Z" --notes "Ver CHANGELOG.md"
   ```
7. Sincronizar develop con main (para que develop tenga la fecha del CHANGELOG):
   ```bash
   git checkout develop && git pull
   git merge main
   git push
   ```

## Reglas de merge

- **NUNCA mergear a `main` si el CI no pasó.** Aunque GitHub lo permita, verificar manualmente que todos los checks estén en verde antes de aprobar.
- **NUNCA mergear a `develop` si el CI no pasó.** Misma regla.
- Usar **squash merge** para mantener el log limpio (un commit por PR)

## Checklist general para cada PR

1. **CI en verde** — verificar que todos los checks pasaron
2. **`CHANGELOG.md`** actualizado según las reglas de arriba
3. Usar **squash merge**
4. Limpiar branches — después de mergear, borrar el branch feature/fix local y remoto
