# Markov BOT

A Discord bot that learns from guild messages and generates text using Markov chains.

This fork is configured for self-hosting and includes the command set available in this repository.

## What it does
- Collects messages from all accessible guild channels
- Stores messages in a local database for each server
- Generates sentences using a Markov chain model
- Adds recent messages from a channel using the `/scrape` command
- Supports per-guild configuration and message tracking controls

## Hosting your own instance
If you want to download the code and run it in your own bot or make changes, it's very simple:

### Requirements
- [Node.JS](https://nodejs.org/) v16+;
- A [Discord bot](https://discord.com/developers/docs/getting-started);
- Hosting service (to keep the bot online 24/7) or any device that supports Node.JS.

### Configuring the environment
First, install [git](https://git-scm.com/) and clone your fork or repository copy.

Go inside the repository folder and install the dependencies with `npm install`. You need to have [Node.JS](https://nodejs.org/) installed on your computer/server.

Copy the file `.env.example` and rename it to `.env`. Open the file in a text editor and fill the variable `BOT_TOKEN`. You can optionally set `DB_PATH` to a custom JSON file path; otherwise it defaults to `./data/database.json`. Variables with `#` at the beginning are optional.

### Starting the bot
After configuring the environment, build the bot code to JavaScript with the command `npm run build`. It will be transpiled to the folder `./dist/`.

Start the bot with `npm start` and have fun!

### Docker Setup
First you need to have Docker and Docker Compose installed on your PC.
- Docker install docs: https://docs.docker.com/engine/install/
- Docker Compose install docs: https://docs.docker.com/compose/install/

After the Docker setup, open a terminal inside the repository folder and build the Docker container using `docker build --no-cache -t markov-bot .`.

When the build is finished you can run the bot container with:
- `docker-compose up -d`

Be sure to copy `.env.example` to `.env` and fill `BOT_TOKEN` as described in the Configuring the environment section.

## Contributing
If you want to contribute by improving the code or translating texts to other languages, see the **[Contributing](/CONTRIBUTING.md)** before doing anything.