const window = self;
importScripts('convnet.js');
importScripts('convnet-model.js');
importScripts('game.js');
importScripts('player-ai.js');
importScripts('selfplay.js');

class WorkerModel extends ConvnetModel {
  learn (boardState, action, target) {
    postMessage({ boardState, action, target });
    return 0;
  }
}

const model = new WorkerModel();
let paused = true;

setTimeout(async () => {
  while (true) {
    if (paused) {
      await new Promise(r => setTimeout(r, 100));
    } else {
      const randomness = [0.1, Math.random() * 0.5 + 0.1];
      const rounds = 5;
      await startSelfPlay(model, { rounds, randomness });
      postMessage({ play: rounds });
      await new Promise(r => setTimeout(r, 10));
    }
  }
}, 10);

onmessage = async (e) => {
  if (typeof e.data.pause === 'boolean') {
    paused = e.data.pause;
  } else if (e.data.model) {
    model.fromJSON(e.data.model);
  }
}

postMessage({ ready: true });

