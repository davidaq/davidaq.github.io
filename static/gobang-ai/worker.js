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
  const context = {};
  while (true) {
    if (paused) {
      await new Promise(r => setTimeout(r, 100));
    } else {
      const rounds = 10;
      await startSelfPlay(model, { rounds, train: true, context });
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

