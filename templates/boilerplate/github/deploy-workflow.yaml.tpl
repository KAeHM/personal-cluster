name: Deploy {{APP_NAME}}

on:
  push:
    branches:
      - master
    paths:
      - "apps/{{APP_SLUG}}/**"
      - ".github/workflows/{{APP_SLUG}}-deploy.yaml"

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: {{IMAGE_NAME}}

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Log in to the Container registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Extract metadata (tags, labels) for Docker
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.IMAGE_NAME }}
          tags: |
            type=sha,format=short
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./apps/{{APP_SLUG}}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

      - name: Update Kubernetes manifests
        id: manifest
        run: |
          IMAGE_TAG="sha-${GITHUB_SHA::7}"
          sed -i "s|image: {{IMAGE_NAME}}:.*|image: ${{ env.IMAGE_NAME }}:${IMAGE_TAG}|g" infra/{{APP_SLUG}}/web-app.yaml
          echo "tag=${IMAGE_TAG}" >> "$GITHUB_OUTPUT"

      - name: Commit and push changes
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore({{APP_SLUG}}): update web-app image to ${{ steps.manifest.outputs.tag }}"
          file_pattern: infra/{{APP_SLUG}}/web-app.yaml
