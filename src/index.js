import "./style.css"
import { Player, Computer } from "./player.js";
import { Ship } from "./ship.js";
import { GameBoard } from "./gameBoard.js"
import { delay, STATUS } from "./utils.js";

const Game = (() => {
    let controller = new AbortController();
    let { signal } = controller;


    let player1 = null;
    /** @type {Player | Computer} */
    let player2 = null;

    const boardSpaces = document.querySelectorAll(".board-space");
    const restartBtn = document.querySelector(".btn-restart");
    restartBtn.addEventListener("click", restartGame)

    const playerNamesForm = document.querySelector(".names-form");
    const player1NameInpt = document.querySelector("#player1");
    const player2NameInpt = document.querySelector("#player2");
    const startPlacingBtn = document.querySelector("#btn-got-to-placing");
    startPlacingBtn.addEventListener("click", finishSetup);
    const playComputerBtn = document.querySelector(".btn-computer");
    playComputerBtn.addEventListener("click", playWithComputer);

    const placingHeader = document.querySelector(".placing-stage-head");
    const whoPlaying = document.querySelector(".who-playing");
    const startBtn = document.querySelector(".btn-start");
    startBtn.addEventListener("click", startGame);
    const finishPlacingBtn = document.querySelector(".btn-placing");
    finishPlacingBtn.addEventListener("click", finishPlacing);
    const randomizeBtn = document.querySelector(".btn-randomize");
    randomizeBtn.addEventListener("click", randomizePlacing);

    const placingGrid = document.querySelector(".placing-grid");
    const shadowGrid = document.querySelector(".shadow-container");
    const mainGrid = document.querySelector(".container");
    const shadowGrid2 = document.querySelector(".shadow-container2");
    const mainGrid2 = document.querySelector(".container2");

    const playHeader = document.querySelector(".playing-header");
    const playResult = document.querySelector(".play-result");
    const overlay = document.querySelector(".overlay");

    shadowGrid.classList.add("hidden");
    mainGrid.classList.add("hidden");

    const player1Name = "Player 1";
    const player2Name = "Player 2";

    let playerTime = 0;
    let playingAgainstComputer = false;

    let preparingPhase = true;
    let board1 = null;
    let board2 = null;


    /** @type {Player[]} */
    let playerVec = [];
    let boards = [];

    function restartGame() {
        controller.abort("restarted");
        board1 = null;
        board2 = null;
        boards = [];
        player1 = null;
        player2 = null;
        playerVec = [];
        preparingPhase = true;
        playerTime = 0;
        playingAgainstComputer = false;

        playHeader.classList.add("hidden");
        playerNamesForm.classList.remove("hidden");
        placingHeader.classList.add("hidden");
        placingGrid.classList.add("hidden");
        shadowGrid.classList.add("hidden");
        mainGrid.classList.remove("hidden");
        startBtn.classList.add("hidden");
        finishPlacingBtn.classList.remove("hidden");
        whoPlaying.classList.add("hidden");


        boardSpaces.forEach((element) => {
            element.classList.add("hidden");
        });

        restartBtn.classList.add("hidden");
    }

    function finishSetup() {
        const player1Name = player1NameInpt.value;
        const player2Name = playingAgainstComputer ? "Computer" : player2NameInpt.value;
        board1 = new GameBoard(placingGrid, shadowGrid, mainGrid, hitsHandler);
        board2 = new GameBoard(placingGrid, shadowGrid, mainGrid, hitsHandler);
        boards.push(board1, board2);
        player1 = new Player(player1Name, board1);
        if (playingAgainstComputer) {
            player2 = new Computer(player2Name, board2);
        } else {
            player2 = new Player(player2Name, board2);
        }
        playerVec.push(player1, player2);
        playerNamesForm.classList.add("hidden");
        placingHeader.classList.remove("hidden");
        startPlacing();
    }

    function playWithComputer() {
        playingAgainstComputer = true;
        finishSetup();
    }

    function startGame() {
        controller = new AbortController();
        signal = controller.signal;

        playHeader.classList.remove("hidden");
        placingHeader.classList.add("hidden");
        playerTime = 0;
        preparingPhase = false;
        placingGrid.classList.add("hidden");
        shadowGrid.classList.remove("hidden");
        mainGrid.classList.remove("hidden");

        boardSpaces.forEach((element) => {
            element.classList.remove("hidden");
        });
        whoPlaying.innerText = `Playing: ${playerVec[playerTime].name}`;

        restartBtn.classList.remove("hidden");

        board1.goToPlayingPhase();
        board2.goToPlayingPhase();
        board2.finishPlacing();
        board1.setActive(true);
        board1.redraw();
        changePlayer();
    }

    async function changePlayer() {
        overlay.classList.remove("hidden");
        await delay(1000);
        overlay.classList.add("hidden");
    }

    /**
     * @description Changes player who plays on the turn
     */
    function turnBoard() {
        playerTime = (playerTime + 1) % 2;
        if (playerVec[playerTime])
            whoPlaying.innerText = `Playing: ${playerVec[playerTime].name}`;
    }

    function startPlacing() {
        whoPlaying.classList.remove("hidden");
        whoPlaying.innerText = "Now positioning: " + playerVec[playerTime].name;
        placingGrid.classList.remove("hidden");
        const who = boards[playerTime];
        who.makeRandomPlacement();
        who.startPlacing();
    }

    function finishPlacing() {
        placingGrid.innerHTML = '';
        finishPlacingBtn.classList.add("hidden");
        startBtn.classList.remove("hidden");
        boards[playerTime].finishPlacing();
        if (playingAgainstComputer) {
            boards[1].makeRandomPlacement();
            startGame();
            return;
        }
        turnBoard();
        startPlacing();
    }

    function randomizePlacing() {
        boards[playerTime].reset();
        boards[playerTime].makeRandomPlacement();
        boards[playerTime].redraw();
    }


    async function hitsHandler(pos, attackCB) {
        const receiver = boards[(playerTime + 1) % 2];
        const attacker = boards[playerTime];

        const result = receiver.receiveAttack(pos);
        attackCB(pos, result);

        if (result == STATUS.HIT) {
            receiver.setActive(false);
            attacker.setActive(true);
            if (playingAgainstComputer) {
                if (playerTime == 0) {
                    playResult.classList.remove("hidden");
                    playResult.innerText = "You hit. Play again!";
                    attacker.redraw();
                } else {
                    receiver.redraw();
                }
            } else {
                playResult.classList.remove("hidden");
                playResult.innerText = "You hit. Play again!";
                attacker.redraw();
            }
            if (receiver.checkFinishGame()) {
                finishGame();
                return;
            }
        } else {
            receiver.setActive(true);
            attacker.setActive(false);
            if (!playingAgainstComputer || playerTime == 0) {
                playResult.classList.remove("hidden");
                playResult.innerText = playingAgainstComputer ? "Missed!" : "Missed. Pass the board.";
                attacker.redraw();
                await delay(1000);
                playResult.classList.add("hidden");
            }
            if (signal.aborted) return;
            if (playingAgainstComputer && playerTime == 1) {
                receiver.redraw();
            }
            turnBoard();
            if (!playingAgainstComputer) {
                changePlayer();
                boards[playerTime].redraw();
            }
            if (playingAgainstComputer) {
                await player2.makePlay();
            }
        }
    }

    function finishGame() {
        board1.setActive(false);
        board2.setActive(false);
        playResult.classList.remove("hidden");
        if (playingAgainstComputer)
            playResult.innerHTML = `The Computer Won!`;
        else
            `Congratulations ${playerVec[playerTime].name}, YOU WIN!!!`;
    }
})();

