# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: Clerk (email/password, social login)
- **File Storage**: Replit Object Storage (GCS-backed, presigned URL uploads)

## Artifacts

- **cloud-drive** (`/`) — SafeDrive web app (React + Vite, frontend)
- **api-server** (`/api`) — Express 5 API server (backend)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Features

- Email/password signup and login via Clerk
- Upload videos, photos, documents and other files
- Files persist in cloud storage (Google Cloud Storage via presigned URLs)
- Access files from any device with the same email and password
- Filter files by type (images, videos, documents)
- Search files by name
- Storage usage stats
- File preview for images and videos
- Delete files

## Database Schema

- `files` table: id, userId, name, size, contentType, fileType, objectPath, createdAt

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
