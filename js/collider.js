var boxCount = 1;
var BOX_HEIGHT = 40;
var BOX_WIDTH = 40;
var BOX_BORDER = 2;
var WALL_BORDER = 1;
var WINDOW_ORIGIN = { x: 327, y: 416 };
var CATAPULT = { x: 150, y: 150 };
var SPEED = { min: 1, max: 3 };

function Box(container, availableWindow) {

    var _this = this;

    this._createBox = function(position) {

        var element = document.createElement('div');
        element.innerHTML = boxCount++;
        element.className = 'box';
        element.style.borderColor = '#' + Math.random().toString(16).slice(2, 8);

        return element;
    }

    this._getRandomPosition = function() {

        var position = {

            x: this._getRandomInt(0 + WALL_BORDER * 2, this.container.offsetWidth - (BOX_HEIGHT + WALL_BORDER * 2 + BOX_BORDER * 2)),
            y: this._getRandomInt(0 + WALL_BORDER * 2, this.container.offsetHeight - (BOX_HEIGHT + WALL_BORDER * 2 + BOX_BORDER * 2))
        }

        return position;
    }

    this._getRandomInt = function(min, max) {

        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    this.render = function() {

        this.element.style.left = this.position.x + 'px';
        this.element.style.bottom = this.position.y + 'px';
    }

    this._animate = function(moveStep) {

        _this.position.x += moveStep * _this.direction.x * _this.speed;
        _this.position.y += moveStep * _this.direction.y * _this.speed;
    }

    this.checkWallCollision = function() {

        if (_this.position.x >= _this.availableWindow.x || _this.position.x <= 0) _this.direction.x *= -1;
        if (_this.position.y >= _this.availableWindow.y || _this.position.y <= 0) _this.direction.y *= -1;
    }

    this.init = function() {

        this.count = boxCount;
        this.container = container;
        this.position = {};
        this.element;
        this.speed = this._getRandomInt(SPEED.min, SPEED.max);
        var x, y;
        do {
            x = this._getRandomInt(-1, 1);
            y = this._getRandomInt(-1, 1);
        } while (x == 0 || y == 0);
        this.direction = { x: x, y: y };
        this.availableWindow = availableWindow;
        this.position = this._getRandomPosition();
        this.element = this._createBox(this.position);
    }

    this.changeDirection = function() {

        _this.direction.x *= -1;
        _this.direction.y *= -1;
    }

    this.reposition = function() {

        this.position = this._getRandomPosition();
    }

    this.setPosition = function(position) {

        this.position = {

            x: position.x,
            y: position.y
        };
    }

    this.init();
}

function Collider() {

    var _this = this;
    this.colliderId;

    this.init = function() {

        this.boxes = [];
        this.container = document.getElementById('container');
        this.availableWindow = {

            x: this.container.offsetWidth - (BOX_WIDTH + WALL_BORDER * 2 + BOX_BORDER * 2),
            y: this.container.offsetHeight - (BOX_HEIGHT + WALL_BORDER * 2 + BOX_BORDER * 2)
        };

        document.getElementById('newBox').addEventListener('click', function() {

            var box = _this._createBox();
            document.getElementById('boxCount').innerHTML = parseInt(document.getElementById('boxCount').innerHTML) + 1;
        });

        document.getElementById('toggle').addEventListener('click', function() {

            if (this.innerHTML == 'Start') {
                _this.move();
                this.innerHTML = 'Pause';
            } else if (this.innerHTML == 'Pause') {
                _this.stop();
                this.innerHTML = 'Start';
            }
        });

        document.getElementById('reset').addEventListener('click', this._reset);

        _this._createCatapult();
    }

    this._createCatapult = function() {

        var box = new Box(this.container, this.availableWindow);
        box.direction = { x: 1, y: 1 };
        box.setPosition({ x: CATAPULT.x - BOX_WIDTH + BOX_BORDER * 2, y: CATAPULT.y - BOX_HEIGHT + BOX_BORDER * 2 });
        box.render();
        this.container.appendChild(box.element);
        box.speed = 0;
        var dragFunction = function(e) {

            e.preventDefault();
            var x = e.clientX - WINDOW_ORIGIN.x;
            var y = WINDOW_ORIGIN.y - e.clientY;
            x = x > (CATAPULT.x - BOX_WIDTH + BOX_BORDER * 2) ? (CATAPULT.x - BOX_WIDTH + BOX_BORDER * 2) : x;
            x = x < 0 ? 0 : x;
            y = y > (CATAPULT.y - BOX_HEIGHT + BOX_BORDER * 2) ? (CATAPULT.y - BOX_HEIGHT + BOX_BORDER * 2) : y;
            y = y < 0 ? 0 : y;
            box.setPosition({ x, y });
            box.render();
        };

        var moveWithMouse = function() {

			document.addEventListener('mouseup', cleanMouseEvents);
            document.addEventListener('mousemove', dragFunction);
        }

        var cleanMouseEvents = function(e) {

            document.removeEventListener('mousemove', dragFunction);
            box.element.removeEventListener('mousedown', moveWithMouse);
            document.removeEventListener('mouseup', cleanMouseEvents);

            var speed = (1 - (box.position.x + box.position.y) / ((CATAPULT.x - BOX_WIDTH + BOX_BORDER * 2) + (CATAPULT.y - BOX_HEIGHT + BOX_BORDER * 2))) * 3;
            box.speed = speed;
            box.direction = { x: 1, y: 1 };
            
            _this.boxes.push(box);
            // _this._createCatapult();
        }

        box.element.addEventListener('mousedown', moveWithMouse);
    }

    this._createBox = function() {

        var box = new Box(this.container, this.availableWindow);
        while (this._checkOverlapWithAllBoxes(box)) {

            box.reposition();
        }
        box.render();
        this.container.appendChild(box.element);
        this.boxes.push(box);
        return box;
    }

    this.move = function() {

        this.stop();
        this.colliderId = setInterval(function() {

            for (var i = 0; i < _this.boxes.length; i++) {
                _this.boxes[i]._animate(1);
                _this.boxes[i].checkWallCollision();
                _this.boxes[i].render();
            }
            _this._checkCollisionWithAllBoxes();
            // _this._checkOverlapAmongAllBoxes();
        }, 10);
    }

    this.stop = function() {

        if (this.colliderId) {

            clearInterval(this.colliderId);
            this.colliderId = false;
        }
    }

    this._checkOverlapAmongAllBoxes = function() {

        for (var i = 0; i < _this.boxes.length - 1; i++) {

            for (var j = i + 1; j < _this.boxes.length; j++) {

                if (_this._checkBoxCollision(_this.boxes[i], _this.boxes[j])) {

                    _this._reAlignBoxes(_this.boxes[i], _this.boxes[j]);
                }
            }
        }
    }

    this._reAlignBoxes = function(box1, box2) {

        box1.position.x += Math.abs(box1.position.x - box2.position.x);
        box1.position.y += Math.abs(box1.position.y - box2.position.y);
    }

    this._checkOverlapWithAllBoxes = function(box) {

        for (var i = 0; i < _this.boxes.length; i++) {

            if (_this._checkBoxOverlap(box, _this.boxes[i])) return true;
        }
    }

    this._checkBoxOverlap = function(box1, box2) {

        if (Math.abs(box1.position.x - box2.position.x) <= (BOX_WIDTH + WALL_BORDER * 2 + BOX_BORDER * 2) && Math.abs(box1.position.y - box2.position.y) <= (BOX_HEIGHT + WALL_BORDER * 2 + BOX_BORDER * 2)) {

            // console.warn('box ' + box1.count + ' and box ' + box2.count + ' overlap.');
            return true;
        }
    }

    this._checkCollisionWithAllBoxes = function() {

        for (var i = 0; i < _this.boxes.length - 1; i++) {

            for (var j = i + 1; j < _this.boxes.length; j++) {

                _this._checkBoxCollision(_this.boxes[i], _this.boxes[j]);
            }
        }
    }

    this._checkBoxCollision = function(box1, box2) {

        if (Math.abs(box1.position.x - box2.position.x) < (BOX_WIDTH + WALL_BORDER * 2 + BOX_BORDER * 2) && Math.abs(box1.position.y - box2.position.y) < (BOX_HEIGHT + WALL_BORDER * 2 + BOX_BORDER * 2)) {

            // console.warn('box ' + box1.count + ' and box ' + box2.count + ' collide.');
            box1.changeDirection();
            box2.changeDirection();
            return true;
        }
    }

    this._reset = function() {

        while (_this.container.hasChildNodes()) {
            _this.container.removeChild(_this.container.lastChild);
        }
        _this.boxes = [];
        boxCount = 1;
        document.getElementById('boxCount').innerHTML = boxCount - 1;
    }
}

var collider = new Collider();
collider.init();
collider.move();
