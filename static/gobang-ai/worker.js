const window = self;
importScripts('convnet.js');
importScripts('convnet-model.js');
importScripts('game.js');
importScripts('player-ai.js');
importScripts('selfplay.js');

class WorkerModel extends ConvnetModel {
  learn (boardState, target, error) {
    postMessage({ boardState, target, error });
  }
}

const model = new WorkerModel();

onmessage = async (e) => {
  if (e.data.model) {
    model.fromJSON(e.data.model);
  } else if (e.data.play) {
    await startSelfPlay(model, {
      rounds: e.data.play,
      randomness: e.data.randomness,
    });
    postMessage({ play: e.data.play });
  }
}

