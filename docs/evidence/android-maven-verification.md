# Android Maven delivery verification — 2026-11-03

Local distribution revision on `tt/android-exports`, based on `4cf546da`.
Android proof remains isolated on `tt/design-system-android`, based on consumer
`a72fb977`; the concurrently used Android checkout is untouched. PR #5 is draft.
This record covers the Maven delivery change; the original rendering/source
evidence remains in `android-local-verification.md`.

## Local results

| Check | Result |
|---|---|
| `npm run ci` | 64 Node + 5 Python tests; source parity and all payload budgets passed |
| Maven site unit suite | 4 tests passed: paginated discovery, numeric version order, stable-only index, historical byte preservation, checksums, malformed/incomplete releases, module identity, unsafe ZIPs and no partial output |
| Actual candidate validation | All 20 Maven artifact/checksum files accepted by the new site validator |
| Real Gradle HTTP proof | Production Android settings/catalog against a loopback Maven fixture: newest allowed version, configuration-cache reuse, normal cache retention, explicit refresh, offline resolution and strict next-major rejection passed |
| Produced site → Gradle | Real Gradle resolved synthetic 0.12.0 from the assembler's complete site, generated version index and module metadata, excluding 1.0.0 under the strict range |
| Android library | Debug/release/test APK builds, 3 JVM tests, lint and Maven archive assembly passed |
| Althea consumer | App/test APK builds, 46 JVM tests and lint passed against the local candidate |
| Pixel 10 emulator | 27 backend-free app instrumentation tests passed on API 37; physical phone untouched |
| Workflow review | All YAML files parsed locally; reviewed reusable workflow permissions, release ordering, deployment serialization and failure recovery |

The new site tests run in CI's checks job. The consumer's HTTP test lives in
`scripts/tests/test_design_system_maven.py` in its own repository and runs with
`python3 -m unittest discover -s scripts/tests -v`. It publishes no remote fixture
versions and requires no GitHub credentials. The app itself no longer runs any
Python or GitHub CLI commands to resolve the design-system package.

The candidate is still `0.10.0-android.local`; no stable Android version was
invented or attached to the existing release. Tests use synthetic versions only
inside temporary local repositories. Library source/generated exports and their
canonical inputs are unchanged by this revision, so icon rendering parity was
not repeated.

## Verification limits and maintainer setup

No GitHub Actions deployment was run, no Pages setting was changed, and no new
release was created. The Pages API returned 404 and no stable Android release is
currently available. The read-only live discovery check therefore rejects site
assembly rather than publishing an empty index. The public endpoint remains a
future release prerequisite, not a verified live service.

Before release, enable Pages with GitHub Actions as its source and allow release
tags plus `main` in the `github-pages` environment, as documented in
`RELEASING.md`. After merge/tag, verify the deployed version index and a real
Gradle resolve. If Pages deployment fails after release creation, dispatch only
the Maven site workflow from `main`; preserve the immutable assets.

PR #6 remains stacked on PR #5. Once #5 merges, rebase only the Swift icon commits
onto the latest `main`, resolve any shared documentation/workflow conflicts and
rerun its checks before retargeting/merging. This revision does not modify #6.
