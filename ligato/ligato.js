
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

  get opponent() {
    return this.player === kPlayerRed ? this.kPlayerBlue : kPlayerRed;
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
    if (this.positionsBlue.reduce((prev, curr) => prev && curr === 0, true)) {
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
      const p = Math.floor(Math.random() * Math.min(5, total - (kMaxTokens - i - 1)));
      array[i] = p;
      total -= p + 1;
    });

    // Randomly place the blue tokens.  The sum of the distances of all the
    // tokens from the baseline is at most 20.  Tokens are placed at most
    // 4 positions from the baseline.
    total = 20;
    this.positionsBlue.forEach((_, i, array) => {
      const p = Math.floor(Math.random() * Math.min(5, total - (kMaxTokens - i - 1)));
      array[i] = kMaxRows - 1 - p;
      total -= p + 1;
    });

    this.calculateTokensPerRow();
  }

  // Move the currenlt player's token at |index| to |position|.
  moveToken(index, position) {
    if (Number.isNaN(position))
      throw new Error(`position isNaN`);

    if (index < 0 || index >= kMaxTokens)
      throw new Error(`Invalid index=${index}`);

    if (position < 0 || position >= kMaxRows)
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
  //
  // If |row| equals -1 this means "force move back" regardless of whether
  // a row is filled or not.
  moveOpponentsBackIfNeeded(row) {
    let moveBack = true;
    if (row !== -1) {
      for (let i = 0; i < kMaxTokens; i++) {
        if (this.positionsBlue[i] !== row && this.positionsRed[i] !== row) {
          moveBack = false;
          break;
        }
      }
    }

    if (moveBack) {
      const oppo = this.oppoPositions;
      const curr = this.positions;
      const dec = this.player === kPlayerRed ? 1 : -1;

      for (let i = 0; i < kMaxTokens; i++) {
        const pos = oppo[i];
        const backPos = pos + dec;
        if (Number.isNaN(backPos))
          throw new Error(`backPos isNaN`);

        if (backPos >= 0 && backPos < kMaxRows && backPos !== curr[i])
          oppo[i] = backPos;
      }

      this.calculateTokensPerRow();
    }

    return moveBack;
  }

  // Change the current player.
  changePlayer() {
    this.player = this.player === kPlayerRed ? kPlayerBlue : kPlayerRed;
  }

  // Returns true if the opponent player has at least one move.
  get canOpponentMove() {
    const canMove = this.oppoPositions.reduce((acc, position, track) => {
      if (acc)
        return true;

      const count = this.tokensPerRow[position];
      const newUp = position + count;
      const newDown = position - count;

      const canGoUp = (newUp >= 0 && newUp < kMaxRows &&
        newUp !== this.positions[track]);
      const canGoDown = (newDown >= 0 && newDown < kMaxRows &&
        newDown !== this.positions[track]);
      return canGoUp || canGoDown;
    }, false);
    if (!canMove)
      console.log(`${this.opponent} can't move`);
    return canMove;
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

  // Gets the current state of the game along with a score.
  getObservation() {
    const state = this.positionsRed.concat(this.positionsBlue);
    state.push(this.player === kPlayerRed ? 0 : 1);
    return {
      state: state,
      score: this.getScore()
    };
  }

  // Gets a score based on the current state of the game.
  getScore() {
    const curr = this.positions;
    const oppo = this.oppoPositions;
    let baseline = 0;
    let oppoBaseline = 0;
    if (this.player === kPlayerRed) {
      oppoBaseline = kMaxRows - 1;
    } else {
      baseline = kMaxRows - 1;
    }

    // Caculate the curent player's value.
    let score = curr.reduce((acc, position) =>
        acc + Math.abs(position - baseline), 0);

    // Subtract the opponent player's value.
    score -= oppo.reduce((acc, position) =>
        acc + Math.abs(position - oppoBaseline), 0);

    if (Number.isNaN(score)) {
      console.assert(!Number.isNaN(score), "************");
      score = 0;
    }

    return score;
  }

  // Performs the next step in the game.  The current player's token in
  // |track| is moved either up or down depending on  |updown|.
  //
  // |track| is a number representing the track X [0, kMaxTokens).
  // |updown| is a bool representing whether the token moves up (higher row
  // number) or down (lower row number).
  //
  // The function returns true if the move was valid and false otherwise.
  step(track, updown) {
    const pos = this.positions[track];
    const count = this.tokensPerRow[pos];
    const newPos = pos + (updown ? count : -count);

    // If the new position is invalid or if the opponent occupies the new
    // position, this is an invalid move.  Return false and don't update the
    // game state.
    if (newPos < 0 || newPos >= kMaxRows ||
        newPos === this.oppoPositions[track]) {
      return false;
    }

    this.moveToken(track, newPos);
    this.moveOpponentsBackIfNeeded(newPos);

    // If the opponent can't move, move all tokens back one and try again.
    while (!this.canOpponentMove)
      this.moveOpponentsBackIfNeeded(-1);

    this.changePlayer();
    return true;
  }

  validateState() {
    console.assert(this.positionsRed.length == kMaxTokens, 'Bad red length');
    console.assert(this.positionsBlue.length == kMaxTokens, 'Bad blue length');
    console.assert(this.tokensPerRow.length == kMaxRows, 'Bad count length');
    this.positionsRed.forEach((v, i) => {
      console.assert(!Number.isNaN(v) && v >= 0 && v < kMaxRows, `red[${i}]=${v}`);
    });
    this.positionsBlue.forEach((v, i) => {
      console.assert(!Number.isNaN(v) && v >= 0 && v < kMaxRows, `blue[${i}]=${v}`);
    });
    this.tokensPerRow.forEach((v, i) => {
      console.assert(!Number.isNaN(v) && v >= 0 &&v <= kMaxTokens, `tokens[${i}]=${v}`);
    });
  }
}
