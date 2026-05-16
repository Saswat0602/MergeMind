# 🏗️ MergeMind Build Guide


## 🐳 Docker Build

To build and start the entire stack using Docker:
```bash
docker-compose up --build
```

### Advanced Docker Commands

- **Build without cache**:
  ```bash
  docker-compose build --no-cache
  ```

- **Build a specific service**:
  ```bash
  docker-compose build api
  ```

- **Run in background**:
  ```bash
  docker-compose up -d
  ```

### Optimization Notes
The Docker images use multi-stage builds and `turbo prune` to ensure the final images are as small as possible. We use `node:20-slim` as the base image to ensure compatibility with Tailwind CSS v4 and native modules.
