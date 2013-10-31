NodeElement = function (cvs, node, ui) {
    this.cvs = cvs;
    this.node = node;
    this.ui = ui;
    this.halfLength = 10;

    var rad = node.getId() / node.countNodes() * Math.PI * 2;
    this.x = cvs.width / 2 + (cvs.width - 30) / 2 * Math.sin(rad);
    this.y = cvs.height / 2 - (cvs.height - 30) / 2 * Math.cos(rad);
}

NodeElement.prototype.draw = function () {
    ctx = this.cvs.getContext("2d");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

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
    this.ui.updateSettingsTable(this.node);
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
    ctx.font = "10pt 'Courier'";
    ctx.fillStyle = "black";

	if (this.msg.data.type == "prepare") {
		ctx.fillText("N:" + this.msg.data.detail, this.x, this.y);
	} else if (this.msg.data.type == "promise") {
		ctx.fillText("N:" + this.msg.data.detail[0], this.x, this.y - 15);
		ctx.fillText("N0:" + this.msg.data.detail[1], this.x, this.y); 
		ctx.fillText("V:" + this.msg.data.detail[2], this.x, this.y + 15); 
	} else {
		ctx.fillText("N:" + this.msg.data.detail[0], this.x, this.y - 10);
		ctx.fillText("V:" + this.msg.data.detail[1], this.x, this.y + 10); 
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

InfoRow = function (prompt, obj, key) {
    this.prompt = prompt;
    this.obj = obj;
    this.key = key;
}

InfoRow.prototype.generateRow = function () {
    row = document.createElement("tr");
    left = document.createElement("td");
    left.innerHTML = this.prompt;
    right = document.createElement("td");
    right.innerHTML = this.obj[this.key];
    row.appendChild(left);
    row.appendChild(right);
    return row;
}

InputRow = function (prompt, obj, key, min, max, isInt) {
    this.prompt = prompt;
    this.obj = obj;
    this.key = key;
    this.min = min;
    this.max = max;
    this.isInt = isInt;
    return this;
}

InputRow.prototype.generateRow = function () {
    row = document.createElement("tr");
    left = document.createElement("td");
    left.innerHTML = this.prompt;
    right = document.createElement("td");

    inputBox = document.createElement("input");
    inputBox.value = this.obj[this.key];
    var self = this;
    inputBox.onchange = function (e) { self.onChange(inputBox); }

    right.appendChild(inputBox);
    row.appendChild(left);
    row.appendChild(right);
    return row;
}

InputRow.prototype.onChange = function (inputBox) {
    value = inputBox.value;

    if (this.isInt) {
        value = Math.round(value);
    }
    if (value < this.min) {
        value = this.min;
    } else if (value > this.max) {
        value = this.max;
    }

    this.obj[this.key] = value;
    inputBox.value = value;
}

ButtonRow = function (prompt, onclick) {
    this.prompt = prompt;
    this.onclick = onclick;
}

ButtonRow.prototype.generateRow = function () {
    row = document.createElement("tr");
    left = document.createElement("td");
    right = document.createElement("td");

    button = document.createElement("input");
    button.type = "button";
    button.value = this.prompt;
    button.onclick = this.onclick;

    right.appendChild(button);
    row.appendChild(left);
    row.appendChild(right);
    return row;
}

UI = function (framework, canvas, settingsTable) {
    this.framework = framework;
    this.canvas = canvas;
    this.settingsTable = settingsTable;

    var self = this;
    this.canvas.onmousedown = function (e) { self.onCanvasClick(e); };
    this.canvas.oncontextmenu = function (e) { e.preventDefault(); e.stopPropagation(); };
}

UI.prototype.findElementAt = function (x, y) {
    for (var i = 0; i < this.messageElements.length; ++i) {
        if (this.messageElements[i].isMouseIn(x, y)) {
            return this.messageElements[i];
        }
    }

    for (var i = 0; i < this.nodeElements.length; ++i) {
        if (this.nodeElements[i].isMouseIn(x, y)) {
            return this.nodeElements[i];
        }
    }

    for (var i = 0; i < this.connectionElements.length; ++i) {
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
            this.updateSettingsTable(this);
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

UI.prototype.updateSettingsTable = function (obj) {
    var settings = obj.getSettings();
    this.settingsTable.innerHTML = "";
    //this.settingsTable.children.length = 0;

    for (var i = 0; i < settings.length; ++i) {
        var row = settings[i].generateRow();
        this.settingsTable.appendChild(row);
    }
}

UI.prototype.getSettings = function () {
    var self = this;
    return [
        new InputRow("Node count", this.framework, "nodeCount", 2, 100, true),
        new ButtonRow("Restart", function () {
            self.framework.reset();
            self.generateSettledElements();
        })];
}
