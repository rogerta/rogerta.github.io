
export const kMaxTokens = 6;  // Tokens per player, or number of tracks.
export const kMaxRows = 10;  // Rows in the game. Must equal css var(--max-rows).

// Values that can be assigned to the player variable.
export const kPlayerRed = 'red';
export const kPlayerBlue = 'blue';

export class Game {
  player;  // Current player.
  positionsRed;
  positionsBlue;
  tokensPerRow;

  constructor() {
    this.reset();
  }

  get positions() {
    return this.player === kPlayerRed ? this.positionsRed : this.positionsBlue;
  }

  get oppoPositions() {
    return this.player === kPlayerRed ? this.positionsBlue : this.positionsRed;
  }

  // Checks if there is a winner.  Returns one of the kPlayerXXX values
  // if the corresponding player has won and null if there is no winner.
  get winner() {
    if (this.positionsRed.reduce((prev, curr) => prev && curr === kMaxRows - 1,
                                 true)) {
      return kPlayerRed;
    }
    if (this.positionsBlue.reduce((prev, curr) => { prev && curr === 0},
                                   true)) {
      return kPlayerBlue;
    }
    return null;
  }

  reset() {
    this.player = kPlayerBlue;  // Current player.
    this.positionsRed = Array(kMaxTokens).fill(0);
    this.positionsBlue = Array(kMaxTokens).fill(0);

    // Randomly place the red tokens.  The sum of the distances of all the
    // tokens from the baseline is at most 20.  Tokens are placed at most
    // 4 positions from the baseline.
    let total = 20;
    this.positionsRed.forEach((_, i, array) => {
      const p = Math.floor(Math.random() *
          Math.min(4, total - kMaxTokens - 1));
      array[i] = p;
      total -= array[i];
    });

    // Randomly place the blue tokens.  The sum of the distances of all the
    // tokens from the baseline is at most 20.  Tokens are placed at most
    // 4 positions from the baseline.
    total = 20;
    this.positionsBlue.forEach((_, i, array) => {
      const p = Math.floor(Math.random() *
          Math.min(4, total - kMaxTokens - 1));
      array[i] = kMaxRows - 1 - p;
      total -= p;
    });

    this.calculateTokensPerRow();
  }

  // Move the currenlt player's token at |index| to |position|.
  moveToken(index, position) {
    if (index < 0 || index >= kMaxTokens)
      throw new Error(`Invalid index=${index}`);

    if (position < 0 || index >= kMaxRows)
      throw new Error(`Invalid position=${position}`);

    if (this.oppoPositions[index] === position)
      throw new Error(`Opponent in index=${index} position=${position}`);

    this.tokensPerRow[this.positions[index]]--;
    this.tokensPerRow[position]++;
    this.positions[index] = position;
  }

  // Moves all opponent tokens back by one if the current player's move
  // has filled an entire row with tokens.  Opponent tokens are only moved
  // if the new position is not occupied.  |row| is the row into which the
  // current player's token has moved into.
  moveOpponentsBackIfNeeded(row) {
    let moveBack = true;
    for (let i = 0; i < kMaxTokens; i++) {
      if (this.positionsBlue[i] !== row && this.positionsRed[i] !== row) {
        moveBack = false;
        break;
      }
    }

    if (moveBack) {
      const oppo = this.oppoPositions;
      const curr = this.positions;
      const dec = this.player === kPlayerRed ? 1 : -1;

      for (let i = 0; i < kMaxTokens; i++) {
        const pos = oppo[i];
        const backPos = pos + dec;
        if (backPos > 0 && backPos <= kMaxRows && backPos !== curr[i])
          oppo[i] = backPos;
      }

      this.calculateTokensPerRow();
    }

    return moveBack;
  }

  // Change the current player.
  changePlayer() {
    this.player = this.player === kPlayerBlue ? kPlayerRed : kPlayerBlue;
  }

  // Calculate how many tokens or either player is in each row.  This is
  // used to determine how far a token can be moved.
  calculateTokensPerRow() {
    this.tokensPerRow = Array(kMaxRows).fill(0);

    // Increment the tokens-per-row count based on the positions of the
    // player tokens.
    for (let i = 0; i < kMaxTokens; i++) {
      this.tokensPerRow[this.positionsRed[i]]++;
      this.tokensPerRow[this.positionsBlue[i]]++;
    }
  }

  // Methods used for training the ML model.

  // Gets the current state of the game along with a value.
  getObservation() {
    return {
      state: this.positionsRed.concat(this.positionsBlue)
          .push(this.player === kPlayerRed ? 0 : 1),
      value: 0  // TODO: figure out good value.
    };
  }

  // Performs the next step in the game.  The current player's token in
  // |track| is moved to |position|.
  //
  // |track| is a number representing the track X [0, kMaxTokens).
  // |position| is a number X representing the row [0, kMaxRows)
  step(track, position) {
    this.moveToken(track, position);
    this.moveOpponentsBackIfNeeded();
    this.changePlayer();
  }
}
