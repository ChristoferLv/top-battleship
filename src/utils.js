
const GAME_BOARD_DIMENSIONS = 10;

const SIZES_ARR = Object.freeze([4, 3, 3, 2, 2, 2, 1, 1, 1, 1]);

const getSizesArr = () => SIZES_ARR;

function extractXY(id) {
    const Y = id % 10;
    const X = Math.trunc(id / 10);
    return [X, Y];
}

function getRandomPlace()  {
    return Math.floor(Math.random() * 100);
}

const getRandomOrientation = () => {
    const rand = Math.floor(Math.random() * Object.keys(ORIENTATIONS).length);
    const randVal = ORIENTATIONS[Object.keys(ORIENTATIONS)[rand]];
    return randVal;
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const sumArr = (arrA, arrB) => { return arrA.map((num, i) => num + arrB[i]) };

const aroundPlaces = {
    "vertical": [
        [[-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1]],
        [[-1, 0], [-1, 1], [0, 1], [1, 1], [2, 1], [2, 0], [2, -1], [1, -1], [0, -1], [-1, -1]],
        [[-1, 0], [-1, 1], [0, 1], [1, 1], [2, 1], [3, 1], [3, 0], [3, -1], [2, -1], [1, -1], [0, -1], [-1, -1]],
        [[-1, 0], [-1, 1], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [4, 0], [4, -1], [3, -1], [2, -1], [1, -1], [0, -1], [-1, -1]]],
    "horizontal": [
        [[-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1]],
        [[-1, 0], [-1, 1], [-1, 2], [0, 2], [1, 2], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1]],
        [[-1, 0], [-1, 1], [-1, 2], [-1, 3], [0, 3], [1, 3], [1, 2], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1]],
        [[-1, 0], [-1, 1], [-1, 2], [-1, 3], [-1, 4], [0, 4], [1, 4], [1, 3], [1, 2], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1]]
    ]
};

const ORIENTATIONS = Object.freeze({
    Vertical: Symbol("vertical"),
    Horizontal: Symbol("horizontal")
});

const STATUS = Object.freeze({
    "WATER": "WATER",
    "HIT": "HIT"
});

export { GAME_BOARD_DIMENSIONS, SIZES_ARR, getSizesArr, extractXY, getRandomPlace, getRandomOrientation, delay, sumArr, aroundPlaces, ORIENTATIONS, STATUS }