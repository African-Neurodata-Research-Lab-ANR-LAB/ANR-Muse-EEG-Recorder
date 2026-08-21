# Publish to GitHub

For Windows:

1. Extract this folder.
2. Double-click `PUBLISH_TO_GITHUB.bat`.
3. If the repository does not yet exist, the script opens GitHub's New Repository page.
4. Create a **Public** repository named `ANR-Muse-EEG-Recorder`.
5. Do not initialize it with a README, `.gitignore`, or license.
6. Return to the publisher window and continue.
7. Complete GitHub sign-in if Git Credential Manager opens a browser.

After the push succeeds, go to:

`Repository → Settings → Pages`

Set **Build and deployment** to **GitHub Actions**.

Expected website:

https://duruhjunior77.github.io/ANR-Muse-EEG-Recorder/

The included `.github/workflows/deploy-pages.yml` workflow will build and deploy the site.
