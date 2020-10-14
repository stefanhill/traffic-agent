function negotiation_agent(options) {

    // chair: 1; proposer: 2

    this.chair = options.chair;
    this.chairNode = options.chairNode;
    this.proposer = options.proposer;
    this.proposerNode = options.proposerNode;

    this.v = 0;
    this.nb1 = options.nb1;
    this.nb2 = options.nb2;
    this.nbDiffH = 0;

    this.v1 = 0;
    this.v1ok = false;

    this.v2 = 0;
    this.v2ok = false;

    this.waitLock = false;

    this.act = {
        init: function () {
            let self = this;
            self.nbDiffH = Math.abs(self.nb1 - self.nb2) / 2;
        },
        askV1: function () {
            let self = this;
            self.waitLock = true;
            send(self.chair, 'ASK_VALUE', [me(), self.nbDiffH, 'chair']);
        },
        waitAskV1: function () {
            sleep(1);
        },
        moveToVoteV1: function () {
            let self = this;
            if (DIR.PATH(self.proposerNode)) {
                moveto(DIR.PATH(self.proposerNode));
            }
            else {
                send(self.chair, 'NOT_IN_RANGE', []);
                kill();
            }
        },
        voteV1: function () {
            let self = this;
            self.waitLock = true;
            send(self.proposer, 'VOTE_VALUE', [me(), self.v1, 'proposer']);
        },
        waitVoteV1: function () {
            sleep(1);
        },
        askV2: function () {
            let self = this;
            self.waitLock = true;
            send(self.proposer, 'ASK_VALUE', [me(), self.nbDiffH, 'proposer']);
        },
        waitAskV2: function () {
            sleep(1);
        },
        moveToVoteV2: function () {
            let self = this;
            moveto(DIR.PATH(self.chairNode));
        },
        voteV2: function () {
            let self = this;
            self.waitLock = true;
            send(self.chair, 'VOTE_VALUE', [me(), self.v2, 'chair']);
        },
        waitVoteV2: function () {
            sleep(1);
        },
        calculateResult: function () {
            let self = this;
            if (self.v1ok) {
                self.v = self.v1;
            }
            else if (self.v2ok) {
                self.v = self.v2;
            }
            else {
                self.v = (self.v1 + self.v2) / 2;
            }
            send(self.chair, 'NEGOTIATION_RESULT', [self.v, self.proposer, self.proposerNode]);
        },
        fini: function () {
            kill();
        },
    };

    this.trans = {
        init: askV1,
        askV1: waitAskV1,
        waitAskV1: function () {
            return this.waitLock ? waitAskV1 : moveToVoteV1;
        },
        moveToVoteV1: voteV1,
        voteV1: waitVoteV1,
        waitVoteV1: function () {
            return this.waitLock ? waitVoteV1 : askV2;
        },
        askV2: waitAskV2,
        waitAskV2: function () {
            return this.waitLock ? waitAskV2 : moveToVoteV2;
        },
        moveToVoteV2: voteV2,
        voteV2: waitVoteV2,
        waitVoteV2: function () {
            return this.waitLock ? waitVoteV2 : calculateResult;
        },
        calculateResult: fini,
    };

    this.on = {
        'REPORT_VALUE': function (args) {
            let self = this;
            if (args[0] === self.chair) {
                self.v1 = args[1];
            } else {
                self.v2 = args[1];
            }
            self.waitLock = false;
        },
        'REPORT_VOTE': function (args) {
            let self = this;
            if (args[0] === self.chair) {
                self.v2ok = args[1];
            } else {
                self.v1ok = args[1];
            }
            self.waitLock = false;
        }
    };

    this.next = 'init';

}