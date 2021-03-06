function compare(value1, value2) {
    if (value1 < value2) {
        return 1;
    } else if (value1 > value2) {
        return -1;
    } else {
        return 0;
    }
}

var Game = {
    status: "off", //"on" or "off"
    pause: null,
    replay: null,

    score: 0,
    lines: 0,
    level: 1,
    scoreElem: null,
    linesElem: null,
    levelElem: null,

    // 重新开始时的游戏初始化
    prepare: function() {
        Game.status = "off";
        Game.pause.addEventListener("click", pauseHandler, false);
        document.addEventListener("keydown", pauseKeyHandler, false);
        Game.pause.classList.remove("status-invalid");
        Game.pause.classList.remove("status-start");

        mapElem = Game.map.element;
        for (var len = mapElem.childNodes.length, i = len - 1; i >= 0; i--) {
            mapElem.removeChild(mapElem.childNodes[i]);
        }

        Game.tetromino = null;
        clearTimeout(Game.timeoutId);
        Game.speed = 500;

        for (var i = 0; i < 20; i++) {
            Game.map.blocks[i] = new Array();
        }

        Game.nextType = Game.typeCode[Math.floor(Math.random() * 7)];
        Game.changeNextBoard();
        // Game.createTetromino();

        Game.score = 0;
        Game.lines = 0;
        Game.level = 1;
        Game.linesElem.firstChild.nodeValue = Game.lines;
        Game.scoreElem.firstChild.nodeValue = Game.score;
        Game.levelElem.firstChild.nodeValue = Game.level;
    },

    // 刷新下一个面板
    changeNextBoard: function() {
        var all = document.getElementsByClassName("next-block");
        for (var i = 0, len = all.length; i < len; i++) {
            if (all[i].classList.contains("next-" + Game.nextType)) {
                all[i].classList.add("now");
            } else {
                all[i].classList.remove("now");
            }
        }
    },

    // 添加/移除操作事件
    // addOperating: function() {},
    // removeOperating: function() {},

    // 创建新tetromino
    createTetromino: function() {
        Game.tetromino = new Tetromino(Game.nextType);
        Game.nextType = Game.typeCode[Math.floor(Math.random() * 7)];
        Game.changeNextBoard();
    },

    // 当tetromino落地时
    setTetromino: function() {
        var linesIndex = [];
        for (var i = 0; i < 4; i++) {
            var n = 20 - (parseInt(Game.tetromino.blocks[i].style.top) / 30) - 1; // 行所在下标
            if (n >= 20) { // 游戏失败
                Game.status = "off";
                Game.pause.removeEventListener("click", pauseHandler, false);
                document.removeEventListener("keydown", pauseKeyHandler, false);
                Game.pause.classList.remove("status-start");
                Game.pause.classList.add("status-invalid");
                return false;
            }

            Game.map.blocks[n].push(Game.tetromino.blocks[i]);
            if (Game.map.blocks[n].length === 10) {
                linesIndex.push(n);
            }
        }
        if (linesIndex.length) {
            Game.flash(linesIndex);
        }

        Game.score += 10;

        if (Game.score >= (Game.level * 2000)) {
            Game.level++;
            Game.speed -= 20;
        }
        Game.levelElem.firstChild.nodeValue = Game.level;
        Game.scoreElem.firstChild.nodeValue = Game.score;

        clearTimeout(Game.timeoutId);

        Game.createTetromino();
        Game.tetromino.moveDown();

        return true;
    },

    // 延时调用闪烁方块
    flashCount: 0,
    // 清除已满的行
    flash: function(linesIndex) {
        if (Game.tetromino) {
            for (var i = 0; i < linesIndex.length; i++) {
                for (var j = 0; j < 10; j++) {
                    Game.map.blocks[linesIndex[i]][j].classList.toggle("flashing");
                }
            }
            if (Game.flashCount < 4) {
                setTimeout("Game.flash(["+linesIndex.toString()+"])", 250);
                Game.flashCount++;
            } else {
                Game.flashCount = 0;

                linesIndex.sort(compare); // 降序排序 从上面的行开始处理
                for (var a = 0; a < linesIndex.length; a++) {
                    // var n = 20 - (parseInt(blocks[0].style.top) / 30) - 1; // 行所在下标
                    n = linesIndex[a]; // 行所在下标
                    for (var i = Game.map.blocks[n].length - 1; i >= 0; i--) {
                        Game.map.element.removeChild(Game.map.blocks[n][i]);
                    }
                    for (var i = n + 1; i < 20; i++) {
                        Game.map.blocks[i-1] = Game.map.blocks[i];
                        Game.map.blocks[i] = [];
                        for (var j = 0; j < Game.map.blocks[i-1].length; j++) {
                            Game.map.blocks[i-1][j].style.top = (20 - i) * 30 + "px";
                        }
                    }
                }

                Game.lines += linesIndex.length;
                var deltaScore = 0;
                switch(linesIndex.length) {
                    case 1:
                        deltaScore = 100;
                        break;
                    case 2:
                        deltaScore = 200;
                        break;
                    case 3:
                        deltaScore = 400;
                        break;
                    case 4:
                        deltaScore = 800;
                        break;
                }
                Game.score += deltaScore;

                if (Game.score >= (Game.level * 2000)) {
                    Game.level++;
                    Game.speed -= 20;
                }
                Game.levelElem.firstChild.nodeValue = Game.level;
                Game.linesElem.firstChild.nodeValue = Game.lines;
                Game.scoreElem.firstChild.nodeValue = Game.score;
            }
        } else {
            Game.flashCount = 0;
        }
    },

    // 移动之前检查是否可行
    check: function(pos) {
        var zoneCondition = true;
        for (var i = 0; i < 4; i++) {
            if (pos[i].top >= 600 || pos[i].left < 0 || pos[i].left >= 300) {
                zoneCondition = false;
            }
        }

        if (Game.status === "off") {
            return false;
        } else if (Game.map.hasItem(pos)) {
            return false;
        } else if (!zoneCondition) {
            return false;
        } else {
            return true;
        }
    },

    map: {
        element: null,
        width: 10,
        height: 20,
        blocks: [], // 每一项存储一行 每一行也是一个数组

        // 如果有给定坐标的节点，返回true
        hasItem : function(pos) {
            for (var i = 0, length = this.blocks.length; i < length; i++) {
                for (var j = 0, len = this.blocks[i].length; j < len; j++) {
                    if (this.blocks[i][j]) {
                        for (var n = 0; n < 4; n++) {
                            if (parseInt(this.blocks[i][j].style.left) === pos[n].left && parseInt(this.blocks[i][j].style.top) === pos[n].top) {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        }
    },

    tetromino: null,
    typeCode: ["i","t","l","j","s","z","o"],
    posAtFirst: {
        i: [3,6,-1,-1],
        t: [5,6,-2,-1],
        l: [3,3,-1,-2],
        j: [3,5,-1,-2],
        s: [5,6,-2,-2],
        z: [3,4,-2,-2],
        o: [4,5,-2,-2]
    },
    nextType: "",
    speed: 500
};

// tetromino 构造函数
function Tetromino(type) {
    this.type = type;

    this.blocks = [];
    for (var i = 0; i < 4; i++) {
        var block = document.createElement("div");
        block.classList.add("block");
        block.classList.add("block-"+type);
        this.blocks[i] = block;
        Game.map.element.appendChild(block);
    }

    this.blocks[0].style.top = Game.posAtFirst[type][2] * 30 + "px";
    this.blocks[0].style.left = Game.posAtFirst[type][0] * 30 + "px";
    this.blocks[1].style.top = "-30px";
    this.blocks[1].style.left = "120px";
    this.blocks[2].style.top = "-30px";
    this.blocks[2].style.left = "150px";
    this.blocks[3].style.top = Game.posAtFirst[type][3] * 30 + "px";
    this.blocks[3].style.left = Game.posAtFirst[type][1] * 30 + "px";
}

Tetromino.prototype = {
    constructor : Tetromino,

    move: function(dir) {
        var newPos = Game.tetromino.calculate(dir);
        if (Game.check(newPos)) {
            for (var i = 0; i < 4; i++) {
                Game.tetromino.blocks[i].style.top = newPos[i].top + "px";
                Game.tetromino.blocks[i].style.left = newPos[i].left + "px";
            }
            return true;
        } else {
            return false;
        }
    },
    // moveLeft: function() {},
    // moveRight: function() {},
    moveDown: function() {
        if (Game.tetromino instanceof Tetromino) {
            var result = Game.tetromino.move("down");

            if (result === true) {
                Game.timeoutId = setTimeout(Game.tetromino.moveDown, Game.speed);
            } else if (Game.status !== "off") {
                Game.setTetromino();
            }
        }
    },

    // 走一步
    moveDownByOneStep: function() {
        var result = Game.tetromino.move("down");
        if (result === false && Game.status !== "off") {
            Game.setTetromino();
        }
    },

    toBottom: function() {
        var result;
        do {
            result = Game.tetromino.move("down");
        } while (result);
        if (Game.status !== "off") {
            Game.setTetromino();
        }
    },
    // rotate: function() {},
    calculate: function(dir) {
        var newPos = [{},{},{},{}];
        if (dir === "down") {
            for (var i = 0; i < 4; i++) {
                newPos[i].top = parseInt(this.blocks[i].style.top) + 30;
                newPos[i].left = parseInt(this.blocks[i].style.left);
            }
        } else if (dir === "left") {
            for (var i = 0; i < 4; i++) {
                newPos[i].top = parseInt(this.blocks[i].style.top);
                newPos[i].left = parseInt(this.blocks[i].style.left) - 30;
            }
        } else if (dir === "right") {
            for (var i = 0; i < 4; i++) {
                newPos[i].top = parseInt(this.blocks[i].style.top);
                newPos[i].left = parseInt(this.blocks[i].style.left) + 30;
            }
        } else if (dir === "rotate") {
            var posO = {}; // 旋转围绕的原点
            // 确定原点
            switch(Game.tetromino.type) {
                case "i":
                case "z":
                case "l":
                case "j":
                    // 1
                    posO.top = parseInt(this.blocks[1].style.top);
                    posO.left = parseInt(this.blocks[1].style.left);
                    break;
                case "t":
                case "s":
                    // 2
                    posO.top = parseInt(this.blocks[2].style.top);
                    posO.left = parseInt(this.blocks[2].style.left);
                    break;
                case "o":
                    posO.top = 0;
                    posO.left = 0;
            }

            var oldTop, oldLeft;
            for (var i = 0; i < 4; i++) {
                oldTop = parseInt(this.blocks[i].style.top);
                oldLeft = parseInt(this.blocks[i].style.left);

                newPos[i].top = posO.top + oldLeft - posO.left;
                newPos[i].left = posO.left + posO.top - oldTop;
            }
        }
        return newPos;
    }
};

var pauseHandler = function() {
    if (Game.status === "off") {
        if (!(Game.tetromino instanceof Tetromino)) {
            // alert(Game.tetromino instanceof Tetromino);
            Game.createTetromino();
        }
        Game.status = "on";
        Game.tetromino.moveDown();

        Game.pause.classList.add("status-start");
    } else {
        Game.status = "off";
        Game.pause.classList.remove("status-start");
    }
};

var pauseKeyHandler = function() {
    if (event.keyCode === 80) {
        pauseHandler();
    }
};

var replayHandler = function() {
    Game.prepare();
};

var replayKeyHandler = function(event) {
    if (event.keyCode === 82) {
        replayHandler();
    }
};

var infoHandler = function() {
    document.getElementById("info-board").classList.toggle("show");
};

var operationHandler = function(event) {
    if (Game.status === "on") {
        switch(event.keyCode) {
            case 38:
            case 87:
                // up
                Game.tetromino.move("rotate");
                break;
            case 39:
            case 68:
                // right
                Game.tetromino.move("right");
                break;
            case 40:
            case 83:
                // down
                Game.tetromino.moveDownByOneStep();
                break;
            case 37:
            case 65:
                // left
                Game.tetromino.move("left");
                break;
            case 32:
                // space
                Game.tetromino.toBottom();
                break;
        }
    }
};

window.addEventListener("load", function() {
    Game.map.element = document.getElementById("map");
    Game.pause = document.getElementById("pause-btn");
    Game.replay = document.getElementById("replay-btn");

    document.getElementById("info-btn").addEventListener("click", infoHandler, false);

    Game.scoreElem = document.getElementById("score-num");
    Game.linesElem = document.getElementById("lines-num");
    Game.levelElem = document.getElementById("level-num");

    Game.pause.addEventListener("click", pauseHandler, false);
    document.addEventListener("keydown", pauseKeyHandler, false);
    Game.replay.addEventListener("click", replayHandler, false);
    document.addEventListener("keydown", replayKeyHandler, false);
    document.addEventListener("keydown", operationHandler, false);

    Game.prepare();
}, false);