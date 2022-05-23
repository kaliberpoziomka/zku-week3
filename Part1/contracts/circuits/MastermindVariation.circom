pragma circom 2.0.0;

// [assignment] implement a variation of mastermind from https://en.wikipedia.org/wiki/Mastermind_(board_game)#Variation as a circuit

// Super Mastermind (a.k.a. Deluxe Mastermind; a.k.a. Advanced Mastermind) 1975 Polish version
// Colors: 8, Holes: 5

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";

template MastermindVariation() {
        // Public inputs

    signal input guess[5];

    signal input pubSolnHash;
    signal input pubNumHit;
    signal input pubNumBlow;

    // Private inputs
    signal input soln[5];
    signal input privSalt;

    signal output solnHashOut;

    var j = 0;
    var k = 0;
    var l = 0;
    component lessThan[10];
    component equalGuess[10];
    component equalSoln[10];
    var equalIdx = 0;

    // Check for color range (8 colors, so 0-7 allowed)
    for (j = 0; j < 5; j++) {
        lessThan[j] = LessThan(32);
        lessThan[j].in[0] <== guess[j];
        lessThan[j].in[1] <== 8;
        lessThan[j].out === 1;
        lessThan[j+5] = LessThan(32);
        lessThan[j+5].in[0] <== soln[j];
        lessThan[j+5].in[1] <== 8;
        lessThan[j+5].out === 1;
        for (k = j+1; k < 5; k++) {
            // Create a constraint that the solution and guess digits are unique. no duplication.
            equalGuess[equalIdx] = IsEqual();
            equalGuess[equalIdx].in[0] <== guess[j];
            equalGuess[equalIdx].in[1] <== guess[k];
            equalGuess[equalIdx].out === 0;
            equalSoln[equalIdx] = IsEqual();
            equalSoln[equalIdx].in[0] <== soln[j];
            equalSoln[equalIdx].in[1] <== soln[k];
            equalSoln[equalIdx].out === 0;
            equalIdx += 1;
        }
    }

     // Count hit & blow
    var hit = 0;
    var blow = 0;
    component equalHB[25];

    for (j=0; j<5; j++) {
        for (k=0; k<5; k++) {
            equalHB[5*j+k] = IsEqual();
            equalHB[5*j+k].in[0] <== soln[j];
            equalHB[5*j+k].in[1] <== guess[k];
            blow += equalHB[5*j+k].out;
            if (j == k) {
                hit += equalHB[5*j+k].out;
                blow -= equalHB[5*j+k].out;
            }
        }
    }

    // Create a constraint around the number of hit
    component equalHit = IsEqual();
    equalHit.in[0] <== pubNumHit;
    equalHit.in[1] <== hit;
    equalHit.out === 1;
    
    // Create a constraint around the number of blow
    component equalBlow = IsEqual();
    equalBlow.in[0] <== pubNumBlow;
    equalBlow.in[1] <== blow;
    equalBlow.out === 1;

    // Verify that the hash of the private solution matches pubSolnHash
    component poseidon = Poseidon(6);

    poseidon.inputs[0] <== privSalt;

    for (l = 0; l < 5; l++) {
        poseidon.inputs[l+1] <== soln[l];
    }

    solnHashOut <== poseidon.out;
    pubSolnHash === solnHashOut;


}

component main {public [guess, pubNumHit, pubNumBlow, pubSolnHash]} = MastermindVariation();