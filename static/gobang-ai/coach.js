
class GameMachine {
  play (action) { } 

  getState () { }
}

class Coach {
  constructor (gameMachineFactory, model) {
    this.gameMachineFactory = gameMachineFactory;
  }

  train () {
  }
}

// new Coach(Game)

