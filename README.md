# Michael Chen — portfolio

Personal software engineering portfolio: [michaelchen97.github.io](https://michaelchen97.github.io/).

## Website

The Product-First homepage presents four projects through front-facing software screenshots, recordings and interactive viewers: CFIT Timetable System, Quick Response & Information App (AWAI), Echoes of Valor and Livestock Management. Project controls, keyboard navigation and full-resolution image enlargement keep the software visible.

Seven case studies provide concise contribution and engineering details. Serenity Trail includes four authorized click-to-load films and a desktop/mobile gallery labelled **Local reconstruction from the original 2024 source**. Personal fields use demonstration replacements; scenery uses authorized frames from the team's films. The earlier unlicensed photographs are excluded from this presentation.

Work, Toolbox, About and Contact remain accessible from desktop and mobile navigation. Outside Code presents Cooking, Hiking and Formula 1. Every resume link opens [the current Canva resume](https://canva.link/l92zh4dfmt63nav) in a separate tab.

## Static files and accessibility

- `index.html`, `project-*.html` and `404.html`: generated public pages.
- `assets/css/site.css` and `assets/js/site.js`: shared styling, navigation, project viewers, image enlargement and email dialog.
- `assets/media/`: selected web derivatives; original sources and media masters are kept separately.
- `assets/fonts/`: self-hosted fonts and their included licences.
- `assets/og/`: social preview images.

The project bar supports keyboard navigation; reduced-motion and Save-Data preferences are respected. The static pages retain readable content without JavaScript, with native image links for the Serenity reconstruction gallery. Browser checks complement visual review and do not claim complete accessibility certification.

## Hosting

GitHub Pages serves the production branch root; `.nojekyll` is retained. Any ordinary static HTTP server can preview these files locally. Build tooling, private project sources, reconstruction directories, QA archives and media masters are kept outside this repository.

Changes are reviewed through a release pull request. Pushing the release branch does not authorize merging or changing hosting settings.
