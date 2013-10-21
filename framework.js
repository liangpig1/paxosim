Node = function (id, context) {
	this.id = id;
	this.ctx = context;
	this.needToPropose = false;
}

Node.prototype.getId = function () {
	return this.id;
}

Node.prototype.send = function (id, msg) {
}

Node.prototype.recv = function () {
}

Node.prototype.tick = function () {
	this.needToPropose = false;
}

Node.prototype.getStorage = function () {
}

Node.prototype.setStorage = function (data) {
}

Node.prototype.getTime = function () {
	return ctx.time;
}

Node.prototype.isOnRecovery = function () {
}

Node.prototype.isOnRequest = function () {
	this.needToPropose = true;
}

Node.prototype.dump = function() {
	console.log(this.id);
}

Framework = function() {
	this.nodeId = 0;
	this.nodes = [];
	this.time = 0;
	
}

Framework.prototype.initialize = function() {
	this.createNode({});
	for (i = 0; i < this.nodeId; i++) {
		this.nodes[i].dump();
	}
}

Framework.prototype.createNode = function(conf) {
	node = new Node(this.nodeId++, this);
	this.nodes.push(node);
}

Framework.prototype.run = function() {
	i = 0;
	while (i < 1000) {
		for (j = 0; j < this.nodeId; j++) {
			this.nodes[j].tick();
		}
		++this.time;
	}
}

Framework.prototype.getNodeCount = function() {
	return this.nodeId;
}

Connection = function() {
	messages = new MinHeap();
}
