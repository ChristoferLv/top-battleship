import "./style.css"

const GAME_BOARD_DIMENSIONS = 10;

const SHIP_SIZES = Object.freeze({
    "ONE": 1,
    "TWO": 2,
    "THREE": 3,
    "FOUR": 4
});

const STATUS = Object.freeze({
    "WATER": "WATER",
    "HIT": "HIT"
});

class Ship {
    #length;
    #hits;
    #sunk;
    #startCell;

    constructor(type, cell) {
        this.#length = type;
        this.#hits = 0;
        this.#sunk = false;
        this.#startCell = cell;
    }

    hit() {
        this.#hits = this.#hits + 1;
        if (this.#hits == this.#length) this.#sunk = true;
    }

    isSunk() {
        return this.#sunk;
    }

    get length() { return this.#length };

    get anchor() { return this.#startCell };

    set anchor(anchor) { this.#startCell = anchor };
}

class GameBoard {
    /**@type {Map<string,Ship>} */
    #ships;
    /**@type {Array<Ship>} */
    #shipsVec;
    #shipsSunk;
    /**@type {Map<string, STATUS>} */
    #hitsHistory;
    /**@type {Map<string, STATUS>} */
    #opponentHitsHistory;

    /**@type {Ship} */
    #selectedShip;
    #finishGame;

    #active;
    #preparingPhase;

    #shadowGrid;
    #mainGrid;

    constructor(finishGame, preparingPhase, shadowGrid, mainGrid) {
        this.#hitsHistory = new Map();
        this.#ships = new Map();
        this.#shipsVec = [];
        this.#shipsSunk = 0;
        this.#finishGame = finishGame;
        this.#preparingPhase = preparingPhase;
        this.#selectedShip = null;
        this.#active = false;
        this.#shadowGrid = shadowGrid;
        this.#mainGrid = mainGrid;
    }

    get hitsHistory() {
        return this.#hitsHistory;
    }

    set opponentHitsHistory(hitHistory) {
        console.log("hit history defined")
        this.#opponentHitsHistory = this.#hitsHistory;
    }

    goToPlayingPhase() {
        this.#preparingPhase = false;
        this.redraw();
    }

    /**
     * @param {Event} e
     * @param {Ship} ship
     */
    #setSelectedShip(e, ship) {
        e.stopPropagation();
        e.target.classList.toggle("selected");
        this.#selectedShip = ship;
    }



    #calculatePositions(type, startPos) {
        const shipSize = type;
        const posXY = extractXY(startPos);
        if (posXY[0] + shipSize > GAME_BOARD_DIMENSIONS) return undefined;
        const positions = [];
        for (let i = 0; i < shipSize; i++) {
            positions.push([posXY[0] + i, posXY[1]]);
        }
        return positions;
    }

    postitionShip(type, startPos) {
        const positions = this.#calculatePositions(type, startPos);
        if (positions == undefined) return;
        const newShip = new Ship(type, startPos);
        for (const pos of positions) {
            this.#ships.set(pos + "", newShip);
        }
        this.#shipsVec.push(newShip);
    }

    checkFinishGame() {
        if (this.#shipsSunk == this.#shipsVec.length) this.#finishGame();
    }

    /**
     * 
     * @param {number} posId 
     */
    #repositionShip(posId) {
        const newPositions = this.#calculatePositions(this.#selectedShip.length, posId);
        if (!newPositions) return;
        const oldPositions = this.#calculatePositions(this.#selectedShip.length, this.#selectedShip.anchor);

        for (const pos of oldPositions) {
            this.#ships.delete(pos + "");
        }
        this.#selectedShip.anchor = posId;
        for (const pos of newPositions) {
            this.#ships.set(pos + "", this.#selectedShip);
        }
    }

    #calculateNewPosition(e) {
        const posId = e.target.id;
        if (this.#selectedShip != null) {
            e.stopPropagation();
            this.#repositionShip(posId);
            e.target.id = posId;
            e.target.classList.toggle("selected");
            this.#selectedShip = null;
            this.redraw();
        }
    }

    /**
     * 
     * @param {Event} e 
     */
    receiveAttack(e) {
        console.log("is active", this.#active)
        // if (!this.#active) return;
        console.log("attack");
        const posId = e.target.id;
        const pos = extractXY(posId);
        if (Array.from(this.#ships.keys()).includes(pos + "")) {
            const shipFound = this.#ships.get(pos + "");
            shipFound.hit();
            this.#hitsHistory.set(pos + "", STATUS.HIT);
            const isSunk = shipFound.isSunk();
            if (isSunk) {
                this.#shipsSunk = this.#shipsSunk + 1;
                this.checkFinishGame();
            }
        } else {
            this.#hitsHistory.set(pos + "", STATUS.WATER);
        }
        this.redraw();
    }

    // registerHits() {
    //     this.#hitsHistory.set([2, 3] + "", STATUS.HIT)
    //     this.#hitsHistory.set([3, 4] + "", STATUS.HIT)
    //     this.#hitsHistory.set([4, 4] + "", STATUS.WATER)
    //     this.#hitsHistory.set([5, 3] + "", STATUS.WATER)
    // }

    drawShips() {
        for (const ship of this.#shipsVec) {
            const newShip = document.createElement("div");
            newShip.classList.add("ship");
            newShip.style.width = "30px";
            newShip.style.height = (30 * ship.length) + "px";
            const startCell = document.getElementById(ship.anchor);
            startCell.append(newShip)
            newShip.style.top = "0px"
            newShip.style.left = "0px"
            if (!this.#preparingPhase)
                newShip.style.pointerEvents = 'none';
            if (this.#preparingPhase) {
                newShip.addEventListener("click", (e) => { this.#setSelectedShip(e, ship) });
            }
        }
    }

    redraw() {
        if (this.#preparingPhase) {
            this.buildPositioningGrid();
            this.drawShips();
            return;
        }
        this.buildShadowGrid(this.#hitsHistory);
        this.drawShips();
        if (!this.#preparingPhase)
            this.buildMainGrid(this.#opponentHitsHistory);
    }

    /**
    * 
    * @param {Map<string, STATUS>} hitsHistory 
    * @param {Function} attackHandler 
    */
    buildPositioningGrid() {
        const baseDiv = this.#shadowGrid;
        baseDiv.innerHTML = '';
        for (let i = 0; i < 100; i++) {
            const square = document.createElement("div");
            const pos = extractXY(i);
            square.classList.add("square");
            square.id = i;
            square.innerText = i;
            square.addEventListener("click", this.#calculateNewPosition.bind(this));
            baseDiv.append(square);
        }
    }

    /**
    * 
    * @param {Map<string, STATUS>} hitsHistory 
    */
    buildShadowGrid(hitsHistory) {
        const baseDiv = this.#shadowGrid;
        baseDiv.innerHTML = '';
        for (let i = 0; i < 100; i++) {
            const square = document.createElement("div");
            const pos = extractXY(i);
            const status = hitsHistory.get(pos + "");
            square.classList.add("square");
            if (status == STATUS.WATER)
                square.classList.add("water");
            if (status == STATUS.HIT)
                square.classList.add("hit");
            square.id = i;
            square.innerText = i;
            baseDiv.append(square);
        }
    }

    /**
    * 
    * @param {Map<string, STATUS>} hitsHistory 
    * @param {Function} attackHandler 
    */
    buildMainGrid(hitsHistory) {
        const baseDiv = this.#mainGrid;
        baseDiv.innerHTML = '';
        for (let i = 0; i < 100; i++) {
            const square = document.createElement("div");
            const pos = extractXY(i);
            const status = hitsHistory.get(pos + "");
            square.classList.add("square");
            if (status == STATUS.WATER)
                square.classList.add("water");
            if (status == STATUS.HIT)
                square.classList.add("hit");
            square.id = i;
            square.innerText = i;
            if (!this.#preparingPhase)
                square.addEventListener("click", this.receiveAttack.bind(this));
            baseDiv.append(square);
        }
    }
}

function extractXY(id) {
    const Y = id % 10;
    const X = Math.trunc(id / 10);
    return [X, Y];
}

const Game = (() => {
    //                             4   3   3  2   2   2   1   1    1   1
    const shipsInitialPositions = [30, 32, 39, 59, 77, 84, 11, 81, 16, 57];

    const shadowGrid = document.querySelector(".shadow-container");
    const mainGrid = document.querySelector(".container");

    const player1Name = "Player 1";
    const player2Name = "Player 2";

    const playerTime = 1;

    let preparingPhase = true;
    const board1 = new GameBoard(finishGame, true, shadowGrid, mainGrid);
    const board2 = new GameBoard(finishGame, true, shadowGrid, mainGrid);
    const startBtn = document.querySelector(".btn-start");
    startBtn.addEventListener("click", startGame)

    function startGame() {
        preparingPhase = false;

        console.log("setting history", board1.hitsHistory, board2.hitsHistory)
        board1.opponentHitsHistory = board2.hitsHistory;
        board2.opponentHitsHistory = board1.hitsHistory;
        console.log(board2.opponentHitsHistory == board1.hitsHistory)
        if (board2.opponentHitsHistory == board1.hitsHistory) console.log("iguais");
        if (board1.opponentHitsHistory == board2.hitsHistory) console.log("iguais");
        board1.goToPlayingPhase();
        // board2.goToPlayingPhase();
    }
    // const gameManager = createGameManager();
    // const uiManager = createUiManager();

    // function createGameManager() {
    //     const receiveInput = (input) => {
    //         board.receiveAttack(input)
    //         board.draw(inputReceiver);
    //     }
    //     return { receiveInput };
    // }

    // function inputReceiver(e) {
    //     gameManager.receiveInput(e.target.id);
    // }

    // function createUiManager() {

    // }

    function makeInitialPositioning() {
        // board.postitionShip("FOUR", shipsInitialPositions[0]);
        // board.postitionShip("THREE", shipsInitialPositions[1]);
        board1.postitionShip(3, shipsInitialPositions[2]);
        // board.postitionShip("TWO", shipsInitialPositions[3]);
        // board.postitionShip("TWO", shipsInitialPositions[4]);
        // board.postitionShip("TWO", shipsInitialPositions[5]);
        // board.postitionShip("ONE", shipsInitialPositions[6]);
        // board.postitionShip("ONE", shipsInitialPositions[7]);
        board1.postitionShip(1, shipsInitialPositions[8]);
        board1.postitionShip(1, shipsInitialPositions[9]);
    }

    function finishGame() {
        alert("Game finished")
    }

    makeInitialPositioning();
    // board.registerHits();
    board1.redraw();
})();

