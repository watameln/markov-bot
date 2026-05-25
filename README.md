# About
**Markov BOT** is a Discord bot that uses [Markov chains](https://en.wikipedia.org/wiki/Markov_chain) to generate random sentences in the chat.

The bot randomly collects messages written by users and builds a *probability tree* used in the text generation. Firstly it randomly selects a random word and tries to select the most likely next word.

This project is inspired by **[nMarkov](https://top.gg/bot/569277281046888488)**. After it was offline for a while, my friends said me to remake the bot for our guild. They also suggested making it public and I was surprised the bot grew fast.

I also decided to develop this project to study **TypeScript** and **OOP**, then make the project source code available to everyone who wants to host their own instance. The code is not the best, but feel free to contribute and improve it.

Depending on when you are reading this, you still can add the bot on your guild: **[Top.gg page](https://top.gg/bot/903354338565570661)**.

## Hosting your own instance
If you want to download the code and run it in your own bot or make changes, it's very simple:

### Requirements
- [Node.JS](https://nodejs.org/) v16+;
- A [Discord bot](https://discord.com/developers/docs/getting-started);
- Hosting service (to keep the bot online 24/7) or any device that supports Node.JS.

### Configuring the environment
First, install [git](https://git-scm.com/) and clone the repository with `git clone https://github.com/knownasbot/markov-bot` or download the source.

Go inside the repository folder and install the dependencies with `npm install`. You need to have [Node.JS](https://nodejs.org/) installed on your computer/server.

Copy the file `.env.example` and rename it to `.env`. Open the file in a text editor and fill the variable `BOT_TOKEN`. You can optionally set `DB_PATH` to a custom JSON file path; otherwise it defaults to `./data/database.json`. Variables with `#` at the beginning are optional.

### Starting the bot
After configuring the environment, build the bot code to JavaScript with the command `npm run build`. It will be transpiled to the folder `./dist/`.

Start the bot with `npm start` and have fun!

### Docker Setup
First you need to have Docker and Docker-Compose installed in you're pc.
- You can view the Docker Installation Docs be clicking [here](https://docs.docker.com/engine/install/).
- Also the Docker Compose Docs can be viewed by clicking [here](https://docs.docker.com/compose/install/).

After the Docker setup, open a terminal inside the repository folder and build the Docker container using `docker build --no-cache -t knownasbot/markov-bot .`.

When the build is finished you can run the bot container by using:
- `docker-compose up -d` but you need to copy `.env.example` to `.env` and fill the variable `BOT_TOKEN` [as described above](https://github.com/knownasbot/markov-bot#configuring-the-environment).

## Contributing
If you want to contribute by improving the code or translating texts to other languages, see the **[Contributing](/CONTRIBUTING.md)** before doing anything.

You can donate to me at my **[Buy Me A Coffee](https://buymeacoffee.com/knownasbot)** page. You can also support the contributors on their profiles or by contacting them.