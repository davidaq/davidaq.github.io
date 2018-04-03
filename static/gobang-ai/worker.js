const window = self;
importScripts('convnet.js');
importScripts('convnet-model.js');
importScripts('game.js');
importScripts('player-ai.js');
importScripts('selfplay.js');

class WorkerModel extends ConvnetModel {
  learn (state, action, target) {
    postMessage({ state, action, target });
    return 0;
  }
}

const model = new WorkerModel();
let paused = true;

setTimeout(async () => {
  const playOptions = {
    rounds: 20,
    train: true,
    context: {}
  };
  while (true) {
    if (paused) {
      await new Promise(r => setTimeout(r, 100));
    } else {
      await startSelfPlay(model, playOptions);
      postMessage({ play: playOptions.rounds });
      await new Promise(r => setTimeout(r, 1));
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

