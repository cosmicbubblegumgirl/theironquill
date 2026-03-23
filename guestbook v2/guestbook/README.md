# The Iron Quill

A fully themed JavaScript guestbook app for the Skills Network Kubernetes final project.

## What is included
- Ancient-book front end styled around **The Iron Quill** and **The Shire Inn** brochure
- Mood selector, experience rating, and image/audio attachments
- Animated wax seal using the uploaded logo
- Owl courier sequence using the uploaded owl artwork
- Dynamic inn cards and brochure panels loaded from `data/inn.json`
- Express back end with Redis support and in-memory fallback
- Kubernetes manifests for web deployment, Redis master/replica, service, and HPA
- Separate guides for rolling updates, rollbacks, and final submission

## Core files
- `server.js` – API, static hosting, Redis integration, health checks
- `data/inn.json` – brochure-driven content for the inn, rooms, and brochure panels
- `public/index-v1.html` – version 1 for first deployment
- `public/index-v2.html` – version 2 for rolling update
- `public/style.css` – theme, layout, comments, courier animation, brochure folding
- `public/script.js` – front-end behavior, attachment handling, API calls, dynamic rendering

## Local run
```bash
npm install
cp public/index-v1.html public/index.html
npm start
```

Then open `http://localhost:3000`.

## Kubernetes flow
1. Build and push `v1`
2. Deploy Redis manifests
3. Apply `deployment-v1.yml`
4. Port-forward the app
5. Apply autoscaling
6. Build and push `v2`
7. Apply `deployment-v2.yml`
8. Review rollout history and perform rollback

See:
- `assignment-submission-guide.md`
- `rolling-update-guide.md`
- `rollback-guide.md`
- `dependencies-and-extensions.md`
- `screenshot-checklist.md`
