# Software supply chain failures (A03:2025)

Applications inherit the vulnerabilities of everything they run on and include: Node.js itself, npm packages, and JavaScript libraries copied into the project.

## Runtime versions {#runtime-versions}

Run Node.js on an LTS release that still receives security fixes ([release schedule](https://nodejs.org/en/about/previous-releases)), and keep `.nvmrc`, `engines.node` and Docker base images (`FROM node:22-alpine`) on that release.

## Dependencies {#dependencies}

- Commit `package-lock.json` and install with `npm ci`, so every environment runs exactly the reviewed versions.
- Check for known vulnerabilities regularly, and in CI:

```bash
npm audit --omit=dev
npm outdated
```

- Enable automated update pull requests (for example Dependabot or Renovate), and remove packages you no longer use.
- Review new dependencies before adding them: maintenance, popularity, install scripts. `npm install --ignore-scripts` avoids running install scripts you did not review.
- Keep front-end libraries copied into the project (jQuery, Bootstrap, ...) up to date, or install them through npm.
- Generate a software bill of materials (SBOM, for example `npm sbom --sbom-format cyclonedx`) for releases.

ASST lists the packages from `package-lock.json` and `yarn.lock`, plus JavaScript libraries copied into the project. Advisories for common front-end libraries ship with ASST. Run the scan with `--online` to check every package against [OSV.dev](https://osv.dev/). Only package names and versions are sent, and answers are cached for a day.

References: [OWASP Vulnerable Dependency Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Vulnerable_Dependency_Management_Cheat_Sheet.html), [OWASP NPM Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/NPM_Security_Cheat_Sheet.html).
