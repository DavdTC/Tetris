const tetrisCanvas = document.getElementById("tetris-canvas");
const ctxMain = tetrisCanvas.getContext("2d");
const ctxNext = document.getElementById("next-tetris-canvas").getContext("2d")

const gameBox = document.querySelector(".game-box")

const startDisplay = document.querySelector(".start-display")

const score = document.getElementById("score")
const optionsButton = document.getElementById("button-option")
const optionsDisplay = document.createElement("div")
const audioMusic = document.createElement("audio");
let actualVolumeValue = 1

const rotateSound = document.createElement("audio")
const hardDropSound = document.createElement("audio")
const clearLineSound = document.createElement("audio")
const moveSound = document.createElement("audio")

let actualSoundValue = 1

const gameOverDisplay = document.querySelector(".game-over")
const buttonRetry = document.querySelector(".game-over button")


const numCols = 10;
const numRows = 20;

const cellSize = 30 
let actualScore = 0

const lineColors = ["#333333"]

// Background-color, red, blue, yellow, orange, green, cyan, purple
const colors = ["#010101", "#EB0045", "#0F6CF2", "#FDDA1D", "#FF8300", "#3DCA31", "#21CDFF", "#B231F0"];


let lastTime = 0
let deltaTime = 0
const intervalTime = 1000

class Piece {
  constructor(x) {
    this.shape = getShape();
    this.x = x;
    this.y = 0;
  }

  drawNextPiece(ctxNext) {
    this.shape.forEach((row, y) => {
      row.forEach((num, x) => {
        ctxNext.fillStyle = colors[num];
        ctxNext.strokeStyle = lineColors[0];
        ctxNext.lineWidth = 2;
        if (num > 0) {
          ctxNext.fillRect(x *cellSize + 90, y *cellSize, cellSize, cellSize);
          ctxNext.strokeRect(x *cellSize + 90, y *cellSize, cellSize, cellSize);
        }
      })
    })
  }

  rotatePiece() {
    const newShape = Array.from({ length: this.shape[0].length }, () => Array(this.shape.length).fill(0));
    
    for (let i = 0; i < this.shape.length; ++i) {
      for (let j = 0; j < this.shape[i].length; ++j) {
        newShape[j][newShape[0].length - 1 - i] = this.shape[i][j]
      }
    }

    this.shape = newShape

  }

  clearPiece() {
    ctxNext.clearRect(0, 0, ctxNext.canvas.width, ctxNext.canvas.height);
  }

}

class Board {
  constructor(ctxMain, ctxNext) {
    this.ctxMain = ctxMain;
    this.ctxNext = ctxNext;
    this.color = colors[0];
    this.init();
  }

  // Initialize the board
  init() {
    //this.grid = aux_grid // PRUEBA TEST
    this.grid = Array.from({ length: numRows }, () => Array(numCols).fill(0));
    this.ctxMain.canvas.width = numCols * cellSize;
    this.ctxMain.canvas.height = numRows * cellSize;
    this.drawBoard();
    this.actualPiece = new Piece(3);
    this.nextPiece = new Piece(3);
    this.nextPiece.drawNextPiece(this.ctxNext);
    this.drawPiece();
  }

