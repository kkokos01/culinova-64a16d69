# Welcome to the Culinova Project

## Project Development History

This project was initially created with Lovable and has now migrated to Websurf Cascade for ongoing development and management.

## How can I edit this code?

There are several ways of editing your application.

**Use Websurf Cascade**

Simply use the Windsurf IDE with Cascade AI assistant to make changes to your code with AI assistance.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (backend)
- React Router
- React Query

## Package Management

This project uses npm as the preferred package manager. Please use npm for all package management tasks:

```sh
# Install dependencies
npm install

# Add a new package
npm install <package-name>

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## How can I deploy this project?

You can deploy this project using Netlify, Vercel, or any other static hosting service of your choice.

## Custom Domains

To use a custom domain, configure it through your chosen hosting provider's settings.

## Docker Support

This project can be run using Docker for a consistent development and deployment environment.

### Prerequisites

- Docker and Docker Compose installed on your machine
  - [Install Docker](https://docs.docker.com/get-docker/)
  - [Install Docker Compose](https://docs.docker.com/compose/install/)

### Development with Docker

```sh
# Build and start the development environment
docker compose -f docker-compose.dev.yml up --build

# Stop the development environment
docker compose -f docker-compose.dev.yml down
```

### Production Build with Docker

```sh
# Build and start the production environment
docker compose up --build

# Stop the production environment
docker compose down
```

### Environment Variables

Docker uses the `.env.docker` file for environment variables. Make sure to update this file with your specific configuration before running Docker.
