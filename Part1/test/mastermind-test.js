//[assignment] write your own unit test to show that your Mastermind variation circuit is working as expected
const chai = require("chai");
const path = require("path");
const { buildPoseidon } = require("circomlibjs");

const wasm_tester = require("circom_tester").wasm;

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);

const assert = chai.assert;
const expect = chai.expect;

describe("MasterMind Variation Test", function () {
    this.timeout(100000000);
    
    it("Should pass: correct inputs, correct solution, correct clue", async () => {
        const circuit = await wasm_tester("contracts/circuits/MastermindVariation.circom");
        await circuit.loadConstraints();

        const poseidon = await buildPoseidon();
        const guess = [1, 2, 3, 4, 5];
        const soln = [1, 2, 3, 4, 5];
        const pubNumHit = 5;
        const pubNumBlow = 0;

        const privSalt = 42;
        const pubSolnHash = poseidon.F.toString((poseidon([privSalt, ...soln])));

        const INPUT = {
            guess: guess.map(v => `${v}`),
            pubSolnHash: pubSolnHash,
            pubNumHit: `${pubNumHit}`,
            pubNumBlow: `${pubNumBlow}`,    
            soln: soln.map(v => `${v}`),
            privSalt: `${privSalt}`,
        }

        const witness = await circuit.calculateWitness(INPUT, true);


        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(pubSolnHash)), "Wrong public solution hash hash");
    });

    it("Should fail: incorrect solution with repeated numbers", async () => {
        const circuit = await wasm_tester("contracts/circuits/MastermindVariation.circom");
        await circuit.loadConstraints();

        const poseidon = await buildPoseidon();
        const guess = [1, 2, 3, 4, 5];
        const soln = [1, 1, 1, 1, 1];
        const pubNumHit = 5;
        const pubNumBlow = 0;

        const privSalt = 42;
        const pubSolnHash = poseidon.F.toString((poseidon([privSalt, ...soln])));

        const INPUT = {
            guess: guess.map(v => `${v}`),
            pubSolnHash: pubSolnHash,
            pubNumHit: `${pubNumHit}`,
            pubNumBlow: `${pubNumBlow}`,    
            soln: soln.map(v => `${v}`),
            privSalt: `${privSalt}`,
        }

        await expect(circuit.calculateWitness(INPUT, true)).to.Throw;
    });

    it("Should fail: incorrect clue", async () => {
        const circuit = await wasm_tester("contracts/circuits/MastermindVariation.circom");
        await circuit.loadConstraints();

        const poseidon = await buildPoseidon();
        const guess = [1, 2, 3, 4, 5];
        const soln = [1, 2, 3, 6, 4];
        const pubNumHit = 3;
        const pubNumBlow = 0; // should be 1 here

        const privSalt = 42;
        const pubSolnHash = poseidon.F.toString((poseidon([privSalt, ...soln])));

        const INPUT = {
            guess: guess.map(v => `${v}`),
            pubSolnHash: pubSolnHash,
            pubNumHit: `${pubNumHit}`,
            pubNumBlow: `${pubNumBlow}`,    
            soln: soln.map(v => `${v}`),
            privSalt: `${privSalt}`,
        }

        await expect(circuit.calculateWitness(INPUT, true)).to.Throw;
    });
});