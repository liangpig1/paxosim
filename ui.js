NodeElement = function (cvs, node, ui) {
    this.cvs = cvs;
    this.node = node;
    this.ui = ui;
    this.halfLength = 10;
    this.isSelected = false;

    var rad = node.getId() / node.countNodes() * Math.PI * 2;
    this.x = cvs.width / 2 + (cvs.width - 30) / 2 * Math.sin(rad);
    this.y = cvs.height / 2 - (cvs.height - 30) / 2 * Math.cos(rad);
}

NodeElement.prototype.draw = function () {
    ctx = this.cvs.getContext("2d");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (this.isSelected) {
        ctx.save();
        ctx.strokeStyle = "blue";
        ctx.strokeRect(this.x - this.halfLength - 1, this.y - this.halfLength - 1, 22, 22);
        ctx.restore();
    }

    if (this.node.isWorking()) {
        ctx.strokeStyle = ctx.fillStyle = "blue";
        ctx.strokeRect(this.x - this.halfLength, this.y - this.halfLength, 20, 20);
        ctx.fillText(this.node.getId(), this.x, this.y);
    } else {
        ctx.fillStyle = "red";
        ctx.fillRect(this.x - this.halfLength, this.y - this.halfLength, 20, 20);
        ctx.fillStyle = "white";
        ctx.fillText(this.node.getId(), this.x, this.y);
    }
}

NodeElement.prototype.isMouseIn = function (x, y) {
    return (x >= this.x - this.halfLength &&
        x <= this.x + this.halfLength &&
        y >= this.y - this.halfLength &&
        y <= this.y + this.halfLength);
}

NodeElement.prototype.mouseLeftDown = function () {
    this.ui.updateSettingsTable(this);
}

NodeElement.prototype.mouseRightDown = function () {
    this.node.reverseState();
}

MessageElement = function (cvs, msg, ui) {
    this.cvs = cvs;
    this.msg = msg;
    this.ui = ui;
    
    nodeElement1 = ui.nodeElements[msg.from];
    nodeElement2 = ui.nodeElements[msg.to];
    x1 = nodeElement1.x;
    y1 = nodeElement1.y;
    x2 = nodeElement2.x;
    y2 = nodeElement2.y;
    timePass = ui.framework.getTime() - msg.sendTime;
    percent = timePass / (msg.recvTime - msg.sendTime);
    this.x = x1 + percent * (x2 - x1);
    this.y = y1 + percent * (y2 - y1);
}

MessageElement.prototype.draw = function () {
    ctx = this.cvs.getContext("2d");
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.x - 35, this.y - 25, 70, 50);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "white";
    ctx.stroke();

    if (this.msg.data.type == "prepare") {
        ctx.fillStyle = "#99ff99";
    } else if (this.msg.data.type == "promise") {
        ctx.fillStyle = "#9999ff";
    } else {
        ctx.fillStyle = "#ff9999";
    }
    ctx.fill();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "black";
    ctx.font = "bold 8pt 'Courier'";
    ctx.fillText(this.msg.data.type, this.x, this.y - 20);

    ctx.font = "10pt 'Courier'";
    if (this.msg.data.type == "prepare") {
        ctx.fillText("N:" + this.msg.data.detail, this.x, this.y + 5);
    } else if (this.msg.data.type == "promise") {
        ctx.fillText("N:" + this.msg.data.detail[0], this.x, this.y - 5);
        ctx.fillText("N0:" + this.msg.data.detail[1], this.x, this.y + 5); 
        ctx.fillText("V:" + this.msg.data.detail[2], this.x, this.y + 15); 
    } else {
        ctx.fillText("N:" + this.msg.data.detail[0], this.x, this.y - 5);
        ctx.fillText("V:" + this.msg.data.detail[1], this.x, this.y + 15); 
    }
   // ctx.fillText(this.msg.data.detail, this.x - 10, this.y);
    if (this.msg.dropped) {
        ctx.lineWidth = 5;

        ctx.beginPath();
        ctx.moveTo(this.x - 20, this.y - 20);
        ctx.lineTo(this.x + 20, this.y + 20);
        ctx.strokeStyle = "red";
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.x - 20, this.y + 20);
        ctx.lineTo(this.x + 20, this.y - 20);
        ctx.strokeStyle = "red";
        ctx.stroke();
    }
    ctx.restore();
}

MessageElement.prototype.isMouseIn = function (x, y) {
    return (x >= this.x - 35 &&
        x <= this.x + 35 &&
        y >= this.y - 15 &&
        y <= this.y + 15);
}

MessageElement.prototype.mouseLeftDown = function () {
    this.msg.dropped = true;
}

MessageElement.prototype.mouseRightDown = function () {
}

ConnectionElement = function (cvs, conn, ui) {
}

ConnectionElement.prototype.draw = function () {
}

ConnectionElement.prototype.isMouseIn = function (x, y) {
}

ConnectionElement.prototype.mouseLeftDown = function () {
}

ConnectionElement.prototype.mouseRightDown = function () {
}

Input = function (elemt, ui, setObjValue, getObjValue, min, max, isInt, f) {
    this.elemt = elemt;
    this.ui = ui;
    this.setObjValue = setObjValue;
    this.getObjValue = getObjValue;

    this.min = min;
    this.max = max;
    this.isInt = isInt;
    this.enabled = false;

    var v;
    elemt.value = (v = this.getObjValue()) != null ? v : "N/A";

    var self = this;
    elemt.onchange = this.f ? this.f : function(e) {
        self.onChange();
    }

    return this;
}

Input.prototype.onUpdate = function() {
    this.elemt.value = (v = this.getObjValue()) != null ? v : "N/A";
}

