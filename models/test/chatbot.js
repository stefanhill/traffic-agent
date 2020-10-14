function chatbot() {

    this.path = ['wazuxuti', 'kavicewa', 'zuqocaxe'];

    this.name = 'NSA';
    this.stdWaitTime = 20000;

    this.t = {
        initChat: 'Hallo, möchtest du ein paar Fragen beantworten?',
        askName: 'Wie heißt du?',
        askAge: 'Wie alt bist du?',
        askGender: 'Für welches Geschlecht hältst du dich?',
        askHappiness: 'Wie gut bist du heute drauf?',
        thanks: 'Danke für die Teilnahme an der Umfrage.',
        askAmazon: 'Willst du noch einen Amazon-Gutschein gewinnen?'
    };

    this.results = {
        name: null,
        age: null,
        gender: null,
        happiness: null
    };

    this.act = {
        init: function () {
            let self = this;
            self.t1 = clock(true);
        },
        stateSwitch: function () {

        },
        moveToTarget: function () {
            let self = this;
            if (myNode() !== self.path[self.path.length - 1]) {
                moveto(DIR.NODE(self.path[self.path.indexOf(myNode()) + 1]));
            }
        },
        initChat: function () {
            let self = this;
            out(['MESSAGE', self.name, self.t.initChat]);
            self.state = 'askName';
        },
        askName: function () {
            let self = this;
            out(['QUESTION', self.name, self.t.askName, {type: 'text'}]);
            inp.try(self.stdWaitTime, ['ANSWER', self.name, self.t.askName, _], function (t) {
                if (t) {
                    self.results.name = t[3];
                } else {
                    self.results.name = 'None';
                }
            });
            self.state = 'askAge';
        },
        askAge: function () {
            let self = this;
            out(['QUESTION', self.name, self.t.askAge, {type: 'number'}]);
            inp.try(self.stdWaitTime, ['ANSWER', self.name, self.t.askAge, _], function (t) {
                if (t) {
                    self.results.age = t[3];
                } else {
                    self.results.name = 'None';
                }
            });
            self.state = 'askGender';
        },
        askGender: function () {
            let self = this;
            out(['QUESTION', self.name, self.t.askGender, {choices: ['männlich', 'weiblich', 'divers']}]);
            inp.try(self.stdWaitTime, ['ANSWER', self.name, self.t.askGender, _], function (t) {
                if (t) {
                    self.results.gender = t[3];
                } else {
                    self.results.gender = 'None';
                }
            });
            self.state = 'askHappiness';
        },
        askHappiness: function () {
            let self = this;
            out(['QUESTION', self.name, self.t.askHappiness, {choices: ['gut', 'miese', 'joa ne']}]);
            inp.try(self.stdWaitTime, ['ANSWER', self.name, self.t.askHappiness, _], function (t) {
                if (t) {
                    self.results.happiness = t[3];
                } else {
                    self.results.happiness = 'None';
                }
            });
            self.state = 'thanks';
        },
        thanks: function () {
            let self = this;
            out(['MESSAGE', self.name, self.t.thanks]);
            self.state = 'askAmazon';
        },
        askAmazon: function () {
            let self = this;
            out(['QUESTION', self.name, self.t.askAmazon, {choices: ['ja', 'nein']}]);
            inp.try(self.stdWaitTime, ['ANSWER', self.name, self.t.askAmazon, _], function (t) {
                if (t[3] === 'ja') {
                    out(['MESSAGE', self.name, 'Tja, dumm gelaufen. Hier gibt es keine Gutscheine für böse Monopol-Onlineversandhäuser.']);
                } else {
                    out(['MESSAGE', self.name, 'Gute Wahl, Amazon ist ein unverantwortlicher nicht sozial verträglicher Arbeitgeber.']);
                }
            });
            self.state = 'evaluate';
        },
        moveToMe: function () {
            let self = this;
            if (myNode() !== self.path[0]) {
                moveto(DIR.NODE(self.path[self.path.indexOf(myNode()) - 1]));
            }
        },
        logData: function () {
            let self = this;

        },
        fini: function () {
            kill();
        }
    };

    this.trans = {
        init: moveToTarget,
        moveToTarget: function () {
            return myNode() !== this.path[this.path.length - 1] ? moveToTarget : stateSwitch;
        },
        stateSwitch: function () {
            switch (this.state) {
                case "initChat":
                    return initChat;
                case "askName":
                    return askName;
                case "askAge":
                    return askAge;
                case "askGender":
                    return askGender;
                case "askHappiness":
                    return askHappiness;
                case "thanks":
                    return thanks;
                case "askAmazon":
                    return askAmazon;
                case "evaluate":
                    return moveToMe;
            }
        },
        initChat: stateSwitch,
        askName: stateSwitch,
        askAge: stateSwitch,
        askGender: stateSwitch,
        askHappiness: stateSwitch,
        thanks: stateSwitch,
        askAmazon: moveToMe,
        moveToMe: function () {
            return myNode() !== this.path[0] ? moveToMe : logData;
        },
        logData: fini,
        fini: fini
    };

    this.next = 'init';
    this.state = 'initChat';

}