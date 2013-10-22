Node = function (id, context) {
	this.id = id;
	this.ctx = context;
	this.die = true;
	this.needToPropose = false;
	this.needToRecover = true; /* Yuetao modified */
	this.recvBuffer = [];
}

Node.prototype.getId = function () {
	return this.id;
}

Node.prototype.send = function (id, msg) {
	console.log("Message {" + msg + "} sent to node[" + id.toString() + "] at time(" + this.getTime().toString() + ")");
	this.ctx.fromMessage.push(new Message(this.id, id, this.getTime(), msg));
}

Node.prototype.recv = function () {
	if (this.recvBuffer.length) {
		return (this.recvBuffer.splice(0,1))[0];
	} else {
		return null;
	}
}

Node.prototype.tick = function () {
	if (this.needToRecover) {
		console.log("node[" + this.id + "] is restarted");
		this.needToRecover = false;

	    // Yuetao's modification: begin
		this.paxos = new Paxos(this);
		/*if (this.id == 0) {
		    this.send(1, "0");
		}*/
	    // Yuetao's modification: end
	}

    // Yuetao's modification: begin
	this.paxos.onTick();
	/*msg = this.recv();
	if (msg) {
		console.log("Message{" + msg.data.toString() + "} recved from node[" + msg.from.toString() + "] at time(" + msg.recvTime.toString() + ")");
		this.send(msg.from, (parseInt(msg.data) + 1).toString());
	}*/
    // Yuetao's modification: end
}

Node.prototype.getStorage = function () {
}

Node.prototype.setStorage = function (data) {
}

Node.prototype.getTime = function () {
	return this.ctx.time;
}

Node.prototype.isOnRecovery = function () {
	return this.needToRecover;
}

Node.prototype.isOnRequest = function () {
	return this.needToPropose;
}

Node.prototype.dump = function() {
	console.log(this.id);
}

Framework = function() {
	this.nodeId = 0;
	this.nodes = [];
	this.time = 0;

	this.fromMessage = [];
	this.toMessage = new MinHeap(null, function(a, b){return a.recvTime < b.recvTime});
}

Framework.prototype.initialize = function () {
    // Yuetao's modification:begin
	/*this.createNode({});
	this.createNode({});*/

    for (var i = 0; i < N; ++i) {
        this.createNode({});
    }
    // Yuetao's modification: end

	this.graph = [];
	console.log("node count", this.nodeId);
	for (i = 0; i < this.nodeId; i++) {
		this.graph.push([]);
		for (j = 0; j < this.nodeId; j++) {
			if (i != j) {
				this.graph[i].push(new Connection(i, j, 10));
			} else {
				this.graph[i].push(null);
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
	while (this.time < 100) {
		//move FromMessage to ToMessage
		while (this.fromMessage.length) {
			msg = this.fromMessage.pop();
			msg.recvTime = this.graph[msg.from][msg.to].time + msg.sendTime;
			this.toMessage.push(msg);
		}
		// assert current time always <= recvTime of any message
		while (this.toMessage.size() && 
			this.toMessage.heap[0].recvTime == this.time) {
			msg = this.toMessage.pop();
			this.nodes[msg.to].recvBuffer.push(msg);
		}

		for (j = 0; j < this.nodeId; j++) {
			if (this.nodes[j].die) {
				this.nodes[j].needToRecover = true;
				this.nodes[j].die = false;
			}
			this.nodes[j].tick();
		}
		++this.time;
	}
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
	this.sendTime = sendTime;
	this.recvTime = null; //need to be set by framework
	this.from = from;
	this.to = to;
	this.data = data;
}
