import { SIZES_ARR, getRandomPlace, getRandomOrientation, extractXY, aroundPlaces, sumArr, ORIENTATIONS, GAME_BOARD_DIMENSIONS, STATUS } from "./utils.js";
import { Ship } from "./ship.js";
class GameBoard {
    /**@type {Map<string,Ship>} */
    #ships;
    /**@type {Array<Ship>} */
    #shipsVec;
    #shipsSunk;

    /**@type {Map<string, STATUS>} */
    #hitsHistory;
    /**@type {Map<string, STATUS>} */
    #myAttacksHistory;

    /**@type {Ship} */
    #selectedShip;

    #active;
    #preparingPhase;

    /**@type {HTMLElement} */
    #placingGrid;
    /**@type {HTMLElement} */
    #shadowGrid;
    /**@type {HTMLElement} */
    #mainGrid;

    #hitsHandler;
    #boundRotate;



    constructor(placingGrid, shadowGrid, mainGrid, hitsHandler) {
        this.#hitsHistory = new Map();
        this.#myAttacksHistory = new Map();
        this.#ships = new Map();
        this.#shipsVec = [];
        this.#shipsSunk = 0;
        this.#preparingPhase = true;
        this.#selectedShip = null;
        this.#active = false;
        this.#placingGrid = placingGrid;
        this.#shadowGrid = shadowGrid;
        this.#mainGrid = mainGrid;
        this.#hitsHandler = hitsHandler;
        this.#boundRotate = this.#handleRotate.bind(this);
    }

    makeRandomPlacement() {
        for (let i = 0; i < SIZES_ARR.length;) {
            const positionResult = this.#postitionShip(SIZES_ARR[i], getRandomPlace(), getRandomOrientation());
            if (positionResult) i++;
        }
    }

    setActive(status) {
        this.#active = status;
    }

    get active() {
        return this.#active;
    }

    reset() {
        this.#hitsHistory = new Map();
        this.#myAttacksHistory = new Map();
        this.#ships = new Map();
        this.#shipsVec = [];
        this.#shipsSunk = 0;
        this.#selectedShip = null;
        this.#active = false;
    }

    get attacksHistory() {
        return this.#myAttacksHistory;
    }

    goToPlayingPhase() {
        this.#preparingPhase = false;
    }

