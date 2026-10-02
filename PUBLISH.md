# Publishing n8n-nodes-mintpdf

Nothing is published yet. No GitHub repo, no npm package, no Creator Portal submission.
Do the steps below in order. All commands run from `/home/plastgaffel/n8n-nodes-mintpdf`.

## Why GitHub Actions

Since 1 May 2026, n8n only verifies community nodes that are published from GitHub Actions
with an npm provenance statement. A package published from your own machine can still be
installed by self-hosted users, but it cannot become a verified node (the kind n8n Cloud users
can find and install from the nodes panel). The workflow is already in
`.github/workflows/publish.yml` (from the official `npm create @n8n/node` scaffold). It runs
`npm run release`, which lints, builds and runs `npm publish` with `NPM_CONFIG_PROVENANCE=true`.

## 1. Check the author email

`package.json` has `author.email = kartaginy1@gmail.com`. The n8n linter requires an email,
and verification checks that the author matches the npm maintainer (`plastgaffel`, same
email). It becomes public on npm. Change it before step 2 if you want another address.

## 2. Create the GitHub repo and push

The repo must be public. Its URL must match `repository.url` in `package.json`
(`https://github.com/TrendTweekers/n8n-nodes-mintpdf`).

```bash
cd /home/plastgaffel/n8n-nodes-mintpdf
gh repo create TrendTweekers/n8n-nodes-mintpdf --public \
  --description "n8n community node for MintPDF: HTML, Markdown or URL to PDF" \
  --homepage https://mintpdf.dev --source . --remote origin --push
```

The CI workflow (`.github/workflows/ci.yml`) then runs lint and build on `main`.

## 3. Give the workflow permission to publish to npm

npm "trusted publishing" (no secrets) can only be set on a package that already exists.
So the first version needs a token:

1. npmjs.com, logged in as `plastgaffel`: Access Tokens > Generate New Token > Granular Access Token.
   Packages and scopes: Read and write. Select "All packages" (the package does not exist yet).
   Short expiry, for example 7 days. Allow it to bypass 2FA for publishing if your account asks.
2. Store it in the repo:

   ```bash
   gh secret set NPM_TOKEN --repo TrendTweekers/n8n-nodes-mintpdf
   ```

## 4. Publish 0.1.0

`package.json` is already at `0.1.0`. The workflow runs on any tag that looks like `x.y.z`.

```bash
git tag 0.1.0
git push origin 0.1.0
gh run watch --repo TrendTweekers/n8n-nodes-mintpdf
```

Check it worked:

```bash
npm view n8n-nodes-mintpdf version
npm view n8n-nodes-mintpdf dist.attestations --json   # must show a provenance attestation
```

The npm page should show a "Provenance" badge.

## 5. Switch to trusted publishing (recommended), then delete the token

1. npmjs.com > n8n-nodes-mintpdf > Settings > Trusted Publisher > GitHub Actions:
   - Organization or user: `TrendTweekers`
   - Repository: `n8n-nodes-mintpdf`
   - Workflow filename: `publish.yml`
   - Environment: leave empty
2. Remove the token: `gh secret delete NPM_TOKEN --repo TrendTweekers/n8n-nodes-mintpdf`,
   and revoke it on npmjs.com.

## 6. Later releases

```bash
GITHUB_TOKEN=$(gh auth token) npm run release
```

This lints, builds, asks for the new version, updates `CHANGELOG.md`, commits, tags, pushes
and creates a GitHub release. The tag push triggers the publish workflow. It does not publish
from your machine.

## 7. Submit for verification (n8n Creator Portal)

Go to https://creators.n8n.io/nodes, sign in, and submit the node.

Fields and what to enter:

| Field | Value |
|---|---|
| npm package name | `n8n-nodes-mintpdf` |
| Repository URL | `https://github.com/TrendTweekers/n8n-nodes-mintpdf` |
| Node name | MintPDF |
| Short description | Convert HTML, Markdown or a public URL to PDF with the MintPDF API. Output as binary data or a one-hour download link. |
| Category | Utility (also Development) |
| Service website | https://mintpdf.dev |
| Documentation | https://github.com/TrendTweekers/n8n-nodes-mintpdf#readme |
| Pricing / plans | https://mintpdf.dev/#pricing. Free key: 100 renders a month. Paid from $19/month. |
| How to get credentials | Free key, email only: form at https://mintpdf.dev/#keys, or `POST https://mintpdf.dev/v1/keys` with `{"email": "..."}` |
| Licence | MIT |
| Contact email | the author email from step 1 |

The portal form may ask for fields not listed here. Use the README for the answers.

What the reviewers check, and where this package stands:

- Built with the `n8n-node` CLI scaffold: yes (`@n8n/node-cli` 0.50.4).
- `npm run lint` passes with no errors or warnings: yes.
- No runtime dependencies: yes (only `n8n-workflow` as a peer dependency).
- No environment variable or file system access: yes.
- MIT licence, public repo, README in the npm package: yes, after step 2.
- Published from GitHub Actions with provenance: after step 4.
- English only: yes.
- One service per package, not a duplicate of a built-in node: yes.

## Credential test

The credential test calls `GET /v1/me`, which is free and returns 401 for a missing or unknown key.
