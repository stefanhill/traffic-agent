function remote_control(options) {

    this.path = options.path;
    this.mTravelTime = options.time;
    this.token = null;
    this.simNode = null;
    this.chatNode = null;
    this.errLog = [];

    this.twin = {
        sFactor: 1,
        dFactor: 1
    };

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
                q = 'Would you like to control the simulation?',
                c = ['Yes', 'No'],
                a = ['askForToken', 'fini'];
            out(['QUESTION', me(), q, {choices: c}]);
            inp.try(self.stdWaitForInput, ['ANSWER', me(), q, _], function (t) {
                self.nextAction = a[c.indexOf(t[3])];
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
        menuMain: function () {
            let self = this,
                q = 'What do you want to do?',
                c = [/*'Control buses', */'Do survey'],
                a = [/*'menuBuses', */'menuTwin'];
            out(['QUESTION', me(), q, {choices: c}]);
            inp.try(self.stdWaitForInput * 20, ['ANSWER', me(), q, _], function (t) {
                self.nextAction = a[c.indexOf(t[3])];
            });
            // TODO: implement other choices
        },
        menuBuses: function () {
            let self = this,
                q = 'What do want to do?',
                c = ['Add Bus', 'Remove Bus', 'Main Menu'],
                a = ['addBus', 'removeBus', 'menuMain'];
            out(['QUESTION', me(), q, {choices: c}]);
            inp.try(self.stdWaitForInput, ['ANSWER', me(), q, _], function (t) {
                self.nextAction = a[c.indexOf(t[3])];
            });
        },
        menuTwin: function () {
            let self = this,
                q = 'What is your gender?',
                c = ['male', 'female', 'something else'];
            out(['QUESTION', me(), q, {choices: c}]);
            inp.try(self.stdWaitForInput, ['ANSWER', me(), q, _], function (t) {
                if (t[3]) {
                    switch (t[3]) {
                        case 'male':
                            self.twin.sFactor = self.twin.sFactor * 1.1;
                            break;
                        case 'female':
                            self.twin.sFactor = self.twin.sFactor * 0.9;
                            break;
                    }
                    let q = 'How old are you?',
                        c = ['younger than 25', '25 - 65', 'older than 25'];
                    out(['QUESTION', me(), q, {choices: c}]);
                    inp.try(self.stdWaitForInput, ['ANSWER', me(), q, _], function (t) {
                        if (t[3]) {
                            switch (t[3]) {
                                case 'younger than 25':
                                    self.twin.dFactor = self.twin.dFactor * 1.1;
                                    self.twin.sFactor = self.twin.sFactor * 1.1;
                                    break;
                                case 'older than 25':
                                    self.twin.sFactor = self.twin.sFactor * 0.8;
                                    break;
                            }
                            let q = 'Do you have children?',
                                c = ['yes', 'no'];
                            out(['QUESTION', me(), q, {choices: c}]);
                            inp.try(self.stdWaitForInput, ['ANSWER', me(), q, _], function (t) {
                                if (t[3]) {
                                    if (t[3] === 'yes') {
                                        self.twin.sFactor = self.twin.sFactor * 0.8;
                                        self.twin.dFactor = self.twin.dFactor * 0.9;
                                    }
                                    let q = 'How many PS does your car have?',
                                        c = ['less than 100', '100 - 200', 'more than 200'];
                                    out(['QUESTION', me(), q, {choices: c}]);
                                    inp.try(self.stdWaitForInput, ['ANSWER', me(), q, _], function (t) {
                                        if (t[3]) {
                                            switch (t[3]) {
                                                case 'less than 100':
                                                    self.twin.sFactor = self.twin.sFactor * 0.9;
                                                    break;
                                                case 'more than 100':
                                                    self.twin.sFactor = self.twin.sFactor * 1.1;
                                                    break;
                                            }
                                            self.nextAction = 'createTwin';
                                        } else {
                                            self.errLog.push('Survey timed out.');
                                            self.nextAction = 'menuMain';
                                        }
                                    });
                                } else {
                                    self.errLog.push('Survey timed out.');
                                    self.nextAction = 'menuMain';
                                }
                            });
                        } else {
                            self.errLog.push('Survey timed out.');
                            self.nextAction = 'menuMain';
                        }
                    });
                } else {
                    self.errLog.push('Survey timed out.');
                    self.nextAction = 'menuMain';
                }
            });
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
        createTwin: function () {
            let self = this;
            self.nextAction = 'waitForValidation';
            send(myParent(), 'CREATE_TWIN', [me(), self.twin]);
        },
        addBus: function () {
            let self = this;
            self.nextAction = 'waitForConfirmation';
            send(myParent(), 'ADD_BUS', [me(), 1]);
        },
        removeBus: function () {
            let self = this;
            self.nextAction = 'waitForConfirmation';
            send(myParent(), 'REMOVE_BUS', [me(), 1]);
        },
        wait: function () {
            sleep(10);
        },
        fini: function () {
            out(['MESSAGE', me(), ' Good Bye, I will leave the app.']);
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
                case "menuMain":
                    return menuMain;
                case "menuTwin":
                    return menuTwin;
                case "createTwin":
                    return moveToSimNode;
                case "menuBuses":
                    return menuBuses;
                case "addBus":
                    return moveToSimNode;
                case "removeBus":
                    return moveToSimNode;
            }
        },
        initChatNode: actionControlChatNode,
        askForToken: actionControlChatNode,
        menuMain: actionControlChatNode,
        menuBuses: actionControlChatNode,
        menuTwin: actionControlChatNode,
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
                case "menuMain":
                    return moveToChatNode;
                case "createTwin":
                    return createTwin;
                case "menuBuses":
                    return moveToChatNode;
                case "waitForConfirmation":
                    return wait;
                case "addBus":
                    return addBus;
                case "removeBus":
                    return removeBus;
            }
        },
        validateToken: wait,
        createTwin: wait,
        removeBus: wait,
        addBus: wait,
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
            self.nextAction = 'menuMain';
            self.errLog.push('Token accepted, you are connected.');
        },
        'DENY_TOKEN': function (args) {
            let self = this;
            self.nextAction = 'askForToken';
            self.errLog.push('Token not accepted.');
        },
        'ADD_BUS_CONFIRMATION': function (args) {
            let self = this;
            self.nextAction = 'menuBuses';
            self.errLog.push('Added bus successfully.');
        },
        'REMOVE_BUS_CONFIRMATION': function (args) {
            let self = this;
            self.nextAction = 'menuBuses';
            self.errLog.push('Removed bus successfully.');
        },
        'CREATE_TWIN_CONFIRMATION': function (args) {
            let self = this;
            self.nextAction = 'menuMain';
            self.errLog.push('Created twin ' + args[0]);
        }
    };

    this.next = 'init';
    this.nextAction = 'menuMain';

}