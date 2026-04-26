## 1. Pull Request Verification

- [x] 1.1 Add a GitHub Actions pull request workflow that checks out the repository, installs dependencies with `npm ci`, and runs `npm run verify` on the supported Node.js version.
- [x] 1.2 Confirm the workflow triggers on pull request updates to the primary branch and reports failures when any unit, package, or consumer verification step fails.

## 2. npm Release Automation

- [x] 2.1 Add a GitHub Actions publish workflow that runs only from an explicit release trigger, installs dependencies, verifies the package, and publishes with npm using repository secrets and the generated `dist/` output.
- [x] 2.2 Configure the publish workflow permissions and npm authentication setup so a missing token or insufficient permission fails the workflow before publication.

## 3. Packaging and Documentation Alignment

- [x] 3.1 Update repository documentation to describe the PR verification workflow, the npm publish trigger, and the required npm token or release inputs.
- [x] 3.2 Validate that the package remains consumable from npm and git-backed installs by keeping the existing root entrypoints and build lifecycle intact after the workflow changes.
