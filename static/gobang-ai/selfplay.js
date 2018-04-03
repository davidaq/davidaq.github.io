
async function startSelfPlay (model, options = {}) {
  const {
    rounds = 10,
    randomness = [0.1, (Math.random() * 0.5 + 0.2).toFixed(1) - 0],
    train = false,
    context = {},
  } = options;
  let ai = context.ai;
  if (!ai) {
    ai = randomness.map(r => new PlayerAI(model, r, train));
    context.ai = ai;
  }
  const wins = {};
  wins[ai[0].randomness] = 0;
  wins[ai[1].randomness] = 0;
  let game
  for (let i = 0; i < rounds; i++) {
    if (Math.random() < 0.5) {
      ([ai[0], ai[1]] = [ai[1], ai[0]]);
    }
    game = new Game(ai[0], ai[1]);
    await game.play();
    if (game.win) {
      wins[ai[game.win - 1].randomness] += 1;
    }
  }
  return { wins, game };
}

