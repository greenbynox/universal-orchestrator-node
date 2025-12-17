# Release process

A GitHub Release (Windows/Linux/macOS artifacts) is produced automatically by GitHub Actions.

## How it works

- Workflow: `.github/workflows/release.yml`
- Trigger: push a git tag matching `v*` (example: `v2.3.0`)

## Steps

1) Ensure everything is committed and CI is green.
2) Create a tag:
   - `vMAJOR.MINOR.PATCH`
3) Push the tag to GitHub.
4) GitHub Actions builds:
   - Windows x64
   - Linux x64 + arm64
   - macOS x64 + arm64
5) The workflow creates a draft GitHub Release and uploads artifacts + SHA256 sums.

## Notes

- The `build-executables.yml` workflow is for CI builds only; releases are handled by `release.yml`.
- Code signing is currently disabled (`CSC_IDENTITY_AUTO_DISCOVERY=false`).
