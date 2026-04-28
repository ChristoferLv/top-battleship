import { describe, expect, jest, test } from '@jest/globals';
import { Ship } from './ship';
import { GameBoard } from './gameBoard.js'
import { Player, Computer } from './player';
import * as utils from './utils'

describe("Test Ship behaviour", () => {
    const anchor = 40;
    const shipSize = 3;
    const orientation = utils.ORIENTATIONS.Vertical;
    const ship = new Ship(3, 40, orientation);


    it("Should return the correct initialized position", () => {
        expect(ship.anchor).toBe(anchor);
    });

    it("Should return the correct initialized size", () => {
        expect(ship.anchor).toBe(anchor);
    });

    it("Should return the correct initialized orientation", () => {
        expect(ship.anchor).toBe(anchor);
    });

    it("Should update the position correctly", () => {
        expect(ship.anchor).toBe(anchor);
    });

    it("Should update the orientation correctly", () => {
        expect(ship.anchor).toBe(anchor);
    });

    it("Should sinalize correctly if its sunk", () => {
        for (let i = 1; i <= shipSize; i++) {
            ship.hit();
            expect(ship.isSunk()).toBe(i == shipSize);
        }
    });
});


describe("Test Player behaviour", () => {
    const playerName = "Player 2";
    const gameBoard = new GameBoard(null, null, null, null);
    const newPlayer = new Player(playerName, gameBoard);

    it("Should return its name correctly", () => {
        expect(newPlayer.name).toBe(playerName);
    });

    it("Should allow access to the gameBoard", () => {
        expect(newPlayer.board).toBe(gameBoard);
    });
});

describe("Test Computer player behaviour", () => {
    const handler = (pos, response) => { gameBoard.setActive(false) }
    const playerName = "Computer";
    const gameBoard = new GameBoard(null, null, null, handler);
    const newPlayer = new Computer(playerName, gameBoard);

    const spy = jest.spyOn(gameBoard, 'makeAttack');


    it("Should return its name correctly", () => {
        expect(newPlayer.name).toBe(playerName);
    });

    it("Should allow access to the gameBoard", () => {
        expect(newPlayer.board).toBe(gameBoard);
    });

    it("Should make an attack correctly", async () => {
        gameBoard.setActive(true);
        await newPlayer.makePlay();
        expect(spy).toHaveBeenCalled();
        expect(typeof spy.mock.calls[0][0]).toBe("number");
    });
});

describe("Test GameBoard behaviour", () => {
    const positions = [0, 2, 4, 6, 8, 50, 52, 54, 56, 58]

    const placingGrid = document.createElement("div");
    const shadowGrid = document.createElement("div");
    const mainGrid = document.createElement("div");
    const handler = jest.fn((pos, attackCB) => { attackCB(pos, utils.STATUS.WATER) });

    const newBoard = new GameBoard(placingGrid, shadowGrid, mainGrid, handler);


    it("Should redraw when call start placing", () => {
        const spyOnRedraw = jest.spyOn(newBoard, 'redraw');
        spyOnRedraw.mockImplementation(() => { });
        newBoard.startPlacing();
        expect(spyOnRedraw).toHaveBeenCalled();
        spyOnRedraw.mockRestore();
    });

    it('Should position the ships correctly', () => {
        // Cria o mock apenas para este teste
        const mockRandom = jest.spyOn(utils, 'getRandomPlace').mockReturnValue(0)
        for (const p of positions) {
            mockRandom.mockReturnValueOnce(p);
        }
        const mockOrientations = jest.spyOn(utils, 'getRandomOrientation').mockReturnValue(utils.ORIENTATIONS.Vertical)


        newBoard.makeRandomPlacement();
        newBoard.goToPlayingPhase();
        newBoard.redraw();

        for (const p of positions) {
            expect(shadowGrid.querySelector(`[id="${0}"]`).firstChild.classList.contains('ship')).toBe(true);
        }

        for (let i = 0; i < 100; i++) {
            if (positions.includes(i)) continue;
            expect(shadowGrid.querySelector(`[id="${0}"]`).firstChild.classList.contains('ship')).not.toBe();
        }

        mockRandom.mockRestore();
        mockOrientations.mockRestore();
    });


    it("Should receive attacks ans sinalize correctly", () => {
        const testCases = [[32, utils.STATUS.WATER], [0, utils.STATUS.HIT]];
        for (const t of testCases) {
            const XY = utils.extractXY(t[0]);
            newBoard.receiveAttack(XY);
            newBoard.redraw();
            expect(shadowGrid.querySelector(`[id="${t[0]}"]`).classList.contains(t[1]));
        }
    });

    it("Should active/deactivate correctly", () => {
        newBoard.setActive(false);
        expect(newBoard.active).toBe(false);
        newBoard.setActive(true);
        expect(newBoard.active).toBe(true);
        newBoard.setActive(false);
        expect(newBoard.active).toBe(false);
        newBoard.setActive(true);
    })

    it("Should make attacks", () => {
        let posResult = null;
        let result = null;
        function attackResponse(pos, receivedResult) {
            posResult = pos;
            result = receivedResult;
        }

        jest.spyOn(newBoard, 'attackResponse').mockImplementation(attackResponse);
        const postToAttack = 30;
        const XY = utils.extractXY(30);
        newBoard.makeAttack(30);
        expect(posResult).toStrictEqual(XY);
        expect(result).toBe(utils.STATUS.WATER)
    })

    it("Should sinalize correctly when the game finishes", () => {

        for (let i = 0; i < 100; i++) {
            if (positions.includes(i)) continue;
            const XY = utils.extractXY(i);
            newBoard.receiveAttack(XY);
            expect(newBoard.checkFinishGame()).toBe(false)
        }

        for (const p of positions) {
            const XY = utils.extractXY(p);
            newBoard.receiveAttack(XY);
        }
        expect(newBoard.checkFinishGame()).toBe(true)
    });

});

describe("Test utilitary functions.", () => {
    const arr1 = [1, 4];
    const arr2 = [3, -2];
    const arrResult = [4, 2];
    const position1 = 45;
    const XY1 = [4, 5];
    const position2 = 10;
    const XY2 = [1, 0];
    const position3 = 3;
    const XY3 = [0, 3];


    describe("Test sumArr", () => {
        it("Should return a new array with the values on the positions being the sum of the values on the other two arrays", () => {
            const result = utils.sumArr(arr1, arr2);
            expect(result).toStrictEqual(arrResult);
        });
    });

    describe("Test extractXY", () => {
        it("Should extract the X and Y coordinates from a integer number", () => {
            expect(utils.extractXY(position1)).toStrictEqual(XY1);
            expect(utils.extractXY(position2)).toStrictEqual(XY2);
            expect(utils.extractXY(position3)).toStrictEqual(XY3);
        })
    });

    describe("Test getRandomPlace", () => {
        it("Should return an integer number", () => {
            expect(typeof utils.getRandomPlace()).toEqual("number");
        })
    });

    describe("Test getRandomOrientation", () => {
        it("Should return an orientation", () => {
            expect([utils.ORIENTATIONS.Vertical, utils.ORIENTATIONS.Horizontal]).toContain(utils.getRandomOrientation());
        });
    });
});