Input.prototype.onChange = function () {
    value = this.elemt.value;

    if (this.isInt) {
        value = Math.round(value);
    }
    if (value < this.min) {
        value = this.min;
    } else if (value > this.max) {
        value = this.max;
    }

    if (this.setObjValue(this.elemt.value)) {
        this.elemt.value = value;
    } else {
        this.elemt.value = "N/A";
    }
}

Button = function (elemt, ui, onclick, isEnable) {
    this.elemt = elemt;
    this.ui = ui;
    this.isEnable = isEnable ? isEnable : null;
    this.enabled = true;
    var self = this;
    elemt.onclick = function(e) { if (self.enable) onclick(e); };
}

Button.prototype.disable = function() {
    this.enabled = false;
}

Button.prototype.enable = function() {
    this.enabled = true;
}

Button.prototype.onUpdate = function() {
    (this.isEnable != null) &&  (this.isEnable() ? this.enable() : this.disable());
}

UI = function (framework, canvas, settingsTable) {
    this.framework = framework;
    this.canvas = canvas;
    this.settingsTable = settingsTable;
    this._isStarted = false;
    this._currentNode = null;

    var self = this;
    this.canvas.onmousedown = function (e) { self.onCanvasClick(e); };
    this.canvas.oncontextmenu = function (e) { e.preventDefault(); e.stopPropagation(); };
    this.initSettingsTable();
}

// static function
UI.addClass = function(elemt, c) {
}

UI.removeClass = function(elemt, c) {
}

UI.prototype.findElementAt = function (x, y) {
    for (var i = 0; this.messageElements && i < this.messageElements.length; ++i) {
        if (this.messageElements[i].isMouseIn(x, y)) {
            return this.messageElements[i];
        }
    }

    for (var i = 0; this.nodeElements && i < this.nodeElements.length; ++i) {
        if (this.nodeElements[i].isMouseIn(x, y)) {
            return this.nodeElements[i];
        }
    }

    for (var i = 0; this.connectionElements && i < this.connectionElements.length; ++i) {
        if (this.connectionElements[i].isMouseIn(x, y)) {
            return this.connectionElements[i];
        }
    }

    return null;
}

UI.prototype.onCanvasClick = function (e) {
    var rect = this.canvas.getBoundingClientRect();
    if (e.button == 0 /*left*/) {
        var obj = this.findElementAt(e.clientX - rect.left, e.clientY - rect.top);
        if (obj) {
            obj.mouseLeftDown();
        } else {
            // you can set framework informations when clicking background
            this.updateSettingsTable(null);
        }
    } else if (e.button == 2 /*right*/) {
        var obj = this.findElementAt(e.clientX - rect.left, e.clientY - rect.top);
        if (obj) {
            obj.mouseRightDown();
        }
    }
}

UI.prototype.generateSettledElements = function () {
    this.nodeElements = [];
    var nodes = this.framework.getNodes();
    for (var i = 0; i < nodes.length; ++i) {
        this.nodeElements.push(new NodeElement(this.canvas, nodes[i], this));
    }

    this.connectionElements = [];
    var graph = this.framework.getGraph();
    for (var i = 0; i < nodes.length; ++i) {
        for (var j = 0; j < nodes.length; ++j) {
            this.connectionElements.push(
                new ConnectionElement(this.canvas, graph[i][j], this));
        }
    }
}

UI.prototype.generateMovingElements = function () {
    this.messageElements = [];
    var messages = this.framework.getMessages();
    for (var i = 0; i < messages.length; ++i) {
        this.messageElements.push(new MessageElement(
            this.canvas, messages[i], this));
    }
}

UI.prototype.draw = function () {
    var ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (var i = 0; i < this.connectionElements.length; ++i) {
        this.connectionElements[i].draw();
    }

    for (var i = 0; i < this.nodeElements.length; ++i) {
        this.nodeElements[i].draw();
    }

    for (var i = 0; i < this.messageElements.length; ++i) {
        this.messageElements[i].draw();
    }
}

UI.prototype.run = function () {
    this.generateSettledElements();

    var self = this;
    this.intervalId = setInterval(function () {
        self.framework.tick();
        self.generateMovingElements();
        self.draw();
    }, 40);
}

UI.prototype.initSettingsTable = function() {
    var self = this;
    this.widgets = [
    new Button(document.getElementById("restart"), this, function() {
        if (!self._isStarted) {
            self._isStarted = true;
            self.framework.reset();
            self.run();
        } else {
            if (confirm("Restart?")) {
                self.framework.reset();
                self.generateSettledElements();
            }
        }
    }),

    new Input(document.getElementById("node_count"), this, 
        function (value) {
            if (self.framework != null && self.framework.nodeCount != null) { 
                self.framework.nodeCount = value;
                return true; 
            } 
            return false; 
        }, 
        function () { 
            if (self.framework != null)
                return self.framework.nodeCount;
            return null;
        }, 
        2, 100, true
    ),

    new Input(document.getElementById("fail_rate"), this,
        function (value) {
            if (self._currentNode) {
                self._currentNode.failRate = value;
                return true;
            }
            return false;
        }, 
        function () {
            if (self._currentNode)
                return self._currentNode.failRate;
            return null;
        },
        0, 1, false
    ),

    new Button(document.getElementById("propose"), this, 
        function() {
            if (self._currentNode) {
                self._currentNode.request();
            }
        }, 
        function() {
            return self._currentNode != null;
        }
    )];
}

UI.prototype.updateSettingsTable = function(obj) {
    if (this._currentNode) {
        this._currentNode.isSelected = false;
    }
    this._currentNode = obj;
    if (obj) {
        obj.isSelected = true;
    }
    this.onUpdate();
}

UI.prototype.onUpdate = function() {
    for (var i = 0; i < this.widgets.length; i++) {
        this.widgets[i].onUpdate();
    }
}
