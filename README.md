# Voyagestics — Blogging System Website

> Voyagestics is a full-stack blogging platform (React + .NET) built to publish, manage, and interact with content easily.

## Overview

Voyagestics (a.k.a. "Blogging System Website") provides a modern blog experience with:
- Authoring and post management
- Categories and tags
- Comments and likes
- Newsletter subscription
- User authentication (Identity)

The repository contains two main parts inside `SyncSyntax-master`:
- `SyncSyntax` — ASP.NET Core backend (API + MVC) with EF Core migrations and identity.
- `Frontend` — React + Vite frontend (TypeScript) for the public UI.

## Features

- Create, edit, and delete posts
- Rich post pages with comments and likes
- Category management
- Admin/author authentication
- Database seeded sample data (see `Migrations` and `DatabaseSeeder`)

## Tech stack

- Backend: .NET (ASP.NET Core), Entity Framework Core, SQL Server
- Frontend: React, Vite, TypeScript, Tailwind CSS

## Quick start

Prerequisites
- .NET SDK (recommended latest LTS)
- Node.js and npm
- SQL Server (or a connection string that points to an existing SQL Server instance)

Backend (run from `SyncSyntax-master/SyncSyntax`)

```powershell
cd SyncSyntax-master/SyncSyntax
dotnet restore
dotnet ef database update    # optional: apply migrations
dotnet run
```

Frontend (run from `SyncSyntax-master/Frontend`)

```bash
cd SyncSyntax-master/Frontend
npm install
npm run dev
```

Configuration
- Update database connection string in `SyncSyntax/appsettings.json` or use secrets/environment variables for production.
- Frontend environment variables (if any) live in `SyncSyntax-master/Frontend/.env`.

## Notes
- This repo contains build artifacts and third-party libs under `wwwroot` and `Frontend` — consider adding/updating `.gitignore` if you want to exclude node_modules, build outputs, or database files.
- Windows users may see LF/CRLF warnings when checking out files; this is normal.

## Contributing

Contributions, bug reports, and enhancements are welcome. Open an issue or create a pull request.

## License & Contact

This project does not include an explicit license file. If you want to publish, add a `LICENSE` to clarify terms.

Maintainer: Abdessamad Ab04 — please update contact details in the repo settings or here.