  // Draw the board where the player plays
  drawBoard() {
    this.grid.forEach((row, y) => {
      row.forEach((num, x) => {

        if (num == 0) {
          this.ctxMain.fillStyle = this.color;
          this.ctxMain.strokeStyle = lineColors[0];
          this.ctxMain.lineWidth = 1;
          this.ctxMain.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          this.ctxMain.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        } else {
          this.ctxMain.fillStyle = colors[num]
          this.ctxMain.strokeStyle = lineColors[0]
          this.ctxMain.lineWidth = 2;
          this.ctxMain.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
          this.ctxMain.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize)
        }
      });
    });
  }

  drawPiece() {
    this.actualPiece.shape.forEach((row, y) => {
      row.forEach((num, x) => {
        if (num > 0) {
          this.ctxMain.fillStyle = colors[num]
          this.ctxMain.strokeStyle = lineColors[0]
          this.ctxMain.lineWidth = 2
          this.ctxMain.fillRect((x * cellSize) + (this.actualPiece.x * cellSize), (y * cellSize) + (this.actualPiece.y * cellSize), cellSize, cellSize);
          this.ctxMain.strokeRect((x * cellSize) + (this.actualPiece.x * cellSize), (y * cellSize) + (this.actualPiece.y * cellSize), cellSize, cellSize);

        }
      })
    })

  }

  drawShadowPiece() {
    
  }

  fallingPiece() {
    this.actualPiece.y += 1;
  }

  solidifyPiece() {
    this.actualPiece.shape.forEach((row, y) => {
      row.forEach((num, x) => {
        if (num != 0) {
          if (y + this.actualPiece.y < 0) {
            gameOver()
          } else {
            this.grid[y + this.actualPiece.y][this.actualPiece.x + x] = num
          }
          
        }
      })
    })
  }

  changePiece() {
    this.actualPiece = this.nextPiece
    this.nextPiece.clearPiece()
    this.nextPiece = new Piece(3)
    this.nextPiece.drawNextPiece(this.ctxNext)
  }

  checkCollisions() {
    
    if (this.actualPiece.x < 0) {
      ++this.actualPiece.x
    
    } else if (this.actualPiece.x + this.actualPiece.shape[0].length > numCols) {
      --this.actualPiece.x
    
    } else if (this.actualPiece.y + this.actualPiece.shape.length > numRows) {
      --this.actualPiece.y
      this.solidifyPiece()
      this.changePiece()
    
    } else if (this.checkIsOccupied()) {
      --this.actualPiece.y
      this.solidifyPiece()
      this.changePiece()
    }

  }

  checkIsOccupied() {
    return this.actualPiece.shape.some((row, y) => {
      return row.some((num, x) => {
        if (this.actualPiece.y + this.actualPiece.shape.length > this.grid.length) {
          return true
        }
        return (this.grid[y + this.actualPiece.y][this.actualPiece.x + x] != 0 && num != 0)
      })
    })
  }

  clearLines() {
    let counter = 0

    for (let i = 0; i < this.grid.length; ++i) {
      if (this.grid[i].every(num => {
        return num != 0
      })) {
        clearLineSound.play()

        ++counter
        this.grid.forEach((num2, j) => {
          this.grid[i][j] = 0
        }) 
        
        for (let z = i; z >= 1 ; --z) {
          for (let c = 0; c < this.grid[z].length; ++c) {
            this.grid[z][c] = this.grid[z - 1][c]
          }
        }
        
      }

    }

    
    actualScore += counter * 10
  }

  hardDrop() {
    while (!this.checkIsOccupied()) {
      this.fallingPiece()
    }
    --this.actualPiece.y
    hardDropSound.play()
    this.solidifyPiece() 
    this.changePiece()
  }
}

// The shape of the blocks in the preview

function getShape() {
  const shapes = [
    [[1],
    [1],
    [1],
    [1]
    ],
    [
    [2, 2, 0],
    [0, 2, 2]
    ],
    
    [
    [0, 3, 3],
    [3, 3, 0]
    ],
    
    [
    [4, 4],
    [4, 4]
    ],
    
    [
    [5, 5],
    [0, 5],
    [0, 5]
    ],
    
    [
    [6, 6],
    [6, 0],
    [6, 0]
    ],
    [[0, 7, 0],
    [7, 7, 7]

    ]
];
  return shapes[Math.floor(Math.random() * shapes.length)];
}

function movePiece(event) {
    switch(event.code) {
      case "ArrowLeft":
        --board.actualPiece.x
        if (board.checkIsOccupied()) {
          ++board.actualPiece.x
        }
        moveSound.play()
        break;
  
      case "ArrowRight":
        ++board.actualPiece.x
        if (board.checkIsOccupied()) {
          --board.actualPiece.x
        }
        moveSound.play()
        break;
  
      case "ArrowDown":
        ++board.actualPiece.y
        moveSound.play()
        break;
  
      case "ArrowUp":
        board.actualPiece.rotatePiece()
        rotateSound.play()
        break;
      case "Space":
        board.hardDrop()
        break;
  
      default:
        break;
    }

    
  }

let loop

