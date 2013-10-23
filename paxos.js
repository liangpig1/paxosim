/// <reference path="framework.js" />

Paxos = function (node) {
    this._node = node;

    this._proposalNumber = this._firstUniqueNumber();
    this._isProposer = false;
    this._proposeTime = null;
    this._receivedPromise = 0;
    this._promisedNodes = new Array();
    this._highestPromiseNumber = this._firstUniqueNumber();
    this._highestPromiseValue = null;
    this._proposingValue = null;

    this._prepareNumber = this._firstUniqueNumber();
    this._highestAcceptedNumber = this._firstUniqueNumber();
    this._acceptedValue = null;
    
    return this;
}

Paxos.prototype.getAcceptedValue = function () {
    return this._acceptedValue;
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

    // proposal timeout
    if (this._isProposer &&
        this._node.getTime() >= this._proposeTime + this._node.paxosProposalTimeout) {
        this._onRequest();
    }
}

Paxos.prototype._firstUniqueNumber = function () {
    return -this._node.countNodes() + this._node.getId();
}

Paxos.prototype._nextUniqueNumber = function (current) {
    return current + this._node.countNodes();
}

Paxos.prototype._log = function (msg) {
    console.log("[Time:" + this._node.getTime().toString()
        + " Paxos:" + this._node.getId().toString() + "] " + msg);
}

Paxos.prototype._onRecovery = function () {
    this._log("on recovery");

    data = this._node.getStorage();
    if (data) {
        this._proposalNumber = data.savedProposalNumber;
        this._prepareNumber = data.savedPrepareNumber;
        this._highestAcceptedNumber = data.savedHighestAcceptedNumber;
        this._acceptedValue = data.savedAcceptedValue;
        this._proposeTime = data.savedProposeTime;
        this._isProposer = data.savedIsProposer;
    }
}

Paxos.prototype._onRequest = function () {
    this._log("on request");

    this._isProposer = true;
    this._proposeTime = this._node.getTime();
    this._proposalNumber = this._nextUniqueNumber(this._proposalNumber);
    this._promisedNodes = new Array();
    this._highestPromiseNumber = -1;
    this._highestPromiseValue = null;
    this._receivedPromise = 0;
    this._save();
    for (var i = 0; i < this._node.countNodes(); ++i) {
        var msg = new PaxosMessage(this._node.getId(), "prepare", this._proposalNumber);
        this._node.send(i, msg);
    }
}

Paxos.prototype._onPrepare = function (msg) {
    this._log(msg.toString());

    if (msg.detail >= this._prepareNumber) {
        var newMsg = new PaxosMessage(this._node.getId(), "promise",
            [msg.detail, this._highestAcceptedNumber, this._acceptedValue]);
        this._node.send(msg.from, newMsg);
        this._prepareNumber = msg.detail;
        this._save();
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
        this._save();
        if (this._receivedPromise >= Math.ceil((this._node.countNodes() + 1) / 2)) {
            if (this._highestPromiseValue) {
                this._proposingValue = this._highestPromiseValue;
            } else if (!this._proposingValue) {
                this._proposingValue = Math.round(Math.random() * 100);
            }
            this._save();

            var newMsg = new PaxosMessage(this._node.getId(), "accept",
                [this._proposalNumber, this._proposingValue]);
            for (var i = 0; i < this._node.countNodes(); ++i) {
                this._node.send(i, newMsg);
            }

            this._isProposer = false;
            this._proposeTime = null;
            this._promisedNodes = new Array();
            this._highestPromiseNumber = -1;
            this._highestPromiseValue = null;
            this._receivedPromise = 0;
            this._save();
        }
    }
}

Paxos.prototype._onAccept = function (msg) {
    this._log(msg.toString());

    if (msg.detail[0] >= this._prepareNumber) {
        this._acceptedValue = msg.detail[1];
        this._highestAcceptedNumber = this._acceptedValue;
        this._log("accepted value " + this._acceptedValue.toString());
    } else {
        this._log("denied value " + msg.detail[1]);
    }

    this._save();
}

Paxos.prototype._save = function () {
    var data = {
        savedProposalNumber : this._proposalNumber,
        savedPrepareNumber: this._prepareNumber,
        savedHighestAcceptedNumber: this._highestAcceptedNumber,
        savedAcceptedValue: this._acceptedValue,
        savedProposeTime: this._proposeTime,
        savedIsProposer: this._isProposer,
    };
    this._node.setStorage(data);
}

Paxos.prototype.getState = function () {
    return "stub";
}

PaxosMessage = function (from, type, detail) {
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
