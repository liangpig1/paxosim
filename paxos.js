/// <reference path="framework.js" />

Paxos = function (node) {
    this._node = node;

    this._proposalNumber = 1;
    this._isProposer = false;
    this._receivedPromise = 0;
    this._promisedNodes = new Array();
    this._highestPromiseNumber = -1;
    this._highestPromiseValue = null;
    this._proposingValue = null;

    this._prepareNumber = -1;
    this._highestAcceptedNumber = -1;
    this._acceptedValue = null;
    
    return this;
}

Paxos.prototype._log = function (msg) {
    console.log("[Paxos:" + this._node.getId().toString() +  "] " + msg);
}

Paxos.prototype.onTick = function () {
    if (this._node.isOnRecovery()) {
        this._onRecovery();
    }

    if (this._node.isOnRequest()) {
        this._onRequest();
    }

    var msg;
    while (msg = this._node.recv()) {
        if (msg.type == "prepare") {
            this._onPrepare(msg);
        } else if (msg.type == "promise") {
            this._onPromise(msg);
        } else if (msg.type == "accept") {
            this._onAccept(msg);
        }
    }
}

Paxos.prototype._onRecovery = function () {
    this._log("on recovery");

    // TODO
}

Paxos.prototype._onRequest = function () {
    this._log("on request");

    this._isProposer = true;
    for (var i = 0; i < N; ++i) {
        var msg = new PaxosMessage(this._node.getId(), "prepare", this._number);
        this._node.send(i, msg);
    }
}

Paxos.prototype._onPrepare = function (msg) {
    this._log(msg.toString());

    if (msg.detail >= this._prepareNumber) {
        var msg = new PaxosMessage(this._node.getId(), "promise",
            [msg.detail, this._highestAcceptedNumber, this._acceptedValue]);
        this._node.send(msg.from, msg);
        this._prepareNumber = msg.detail;
    } else {
        // TODO: optimize performance
    }
}

Paxos.prototype._onPromise = function (msg) {
    this._log(msg.toString());

    if (!this._isProposer) {
        return;
    }

    if (msg.detail[0] /*number*/ == this._proposalNumber) {
        this._promisedNodes.push(msg.from);

        if (msg.detail[1] > this._highestPromiseNumber) {
            this._highestPromiseNumber = msg.detail[1];
            this._highestPromiseValue = msg.detail[2];
        }

        ++this._receivedPromise;
        if (this._receivedPromise >= Math.ceil(N / 2)) {
            if (this._highestPromiseValue) {
                this._proposingValue = this._highestPromiseValue;
            } else {
                this._proposingValue = Math.round(Math.random() * 100);
            }

            var msg = new PaxosMessage(this._node.getId(), "accept",
                [this._proposalNumber, this._proposingValue]);

            this._isProposer = false;
            this._promisedNodes = new Array();
            this._highestPromiseNumber = -1;
            this._highestPromiseValue = null;
            this._receivedPromise = 0;
        }
    }
}

Paxos.prototype._onAccept = function (msg) {
    this._log(msg.toString());

    if (msg.detail[0] >= this._prepareNumber) {
        this._acceptedValue = msg.detail[1];
        this._highestAcceptedNumber = this._acceptedValue;
    }
}

PaxosMessage = function (from, type, detail)
{
    this.from = from;
    this.type = type;
    this.detail = detail;
    return this;
}

PaxosMessage.prototype.toString = function () {
    var result = this.from + ":" + this.type + "(";
    if (this.detail.constructor == Number) {
        result += this.detail;
    } else if (this.detail.constructor == Array) {
        for (var i = 0; i < this.detail.length; ++i) {
            if (i != 0) {
                result += ", ";
            }
            result += this.detail[i];
        }
    } else {
        result += this.detail.toString();
    }
    return result + ")";
}
