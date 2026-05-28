# Michael Chen Portfolio

Personal portfolio and resume website for Michael Chen, a Software Engineering student based in Hamilton, New Zealand.

## Tech Stack

- HTML5
- CSS3
- JavaScript
- Bootstrap 4
- Font Awesome

## Project Structure

```text
.
├── index.html
├── project-*.html
├── css/
├── img/
├── js/
└── lib/
```

This is a plain static website. There is no Node, Vite, React, Vue, or build step required.

## Run Locally

Open `index.html` directly in a browser, or run a local static server:

```bash
python3 -m http.server 8000
```

Then visit:

```text
http://localhost:8000/
```

## Build

No build command is needed for this static site. GitHub Pages can publish the repository root directly.

## GitHub Pages Deployment

1. Push this project to GitHub.
2. Open the repository on GitHub.
3. Go to `Settings` > `Pages`.
4. Under `Build and deployment`, set `Source` to `Deploy from a branch`.
5. Set `Branch` to `main` and folder to `/ (root)`.
6. Save the settings.

If the repository is named `michael16585.github.io`, the site will publish at:

```text
https://michael16585.github.io/
```

If the repository has another name, the site will publish at:

```text
https://michael16585.github.io/<repo-name>/
```

## Live Demo

Live demo: `https://michael16585.github.io/<repo-name>/`
