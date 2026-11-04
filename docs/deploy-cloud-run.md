# Deploying the API to Google Cloud Run

The CI workflow deploys the API on every push to `main` once the repository variables below exist. Until then the deploy job is skipped and CI behaves as before. The deploy job and the Dockerfile have not been run against a real Google Cloud project yet, so expect to fix small things on the first run.

## Why Cloud Run

It runs the container as is, scales to zero when idle, supports streaming responses (request timeout up to 60 minutes), and the same container runs anywhere else. As far as I know it has an always-free monthly allowance of about 2 million requests, 180,000 vCPU-seconds and 360,000 GiB-seconds, but it needs a billing account with a card. Check Google's current pricing page before relying on that. Set a budget alert so a mistake cannot become a surprise bill.

## One-time setup

Run these in Google Cloud Shell. Replace the values in capitals.

```bash
PROJECT=YOUR_PROJECT_ID
REGION=us-central1           # pick a region near your users
REPO=richid-stack/cairn      # GitHub owner/name

gcloud config set project $PROJECT
gcloud services enable run.googleapis.com artifactregistry.googleapis.com iamcredentials.googleapis.com

# A place for images
gcloud artifacts repositories create cairn --repository-format=docker --location=$REGION

# A service account that GitHub may act as
gcloud iam service-accounts create cairn-deployer
SA=cairn-deployer@$PROJECT.iam.gserviceaccount.com
for ROLE in roles/run.admin roles/artifactregistry.writer roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding $PROJECT --member=serviceAccount:$SA --role=$ROLE
done

# Let this repository, and only this repository, use it (no long-lived keys)
gcloud iam workload-identity-pools create github --location=global
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location=global --workload-identity-pool=github \
  --issuer-uri=https://token.actions.githubusercontent.com \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='$REPO'"
NUMBER=$(gcloud projects describe $PROJECT --format='value(projectNumber)')
gcloud iam service-accounts add-iam-policy-binding $SA \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/$REPO"

echo "GCP_WORKLOAD_IDENTITY_PROVIDER=projects/$NUMBER/locations/global/workloadIdentityPools/github/providers/github-provider"
echo "GCP_SERVICE_ACCOUNT=$SA"
```

## Repository variables

In GitHub, open Settings, then Secrets and variables, then Actions, then the Variables tab, and add four variables:

| Variable                         | Value                              |
| -------------------------------- | ---------------------------------- |
| `GCP_PROJECT_ID`                 | your project id                    |
| `GCP_REGION`                     | the region you chose               |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | printed by the last commands above |
| `GCP_SERVICE_ACCOUNT`            | printed by the last commands above |

None of these is a secret. No keys are stored anywhere.

## What the deploy does

1. Builds `apps/api/Dockerfile` and pushes it to Artifact Registry, tagged with the commit.
2. Deploys it to a service called `cairn-api` with 1 CPU, 512 MiB, zero minimum and two maximum instances. The maximum is a cost guard.
3. Runs the contract smoke test against the new URL. A failure fails the workflow.

## Running the same container elsewhere

`docker compose up --build` runs the API locally on port 4000. The image listens on `PORT` and `HOST`, so it also runs on Fly.io, Render, Railway, a plain server, or Kubernetes.

## Other free or low-cost options

Limits change often, so check each page. These are from a 2026 [roundup of free tiers](https://dev.to/pickuma/best-free-tiers-for-developers-in-2026-saas-paas-iaas-tools-54og).

| Service                      | What it is useful for  | Free tier as reported                                                        |
| ---------------------------- | ---------------------- | ---------------------------------------------------------------------------- |
| Cloudflare Pages and Workers | The web app, edge code | Unlimited bandwidth, 500 builds a month, 100,000 Worker requests a day       |
| Neon                         | Postgres               | 0.5 GB per branch, scales to zero, about 500 ms cold start after idle        |
| Upstash                      | Redis                  | 10,000 commands a day                                                        |
| Oracle Cloud Always Free     | A full server          | An Arm VM with 4 vCPU and 24 GB RAM across instances, after account checks   |
| Fly.io                       | Containers             | A monthly credit of $5, not an always-free allowance                         |
| Render                       | Containers             | Free web services sleep after 15 minutes and take 30 seconds or more to wake |
| Vercel Hobby                 | The web app            | Personal use only; commercial use needs a paid plan                          |
