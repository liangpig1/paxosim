Node = function (id, framework) {
    this._id = id;
    this._framework = framework;
    this._dead = true;
    this._needToPropose = false;
    this._needToRecover = true;
    this._recvBuffer = [];
    this._storage = null;

    this.failRate = 0;
    this.averageFailTime = 10;
    this._recoverTime = 0;
}

Node.prototype.getId = function () {
    return this._id;
}

Node.prototype._log = function (msg) {
    console.log("[Time:" + this.getTime().toString()
        + " Node:" + this._id.toString() + "] " + msg);
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
    if (!this._dead) {
        this._recvBuffer.push(msg);
    }
}

Node.prototype.tick = function () {
    if (this._dead) {
        if (this.getTime() >= this._recoverTime) {
            this._log("recovered");
            this._needToRecover = true;
            this._dead = false;
            this.paxos = new Paxos(this);
        }
    }

    if (!this._dead) {
        this.paxos.onTick();
        this._needToRecover = false;
        this._needToPropose = false;

        if (Math.random() < this.failRate / this.averageFailTime) {
            this._log("failed");
            this._dead = true;
            this._recoverTime = this.getTime()
                + Math.round(Math.random() * this.averageFailTime * 2);
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
    return this._framework.time;
}

Node.prototype.isOnRecovery = function () {
    return this._needToRecover;
}

Node.prototype.isOnRequest = function () {
    return this._needToPropose;
}

Framework = function() {
    this.nodes = [];
    this.time = 0;

    this.fromMessage = [];
    this.toMessage = new MinHeap(null,
        function (a, b) {
            return a.recvTime < b.recvTime ? -1 : (
                a.recvTime == b.recvTime ? 0 : 1);
        });
}

Framework.prototype.initialize = function () {
    for (var i = 0; i < N; ++i) {
        this.createNode({});
    }

    this.graph = [];
    console.log("node count", this.nodes.length);
    for (i = 0; i < this.nodes.length; i++) {
        this.graph.push([]);
        for (j = 0; j < this.nodes.length; j++) {
            this.graph[i].push(new Connection(i, j, 10));
        }
    }
}

Framework.prototype.createNode = function(conf) {
    node = new Node(this.nodes.length, this);
    this.nodes.push(node);
}

Framework.prototype.sendMessage = function (from, to, data) {
    var conn = this.graph[from][to];
    var recvTime = this.time + conn.minTime +
        Math.round(Math.random() * (conn.maxTime - conn.minTime));

    var msg = new Message(from, to, this.time, recvTime, data);
    this.toMessage.push(msg);
}

Framework.prototype.run = function() {
    i = 0;
    while (this.time < 500) {
        // assert current time always <= recvTime of any message
        while (this.toMessage.size() && 
            this.toMessage.getMin().recvTime == this.time) {
            var msg = this.toMessage.pop();
            this.nodes[msg.to].deliverMessage(msg);
        }

        for (j = 0; j < this.nodes.length; j++) {
            this.nodes[j].tick();
        }
        ++this.time;
    }
}

Connection = function(from, to, time) {
    this.from = from;
    this.to = to;
    this.dupRate = 0;
    this.lossRate = 0;
    this.minTime = 5;
    this.maxTime = 15;
}

Message = function(from, to, sendTime, recvTime, data) {
    this.sendTime = sendTime;
    this.recvTime = recvTime;
    this.from = from;
    this.to = to;
    this.data = data;
}
