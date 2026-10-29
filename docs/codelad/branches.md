# Codelad branches and promotion

Codelad is developed independently in `nibir-ai/codelad`. The GitHub fork relationship with `microsoft/vscode` records source ancestry and does not automatically merge or sync upstream changes. Preserve upstream licenses and attribution. Review any future upstream import as a deliberate Codelad change.

## Daily development

`dev` contains ongoing development. Both `dev` and `stable` were created from the existing Codelad checkpoint `936dd77b0b00dbd56b40d2879c8df7eddb163967`; neither starts from the unmodified upstream `main` branch. The Windows checkout now tracks `origin/dev`. Push development changes there, or create focused `codex/` feature branches and open pull requests into `dev`.

```sh
git fetch origin
git switch dev
git pull --ff-only
```

`main` remains available for history. On 2026-10-29 GitHub's branch API reported `protected: false` for it. An apparent lock in a client does not by itself establish GitHub branch protection. No lock, protection or history was removed to create the Codelad branches.

## Stable checkpoints

`stable` receives reviewed changes from `dev` after validation. Its initial content is the previous privacy foundation checkpoint; the branch name is not a claim that the unfinished editor is production ready. Do not automatically publish builds, synchronize branches or promote every development commit.

For each promotion, inspect the complete `stable...dev` diff, require the Codelad privacy-policy workflow, run the affected editor/build tests and attach real desktop/network evidence appropriate to that change. Resolve unexpected outbound destinations and document unavailable platform checks. Open a pull request with base `stable` and head `dev`; merge only when the review and required validation are complete. Tag actual releases separately when release criteria are met.

The lightweight privacy-policy workflow checks source policy and dependency declarations on pushes and pull requests for both branches. It is not a replacement for native builds, cross-platform editor tests, downloaded-extension bundle inspection or runtime packet capture.

## GitHub configuration

The default branch was changed to `dev` through the signed-in owner settings on 2026-10-29. New clones and ordinary pull requests now start on active Codelad work. Local `origin/HEAD` was refreshed to match.

The `stable` branch protection rule was created on 2026-10-29. It requires pull requests, applies to administrators, and leaves force pushes and deletion disallowed. It does not demand approval from a nonexistent second maintainer. The named CI status requirement must be added after its first successful run; until then, passing source-policy checks remains part of the documented promotion procedure rather than a configured GitHub status gate.