    startPlacing() {
        document.addEventListener('keydown', this.#boundRotate);
        this.redraw();
    }

    finishPlacing() {
        this.#selectedShip = null;
        document.removeEventListener('keydown', this.#boundRotate);
    }

    /**
     * @param {Event} e
     * @param {Ship} ship
     */
    #setSelectedShip(e, ship) {
        e.stopImmediatePropagation();
        if (this.#selectedShip == ship) {
            e.target.classList.toggle("selected");
            this.#selectedShip = null;
            return;
        }
        if (this.#selectedShip != null) return;
        e.target.classList.toggle("selected");
        this.#selectedShip = ship;
    }



    #calculatePositions(type, startPos, orientation) {
        const shipSize = type;
        const posXY = extractXY(startPos);
        if (orientation == ORIENTATIONS.Vertical) {
            if (posXY[0] + shipSize > GAME_BOARD_DIMENSIONS) return undefined;
            const positions = [];
            for (let i = 0; i < shipSize; i++) {
                positions.push([posXY[0] + i, posXY[1]]);
            }
            return positions;
        } else {
            if (posXY[1] + shipSize > GAME_BOARD_DIMENSIONS) return undefined;
            const positions = [];
            for (let i = 0; i < shipSize; i++) {
                positions.push([posXY[0], posXY[1] + i]);
            }
            return positions;
        }
    }

    /**
     * 
     * @param {number} type 
     * @param {number} startPos 
     * @param {ORIENTATIONS} orientation 
     * @returns {boolean}
     * @description Check if there are any ships around
     */
    #anyAround(type, startPos, orientation) {
        let XY = extractXY(startPos);
        const shipOnPos = this.#ships.get(XY + "");
        if (shipOnPos && shipOnPos != this.#selectedShip) return true;
        const anyAround = aroundPlaces[orientation.description][type - 1].some((elem) => {
            const shipInPlace = this.#ships.get(sumArr(extractXY(startPos), elem) + "");
            if (shipInPlace != undefined && shipInPlace != this.#selectedShip) {
                return true
            }
            return false
        });
        return anyAround;
    }

    #handleRotate(e) {
        if (!this.#preparingPhase) return;
        if (e.key != 'r') return;
        if (!this.#selectedShip) return;
        const newOrientation = this.#selectedShip.orientation == ORIENTATIONS.Vertical ? ORIENTATIONS.Horizontal : ORIENTATIONS.Vertical;
        const anyAround = this.#anyAround(this.#selectedShip.length, this.#selectedShip.anchor, newOrientation);
        if (anyAround) return;
        const newPositions = this.#calculatePositions(this.#selectedShip.length, this.#selectedShip.anchor, newOrientation);
        if (!newPositions) return;
        const oldPositions = this.#calculatePositions(this.#selectedShip.length, this.#selectedShip.anchor, this.#selectedShip.orientation);

        this.#selectedShip.orientation = newOrientation;

        for (const pos of oldPositions) {
            this.#ships.delete(pos + "");
        }

        for (const pos of newPositions) {
            this.#ships.set(pos + "", this.#selectedShip);
        }

        this.redraw();
    }

    #postitionShip(type, startPos, orientation) {
        const around = this.#anyAround(type, startPos, orientation);
        if (around) return false;
        const positions = this.#calculatePositions(type, startPos, orientation);
        if (positions == undefined) return false;
        const newShip = new Ship(type, startPos, orientation);
        for (const pos of positions) {
            this.#ships.set(pos + "", newShip);
        }
        this.#shipsVec.push(newShip);
        return true;
    }

    checkFinishGame() {
        return this.#shipsSunk == this.#shipsVec.length;
    }

    /**
     * 
     * @param {number} posId 
     */
    #repositionShip(posId) {
        const anyAround = this.#anyAround(this.#selectedShip.length, posId, this.#selectedShip.orientation);
        if (anyAround) return;
        const newPositions = this.#calculatePositions(this.#selectedShip.length, posId, this.#selectedShip.orientation);
        if (!newPositions) return;
        const oldPositions = this.#calculatePositions(this.#selectedShip.length, this.#selectedShip.anchor, this.#selectedShip.orientation);

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

    // checkHit(posId) {
    //     const pos = extractXY(posId);
    //     if (Array.from(this.#ships.keys()).includes(pos + "")) {
    //         return STATUS.HIT;
    //     }
    //     return STATUS.WATER;
    // }

    /**
     * 
     * @param {Event} e 
     */
    receiveAttack(pos) {
        if (this.#hitsHistory.has(pos + "")) return this.#hitsHistory.get(pos + "");
        if (Array.from(this.#ships.keys()).includes(pos + "")) {
            const shipFound = this.#ships.get(pos + "");
            shipFound.hit();
            this.#hitsHistory.set(pos + "", STATUS.HIT);
            const isSunk = shipFound.isSunk();
            if (isSunk) {
                this.#shipsSunk = this.#shipsSunk + 1;
            }
            return STATUS.HIT;
        } else {
            this.#hitsHistory.set(pos + "", STATUS.WATER);
            return STATUS.WATER;
        }
    }

    #drawShips(grid) {
        for (const ship of this.#shipsVec) {
            const newShip = document.createElement("div");
            newShip.classList.add("ship");

            if (ship.orientation == ORIENTATIONS.Vertical) {
                newShip.style.width = "30px";
                newShip.style.height = (30 * ship.length) + "px";
            } else {
                newShip.style.height = "30px";
                newShip.style.width = (30 * ship.length) + "px";
            }
            if (ship == this.#selectedShip)
                newShip.classList.toggle("selected")
            // const startCell = document.getElementById(ship.anchor);
            const startCell = grid.querySelector(`[id="${ship.anchor}"]`);
            startCell.append(newShip)
            newShip.style.top = "0px"
            newShip.style.left = "0px"
            if (!this.#preparingPhase)
                newShip.style.pointerEvents = 'none';
            if (this.#preparingPhase) {
                newShip.addEventListener("click", (e) => { this.#setSelectedShip(e, ship) });
                newShip.setAttribute("draggable", true)
                newShip.addEventListener("dragstart", (e) => { this.#selectedShip = ship; });
                newShip.addEventListener("dragend", (e) => { this.#selectedShip = null; this.redraw() });
            }
        }
    }

    redraw() {
        if (this.#preparingPhase) {
            this.#buildPositioningGrid();
            this.#drawShips(this.#placingGrid);
            this.#drawCoordinates(this.#placingGrid);
        } else {
            this.#buildShadowGrid();
            this.#drawShips(this.#shadowGrid);
            this.#buildMainGrid();
            this.#drawCoordinates(this.#shadowGrid);
            this.#drawCoordinates(this.#mainGrid);
        }
    }

    #positionFromDrag(e) {
        if (e.target.classList.contains('square')) {
            this.#repositionShip(e.target.id);
        }
        this.#selectedShip = null;
        this.redraw();
    }

    /**
    * 
    * @param {Map<string, STATUS>} hitsHistory 
    * @param {Function} attackHandler 
    */
    #buildPositioningGrid() {
        const baseDiv = this.#placingGrid;
        baseDiv.innerHTML = '';
        for (let i = 0; i < 100; i++) {
            const square = document.createElement("div");
            const pos = extractXY(i);
            square.classList.add("square");
            square.id = i;
            // square.innerText = i;
            square.addEventListener("click", this.#calculateNewPosition.bind(this));
            square.addEventListener("dragover", (e) => { e.preventDefault(); })
            square.addEventListener("drop", this.#positionFromDrag.bind(this));
            // square.addEventListener("dragend", (ev) => { const dropTarget = document.elementFromPoint(ev.clientX, ev.clientY); }); Also works
            baseDiv.append(square);
        }
    }

    /**
    * 
    * @param {Map<string, STATUS>} hitsHistory 
    */
    #buildShadowGrid() {
        const baseDiv = this.#shadowGrid;
        baseDiv.innerHTML = '';
        for (let i = 0; i < 100; i++) {
            const square = document.createElement("div");
            const pos = extractXY(i);
            const status = this.#hitsHistory.get(pos + "");
            square.classList.add("square");
            if (status == STATUS.WATER)
                square.classList.add("water");
            if (status == STATUS.HIT)
                square.classList.add("hit");
            square.id = i;
            // square.innerText = i;
            baseDiv.append(square);
        }
    }

    /**
     * 
     * @param {HTMLHtmlElement} grid 
     */
    #drawCoordinates(grid) {
        const zero = grid.firstChild;
        const letters = [" ", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
        for (const letter of letters) {
            const coodinate = document.createElement("div");
            coodinate.innerText = letter;
            coodinate.classList.add("grid-element");
            grid.insertBefore(coodinate, zero);
        }

        let firstSquareOfRow = grid.children[10];
        for (let i = 1; i < 11; i++) {
            firstSquareOfRow = grid.children[10 * i + i];
            const coodinate = document.createElement("div");
            coodinate.innerText = i
            coodinate.classList.add("grid-element");
            grid.insertBefore(coodinate, firstSquareOfRow);
        }
    }

    attackResponse(pos, result) {
        this.#myAttacksHistory.set(pos + "", result);
    }

    makeAttack(posId) {
        if (!this.#active) return;
        const pos = extractXY(posId);
        if (this.#myAttacksHistory.get(pos + "")) return;
        this.#hitsHandler(pos, this.attackResponse.bind(this));
    }

    /**
    * 
    * @param {Map<string, STATUS>} hitsHistory 
    * @param {Function} attackHandler 
    */
    #buildMainGrid() {
        const baseDiv = this.#mainGrid;
        baseDiv.innerHTML = '';
        for (let i = 0; i < 100; i++) {
            const square = document.createElement("div");
            square.classList.add("square");
            const pos = extractXY(i);
            const status = this.#myAttacksHistory.get(pos + "");
            if (status == STATUS.WATER)
                square.classList.add("water");
            if (status == STATUS.HIT)
                square.classList.add("hit");
            square.id = i;
            // square.innerText = i;
            if (!this.#preparingPhase)
                square.addEventListener("click", (e) => { this.makeAttack(e.target.id) });
            baseDiv.append(square);
        }
    }
}

export { GameBoard }