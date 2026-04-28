import { delay, getRandomPlace, extractXY, sumArr, GAME_BOARD_DIMENSIONS, ORIENTATIONS } from "./utils.js";

class Player {
    #name;
    #board;
    /**
     * 
     * @param {startBtn} name 
     * @param {GameBoard} board 
     */
    constructor(name, board) {
        this.#name = name;
        this.#board = board;
    }

    get board() {
        return this.#board;
    }

    get name() {
        return this.#name;
    }
}

class Computer extends Player {
    #memory;
    #impossiblePlaces;
    constructor(name, board) {
        super(name, board);
        this.#impossiblePlaces = new Set();
        this.#memory = {
            cleaned: true,
            nextPlaces: [],
            firstHit: null,
            numHits: null,
            direction: null,
        };
    }

    #getNextPos(pos) {
        const firstHitXY = extractXY(this.#memory.firstHit);
        const secondHitXY = extractXY(pos);
        const diff = [firstHitXY[0] - secondHitXY[0], firstHitXY[0] - secondHitXY[0]];
        const next = [];
        let coords = [-1, -2, -3, 1, 2, 3];
        this.#memory.direction = ORIENTATIONS.Vertical;
        if (diff[0] != 0) { //Second hit was horizontal
            this.#memory.direction = ORIENTATIONS.Horizontal;
            coords = coords.map((c) => c * 10);
        }

        for (const c of coords) {
            const newPos = sumArr(extractXY(this.#memory.firstHit), extractXY(c));
            if (newPos[0] < 0 || newPos[0] >= GAME_BOARD_DIMENSIONS || newPos[1] < 0 || newPos[1] >= GAME_BOARD_DIMENSIONS)
                continue;
            next.push(this.#memory.firstHit + c);
        }
        return next;
    }

    #getArounds(pos) {
        const coords = [-10, 1, 10, -1];
        const arounds = [];
        for (const c of coords) {
            const newPos = sumArr(extractXY(pos), extractXY(c));
            if (newPos[0] < 0 || newPos[0] >= GAME_BOARD_DIMENSIONS || newPos[1] < 0 || newPos[1] >= GAME_BOARD_DIMENSIONS)
                continue;
            arounds.push(pos + c);
        }
        return arounds;
    }

    async makePlay() {
        while (this.board.active) {
            let position = null;
            await delay(300); //Seem the computer is thinking
            if (this.#memory.nextPlaces.length != 0) {
                position = this.#memory.nextPlaces.shift();
            } else {
                position = getRandomPlace();
            }
            let XY = extractXY(position);

            let alreadyAttacked = this.board.attacksHistory.get(XY + "");
            let isImpossible = this.#impossiblePlaces.has(XY + "");

            while (alreadyAttacked || isImpossible) {
                if (this.#memory.nextPlaces.length != 0) {
                    position = this.#memory.nextPlaces.shift();
                } else {
                    position = getRandomPlace();
                }
                XY = extractXY(position);
                alreadyAttacked = this.board.attacksHistory.get(XY + "");
                isImpossible = this.#impossiblePlaces.has(XY + "");
            }
            await this.board.makeAttack(position);
            if (this.board.active) {
                this.#impossiblePlaces.add(sumArr(XY, [-1, -1]) + "");
                this.#impossiblePlaces.add(sumArr(XY, [-1, 1]) + "");
                this.#impossiblePlaces.add(sumArr(XY, [1, -1]) + "");
                this.#impossiblePlaces.add(sumArr(XY, [1, 1]) + "");

                if (this.#memory.firstHit != null) {
                    if (this.#memory.nextPlaces.length == 0) {
                        this.#memory.cleaned = true;
                        this.#memory.numHits = 0;
                        this.#memory.firstHit = null;
                        this.#memory.nextPlaces = [];
                        this.#memory.direction = null;
                    } else if (this.#memory.direction == null) {
                        this.#memory.numHits = this.#memory.numHits + 1;
                        const next = this.#getNextPos(position);
                        this.#memory.nextPlaces = next;
                    } else if (this.#memory.direction) {
                        this.#memory.numHits = this.#memory.numHits + 1;
                        if (this.#memory.numHits == 4) {
                            this.#memory.cleaned = true;
                            this.#memory.numHits = 0;
                            this.#memory.firstHit = null;
                            this.#memory.nextPlaces = [];
                            this.#memory.direction = null;
                            continue;
                        }
                    }
                }
                if (this.#memory.cleaned) {
                    this.#memory.firstHit = position;
                    this.#memory.numHits = 1;
                    const arounds = this.#getArounds(position);
                    this.#memory.nextPlaces.push(...arounds);
                    this.#memory.cleaned = false;
                }
            } else {
                if (this.#memory.nextPlaces.length != 0) {
                    if (this.#memory.direction != null) {
                        if (this.#memory.firstHit > position)
                            this.#memory.nextPlaces = this.#memory.nextPlaces.filter((place) => place > this.#memory.firstHit);
                        if (this.#memory.firstHit < position) {
                            this.#memory.nextPlaces = this.#memory.nextPlaces.filter((place) => place < this.#memory.firstHit);
                        }
                    }
                }
            }
        }
    }
}

export {Player, Computer}