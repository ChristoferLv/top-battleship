# Battleship

Battleship game project developed as part of the JavaScript path from [The Odin Project](https://www.theodinproject.com/lessons/node-path-javascript-battleship), focused on game logic, DOM interaction, and modular JavaScript.

## Project Objective

The main goals were to practice:
- Building core game logic for ships, boards, and players
- Managing a placement phase and turn-based gameplay
- Supporting player vs player and player vs computer modes
- Rendering and updating the UI based on game state
- Organizing code with ES Modules
- Practicing automated tests for game logic

## What Is It?

A browser-based Battleship implementation with a placement stage and turn-based attacks. The player can choose between local two-player mode (with pass-the-board overlay) or playing against the computer. Ships are positioned on a 10x10 grid, and the game ends when all ships are sunk.

## How To Use


1. Install dependencies:
   `npm install`
1. Start the dev server:
   `npx webpack serve`

## Features

- Name input and mode selection (vs computer or local two-player)
- Placement stage with drag and drop, click-to-select, and rotation via the `r` key
- Random ship placement with collision and adjacency checks
- Turn-based attacks with hit/miss feedback and screen overlay to pass the board
- Computer opponent with a memory-based heuristic to follow up on hits
- Restart game button

## File Structure

- `src/index.js`: game flow, UI control, and event handling
- `src/gameBoard.js`: board state, placement logic, rendering, and attacks
- `src/player.js`: `Player` and `Computer` logic
- `src/ship.js`: ship behavior (hits and sunk state)
- `src/utils.js`: helpers, constants, and shared utilities
- `src/index.html`: base markup
- `src/style.css`: layout and visuals
- `src/battleship.spec.js`: Jest test suite
- `webpack.config.js`: bundling and dev server config

## Technologies Used

- JavaScript (ES Modules)
- HTML and CSS
- Webpack
- Jest

## Visualization

<img width="1920" height="919" alt="battleship_screenshot" src="https://github.com/user-attachments/assets/de07592d-0bfa-4f0d-b7a1-b78ff5adf5c9" />

---

Project built following: [The Odin Project - Battleship](https://www.theodinproject.com/lessons/node-path-javascript-battleship)

📍 **Main repository with all projects**: [ChristoferLv/TheOdinProject](https://github.com/ChristoferLv/TheOdinProject)
