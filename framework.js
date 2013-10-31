Node = function (id, framework) {
    this._id = id;
    this._framework = framework;
    this._dead = true;
    this._needToPropose = false;
    this._needToRecover = true;
    this._recvBuffer = [];
    this._storage = null;

    this.paxos = new Paxos(this);
    this.paxosProposalTimeout = 50;
    this.paxosListenTimeout = 1000;
    this.failRate = 0;
    this.averageFailTime = 10;
    this._recoverTime = 0;
}

Node.prototype.getId = function () {
    return this._id;
}

Node.prototype.countNodes = function () {
    return this._framework.countNodes();
}

Node.prototype._log = function (msg) {
    /*console.log("[Time:" + this.getTime().toString()
        + " Node:" + this._id.toString() + "] " + msg);*/
}

Node.prototype.send = function (id, msg) {
    this._log("send " + msg + " to node:" + id.toString());
    this._framework.sendMessage(this._id, id, msg);
}

Node.prototype.recv = function () {
    if (this._recvBuffer.length) {
        return (this._recvBuffer.splice(0, 1))[0].data;
    } else {
        return null;
    }
}

Node.prototype.deliverMessage = function (msg) {
    if (!this._dead && !msg.dropped) {
        this._recvBuffer.push(msg);
    }
}

Node.prototype.tick = function () {
    if (this._dead && this.getTime() >= this._recoverTime) {
        this.reverseState();
    }

    if (!this._dead) {
        this.paxos.onTick();
        this._needToRecover = false;
        this._needToPropose = false;

        if (Math.random() < 1 / (this.averageFailTime * (1 / this.failRate - 1))) {
            this.reverseState();
        }
    }
}

Node.prototype.getStorage = function () {
    return this._storage;
}

Node.prototype.setStorage = function (data) {
    this._storage = data;
}

Node.prototype.getTime = function () {
    return this._framework.getTime();
}

Node.prototype.isOnRecovery = function () {
    return this._needToRecover;
}

Node.prototype.isOnRequest = function () {
    return this._needToPropose;
}

Node.prototype.request = function () {
    this._needToPropose = true;
}

Node.prototype.reverseState = function () {
    if (this._dead) {
        this._log("recovered");
        this._dead = false;
        this._needToRecover = true;
        this.paxos = new Paxos(this);

    } else {
        this._log("failed");
        this._dead = true;
        this._recoverTime = this.getTime()
            + Math.round(Math.random() * this.averageFailTime * 2);
    }
}

Node.prototype.isWorking = function () {
    return !this._dead;
}

Node.prototype.getSettings = function () {
    var self = this;
    return [
        new InfoRow("Node id", this, "_id"),
        new InputRow("Fail Rate", this, "failRate", 0, 1, false),
        new ButtonRow("Propose", function () { self.request(); }),
    ];
}

Framework = function (
    nodeCount,
    nodeFailRate,
    nodeAverageFailTime,
    paxosProposalTimeout,
    paxosListenTimeout,
    connectionDupRate,
    connectionLossRate,
    connectionMinTime,
    connectionMaxTime) {

    this.nodeCount = nodeCount;
    this.nodeFailRate = nodeFailRate;
    this.nodeAverageFailTime = nodeAverageFailTime;
    this.paxosProposalTimeout = paxosProposalTimeout;
    this.paxosListenTimeout = paxosListenTimeout;
    this.connectionDupRate = connectionDupRate;
    this.connectionLossRate = connectionLossRate;
    this.connectionMinTime = connectionMinTime;
    this.connectionMaxTime = connectionMaxTime;

    this.reset();
}

Framework.prototype.countNodes = function () {
    return this._nodes.length;
}

Framework.prototype.getNodes = function () {
    return this._nodes;
}

Framework.prototype.getGraph = function () {
    return this._graph;
}

Framework.prototype.getMessages = function () {
    return this._toMessage.heap;
}

Framework.prototype.getTime = function () {
    return this._time;
}

Framework.prototype.reset = function () {
    this._time = 0;

    this._nodes = [];
    for (var i = 0; i < this.nodeCount; ++i) {
        node = new Node(this._nodes.length, this);
        this._nodes.push(node);
    }
    this.setNodeFailures();

    this._graph = [];
    for (i = 0; i < this.nodeCount; ++i) {
        this._graph.push([]);
        for (j = 0; j < this.nodeCount; ++j) {
            var conn = new Connection(i, j);
            this._graph[i].push(conn);
        }
    }
    this.setConnectionFailures();

    this._toMessage = new MinHeap(null,
        function (a, b) {
            return a.recvTime < b.recvTime ? -1 : (
                a.recvTime == b.recvTime ? 0 : 1);
        });
}

Framework.prototype.setNodeFailures = function () {
    for (var i = 0; i < this._nodes.length; ++i) {
        node = this._nodes[i];
        node.failRate = this.nodeFailRate;
        node.averageFailTime = this.nodeAverageFailTime;
        node.paxosProposalTimeout = this.paxosProposalTimeout;
        node.paxosListenTimeout = this.paxosListenTimeout;
    }
}

Framework.prototype.setConnectionFailures = function () {
    for (i = 0; i < this._nodes.length; ++i) {
        for (j = 0; j < this._nodes.length; ++j) {
            var conn = this._graph[i][j];

            if (i != j) {
                conn.dupRate = this.connectionDupRate;
                conn.lossRate = this.connectionLossRate;
                conn.minTime = this.connectionMinTime;
                conn.maxTime = this.connectionMaxTime;
            } else {
                conn.dupRate = conn.lossRate = 0;
                conn.minTime = conn.maxTime = 1;
            }
        }
    }
}

Framework.prototype.sendMessage = function (from, to, data) {
    var conn = this._graph[from][to];
    if (!conn.isWorking()) {
        return;
    }

    if (Math.random() < conn.dupRate) {
        this.sendMessage(from, to, data);
    }
    if (Math.random() < conn.lossRate) {
        return;
    }

    var recvTime = this._time + conn.minTime +
        Math.round(Math.random() * (conn.maxTime - conn.minTime));

    var msg = new Message(from, to, this._time, recvTime, data);
    this._toMessage.push(msg);
}

Framework.prototype.tick = function () {
    while (this._toMessage.size() &&
            this._toMessage.getMin().recvTime == this._time) {
        var msg = this._toMessage.pop();
        this._nodes[msg.to].deliverMessage(msg);
    }

    for (j = 0; j < this._nodes.length; j++) {
        this._nodes[j].tick();
    }
    ++this._time;
}

Framework.prototype.run = function () {
    i = 0;
    while (this._time < 500) {
        this.tick();
    }
}

Connection = function (from, to) {
    this.from = from;
    this.to = to;
    this.dupRate = 0.2;
    this.lossRate = 0.2;
    this.minTime = 5;
    this.maxTime = 15;
    this._dead = false;
}

Connection.prototype.isWorking = function () {
    return !this._dead;
}

Connection.prototype.reverseState = function () {
    this._dead = !this._dead;
}

Message = function (from, to, sendTime, recvTime, data) {
    this.sendTime = sendTime;
    this.recvTime = recvTime;
    this.from = from;
    this.to = to;
    this.data = data;
    this.dropped = false;
}
