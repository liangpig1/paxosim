﻿Node = function (id, context) {
	this.id = id;
	this.die = true;
	this.ctx = context;
	this.needToPropose = false;
	this.recvBuffer = [];
}

Node.prototype.getId = function () {
	return this.id;
}

Node.prototype.send = function (id, msg) {
	this.ctx.fromMessage.push(new Message(this.id, id, this.getTime(), msg));
}

Node.prototype.recv = function () {
	if (this.recvBuffer.length) {
		return (this.recvBuffer.splice(0,1))[0];
	} else {
		return NULL;
	}
}

Node.prototype.tick = function () {
	this.needToPropose = false;
}

Node.prototype.getStorage = function () {
}

Node.prototype.setStorage = function (data) {
}

Node.prototype.getTime = function () {
	return this.ctx.time;
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
	this.graph = [];
	for (i = 0; i < this.nodeId; i++) {
		this.graph.push([]);
		for (j = 0; j < this.nodeId; j++) {
			if (i != j) {
				this.graph[i].push(new Connection(i, j, 10));
			}
		}
	}
}

Framework.prototype.createNode = function(conf) {
	node = new Node(this.nodeId++, this);
	this.nodes.push(node);
}

Framework.prototype.run = function() {
	i = 0;
	while (i < 1000) {
		//move FromMessage to ToMessage
		while (fromMessage.length) {
			msg = fromMessage.pop();
			msg.recvTime = graph[msg.from][msg.to].time + msg.fromTime;
			toMessage.push(msg);
		}
		// assert current time always <= recvTime of any message
		while (toMessage.size() && 
			toMessage.heap[0].recvTime == time) {
			msg = toMessage.pop();
			this.nodes[msg.to].recvBuffer.push(msg);
		}

		for (j = 0; j < this.nodeId; j++) {
			if (this.nodes[j].die) {
				this.nodes[j].onRecovery();
				this.nodes[j].die = false;
			} else {
				this.nodes[j].tick();
			}
		}
		++this.time;
	}
	fromMessage = [];
	toMessage = new MinHeap();
}

Framework.prototype.getNodeCount = function() {
	return this.nodeId;
}

Connection = function(from, to, time) {
	this.from = from;
	this.to = to;
	this.time = time;
}

Message = function(from, to, sendTime, data) {
	this.sendTime = sendTime
	this.recvTime = null; //need to be set by framework
	this.from = from;
	this.to = to;
	this.data = data;
}
