class Ship {
    #length;
    #hits;
    #sunk;
    #startCell;
    #orientation;

    constructor(type, cell, orientation) {
        this.#length = type;
        this.#hits = 0;
        this.#sunk = false;
        this.#startCell = cell;
        this.#orientation = orientation;
    }

    hit() {
        this.#hits = this.#hits + 1;
        if (this.#hits == this.#length) this.#sunk = true;
    }

    isSunk() {
        return this.#sunk;
    }

    get orientation() {
        return this.#orientation;
    }

    set orientation(newOrientation) {
        this.#orientation = newOrientation;
    }

    get length() { return this.#length };

    get anchor() { return this.#startCell };

    set anchor(anchor) { this.#startCell = anchor };
}

export { Ship }