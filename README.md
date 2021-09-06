# Organic Cache Simulator

Cache simulator. Originally made for learning during University.

Live Demo: http://cloud.chrisvilches.com/live_demos/organic-cache-simulator/

## Features

1. User can input addresses separated by comma or newlines.
2. Addresses can be word or byte.
3. Configure associativity, block size, etc.
4. 32 bits machine.
5. Display hit rate.
6. Display cache history.

## Installation and build

Install Node dependencies:

```bash
npm install
```

Compile Typescript, Sass, and other tasks. 

```bash
gulp
```

Start server:

```bash
npm start
```

Open `http://localhost:3000/` to see the website.

## Deploy as static page

It's not necessary to run a Express.js app, since the app is static (Express was originally used to deploy to Heroku). Execute this command to generate a static distribution.

Note: The app must be previously compiled using `gulp`.

```bash
./generate_static_dist.sh
```

This will generate a HTML/CSS/JS/assets only folder (no Typescript, etc).

## Technologies used

1. Typescript
2. Bootstrap
3. jQuery
4. Sass
5. Gulp
6. Bower (not used anymore)
7. NodeJS
8. Express
