var Game = {
    status: "off", //"on" or "off"
    pause: null,
    replay: null,

    // 重新开始时的游戏初始化
    prepare: function() {
        Game.status = "off";        
        
        mapElem = Game.map.element;
        for (var len = mapElem.childNodes.length, i = len - 1; i >= 0; i--) {
            mapElem.removeChild(mapElem.childNodes[i]);
        }

        Game.tetromino = null;
        clearTimeout(Game.timeoutId);

        for (var i = 0; i < 20; i++) {
            Game.map.blocks[i] = new Array();
        }

        Game.nextType = Game.typeCode[Math.floor(Math.random() * 7)];
        Game.changeNextBoard();
        // Game.createTetromino();
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
        for (var i = 0; i < 4; i++) {
            var n = 20 - (parseInt(Game.tetromino.blocks[i].style.top) / 30) - 1; // 行所在下标

            Game.map.blocks[n].push(Game.tetromino.blocks[i]);
        }
        for (var a = 19; a >= 0; a--) {
            if (Game.map.blocks[a].length === 10) {
                for (var j = 0; j < 10; j++) {
                    Game.map.blocks[a][j].classList.add("toFlash");
                }
                Game.flash();

            }
        }

        clearTimeout(Game.timeoutId);
        
        Game.createTetromino();
        Game.tetromino.moveDown();
    },

    // 延时调用闪烁方块
    flashCount: 0,
    flash: function() {
        var blocks = document.getElementsByClassName("toFlash"); 
        for (var i = 0; i < blocks.length; i++) {
            blocks[i].classList.toggle("flashing");            
        }
        if (Game.flashCount < 3) {
            setTimeout(Game.flash, 250);
            Game.flashCount++;
        } else {
            Game.flashCount = 0;
            var n = 20 - (parseInt(blocks[0].style.top) / 30) - 1; // 行所在下标
            for (var i = n + 1; i < 20; i++) {
                Game.map.blocks[i-1] = Game.map.blocks[i];
                for (var j = 0; j < Game.map.blocks[i-1].length; j++) {
                    Game.map.blocks[i-1][j].style.top = (20 - i) * 30 + "px";
                } 
            }
            for (var i = 9; i >= 0; i--) {
                Game.map.element.removeChild(blocks[i]);
                // blocks[i].classList.remove("toFlash");                
            };
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
    SPEED: 1000
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
                Game.timeoutId = setTimeout(Game.tetromino.moveDown, Game.SPEED);            
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
    } else {
        Game.status = "off";
    }
};

var replayHandler = function() {
    Game.prepare();
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

    Game.pause.addEventListener("click", pauseHandler, false);
    Game.replay.addEventListener("click", replayHandler, false);
    document.addEventListener("keydown", operationHandler, false);

    Game.prepare();
}, false);