function loopGame(timestamp) {
  deltaTime = timestamp - lastTime

  if (deltaTime > intervalTime) {
    board.fallingPiece()
    lastTime = timestamp
  } 

  board.drawBoard()
  board.checkCollisions()
  board.drawPiece()
  board.clearLines()
  score.innerHTML = actualScore
  if (loop != null) {
    loop = window.requestAnimationFrame(loopGame)
  }
    
}

function gameOver() {
  document.removeEventListener("keydown", movePiece)
  optionsButton.removeEventListener("click", pauseGame)
  board.actualPiece.clearPiece()
  window.cancelAnimationFrame(loop)
  gameOverDisplay.style.visibility = "visible"
  loop = null
  audioMusic.pause()
  buttonRetry.addEventListener("click", reset)
}

function reset() {
  board.actualPiece.clearPiece()
  actualScore = 0
  board = new Board(ctxMain, ctxNext)
  buttonRetry.removeEventListener("click", reset)
  startGame()
}

function startGame() {
  document.addEventListener("keydown", movePiece)
  optionsButton.addEventListener("click", pauseGame)
  audioMusic.addEventListener("ended", startMusic)
  startDisplay.remove()
  score.textContent = actualScore
  gameOverDisplay.style.visibility = "hidden"
  startMusic()
  loop = window.requestAnimationFrame(loopGame)
}

function pauseGame() {
  optionsDisplay.classList.add("options-display")
  gameBox.appendChild(optionsDisplay)
  
  const musicVolume = document.createElement("p")
  musicVolume.textContent = "Music"
  musicVolume.style.margin = 0
  musicVolume.style.marginTop = "15px"
  optionsDisplay.appendChild(musicVolume)

  const musicVolumeSlider = document.createElement("input")
  musicVolumeSlider.type = "range"
  musicVolumeSlider.min = 0
  musicVolumeSlider.max = 1
  musicVolumeSlider.step = 0.1
  musicVolumeSlider.value = actualVolumeValue
  musicVolumeSlider.addEventListener("input", function() {
    audioMusic.volume = musicVolumeSlider.value
    actualVolumeValue = musicVolumeSlider.value
  })
  optionsDisplay.appendChild(musicVolumeSlider)

  const audioVolume = document.createElement("p")
  audioVolume.textContent = "Sound"
  audioVolume.style.margin = 0
  audioVolume.style.marginTop = "15px"
  optionsDisplay.appendChild(audioVolume)


  const audioVolumeSlider = document.createElement("input")
  audioVolumeSlider.type = "range"
  audioVolumeSlider.min = 0
  audioVolumeSlider.max = 1
  audioVolumeSlider.step = 0.1
  audioVolumeSlider.value = actualSoundValue

  audioVolumeSlider.addEventListener("input", function() {
    rotateSound.volume = audioVolumeSlider.value
    hardDropSound.volume = audioVolumeSlider.value
    moveSound.volume = audioVolumeSlider.value
    clearLineSound.volume = audioVolumeSlider.value
    actualSoundValue = audioVolumeSlider.value
  })
  optionsDisplay.appendChild(audioVolumeSlider)

  const button = document.createElement("button")
  button.type = button
  button.classList.add("button-class")
  button.textContent = "Exit"
  button.addEventListener("click", continueGame)
  optionsDisplay.appendChild(button)

  audioMusic.pause()
  loop = null
}

function continueGame() {
  optionsDisplay.textContent = ""
  optionsDisplay.remove()
  loop = window.requestAnimationFrame(loopGame)
  audioMusic.play()
}

function startMusic() {
  audioMusic.preload = "auto"
  audioMusic.src = "music/chantris.m4a"
  audioMusic.play()
  document.body.appendChild(audioMusic)

  rotateSound.preload = "auto"
  rotateSound.src = "music/rotate.wav"
  document.body.appendChild(rotateSound)

  hardDropSound.preload = "auto"
  hardDropSound.src = "music/hardrop.wav"
  document.body.appendChild(hardDropSound)

  clearLineSound.preload = "auto"
  clearLineSound.src = "music/line.wav"
  document.body.appendChild(clearLineSound)

  moveSound.preload = "auto"
  moveSound.src = "music/move.wav"
  document.body.appendChild(moveSound)

}

let board = new Board(ctxMain, ctxNext)
