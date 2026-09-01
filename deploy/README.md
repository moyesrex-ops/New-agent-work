# Hosting the public demo

The P0 is a Node server (Next.js + embedded Postgres). Static hosts
(GitHub Pages, Netlify Drop) cannot run it. The image in the repository root
`Dockerfile` is the thing to deploy.

## Hugging Face Spaces (free CPU)

1. Create a Docker Space named `stampa`.
2. Copy `deploy/huggingface/README.md` and `deploy/huggingface/Dockerfile`
   into the Space (they clone this GitHub branch and boot the demo).
3. Wait for the build. The app listens on port 7860.

Direct URL shape: `https://<user>-stampa.hf.space`

`STAMPA_DEMO=true` is already set in the image. The door page at `/` mints
sessions. Nothing is sent to the NRS.

## Docker, anywhere

```bash
docker build -t stampa .
docker run -p 7860:7860 stampa
```

Open `http://localhost:7860`.
