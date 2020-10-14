function remote_control(options) {

    this.path = options.path;
    this.mTravelTime = options.time;
    this.token = null;
    this.simNode = null;
    this.chatNode = null;
    this.errLog = [];

    this.stdWaitForInput = 100000;

    this.act = {
        init: function () {
            let self = this;
            self.simNode = self.path[0];
            self.chatNode = self.path[self.path.length - 1];
        },
        moveToChatNode: function () {
            let self = this;
            if (myNode() !== self.chatNode) {
                moveto(DIR.NODE(self.path[self.path.indexOf(myNode()) + 1]))
            }
        },
        actionControlChatNode: function () {
            let self = this;
            while (self.errLog.length > 0) {
                out(['MESSAGE', me(), self.errLog.shift()]);
            }
        },
        initChatNode: function () {
            let self = this,
                q = 'Would you like to control the simulation?';
            out(['QUESTION', me(), q, {choices: ['Yes', 'No']}]);
            inp.try(self.stdWaitForInput, ['ANSWER', me(), q, _], function (t) {
                if (t[3] === 'Yes') {
                    self.nextAction = 'askForToken';
                } else {
                    self.nextAction = 'fini';
                    out(['MESSAGE', me(), 'Ok, I will leave the app.']);
                }
            });
        },
        askForToken: function () {
            let self = this,
                q = 'Please enter the token:';
            out(['QUESTION', me(), q, {type: 'text'}]);
            inp.try(self.stdWaitForInput, ['ANSWER', me(), q, _], function (t) {
                if (t) {
                    self.nextAction = 'validateToken';
                    self.token = t[3];
                }
            });
        },
        mainMenu: function () {
            out(['MESSAGE', me(), 'You are connected.']);
            kill();
            // TODO: main menu
        },
        moveToSimNode: function () {
            let self = this;
            if (myNode() !== self.simNode) {
                moveto(DIR.NODE(self.path[self.path.indexOf(myNode()) - 1]))
            }
        },
        actionControlSimNode: function () {
        },
        validateToken: function () {
            let self = this;
            self.nextAction = 'waitForValidation';
            send(myParent(), 'VALIDATE_TOKEN', [me(), self.token]);
        },
        wait: function () {
            sleep(10);
        },
        fini: function () {
            kill();
        }
    };

    this.trans = {
        init: moveToChatNode,
        moveToChatNode: function () {
            return myNode() !== this.chatNode ? moveToChatNode : actionControlChatNode;
        },
        actionControlChatNode: function () {
            switch (this.nextAction) {
                case "initChatNode":
                    return initChatNode;
                case "askForToken":
                    return askForToken;
                case "validateToken":
                    return moveToSimNode;
                case "fini":
                    return fini;
                case "mainMenu":
                    return mainMenu;
            }
        },
        initChatNode: actionControlChatNode,
        askForToken: actionControlChatNode,
        mainMenu: actionControlChatNode,
        moveToSimNode: function () {
            return myNode() !== this.simNode ? moveToSimNode : actionControlSimNode;
        },
        actionControlSimNode: function () {
            switch (this.nextAction) {
                case "initChatNode":
                    return moveToChatNode;
                case "validateToken":
                    return validateToken;
                case "askForToken":
                    return moveToChatNode;
                case "fini":
                    return fini;
                case "mainMenu":
                    return moveToChatNode;
                case "waitForValidation":
                    return wait;
            }
        },
        validateToken: wait,
        wait: function () {
            return myNode() === this.simNode ?
                actionControlSimNode :
                (myNode() === this.chatNode ? actionControlChatNode : wait)
        },
        fini: fini
    };

    this.on = {
        'ACCEPT_TOKEN': function (args) {
            let self = this;
            self.nextAction = 'mainMenu';
        },
        'DENY_TOKEN': function (args) {
            let self = this;
            self.nextAction = 'askForToken';
            self.errLog.push('Token not accepted.')
        }
    };

    this.next = 'init';
    this.nextAction = 'initChatNode';

}