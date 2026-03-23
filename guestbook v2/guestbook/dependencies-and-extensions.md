# Dependencies and Extensions

## Runtime dependencies
These are already declared in `package.json`:
- `express`
- `redis`
- `helmet`
- `cors`
- `nodemon` (dev only)

## Local tools you need in the lab
- Node.js 18+ (Node 20 works well)
- npm
- Docker
- kubectl
- Access to IBM Cloud Container Registry / Skills Network lab environment

## Helpful IDE or lab extensions
- Skills Network Toolbox / Launch Application panel
- YAML support in VS Code or Theia
- Docker extension (optional but helpful)
- Kubernetes extension (optional but helpful)

## Files that matter for grading
- `Dockerfile`
- `deployment-v1.yml`
- `deployment-v2.yml`
- `hpa.yml`
- `redis-master.yml`
- `redis-replica.yml`
- `public/index-v1.html`
- `public/index-v2.html`
- `public/style.css`
- `public/script.js`
- `server.js`

## Notes
- The site works without Redis in local mode because the server falls back to in-memory storage.
- For Kubernetes and horizontal scaling, Redis should be deployed first so every pod reads and writes to the same back end.
