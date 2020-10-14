function agent_control(options) {

    this.target = options.target;
    this.targetNode = options.targetNode;

    this.message = options.message;
    this.params = options.params;

    this.act = {
        init: function () {
        },
        moveToTarget: function () {
            let self = this;
            moveto(DIR.PATH(self.targetNode));
            sleep(20);
        },
        transmitMessage: function () {
            let self = this;
            send(self.target, self.message, self.params);
        },
        fini: function () {
            kill();
        },
    };

    this.trans = {
        init: moveToTarget,
        moveToTarget: transmitMessage,
        transmitMessage: fini,
    };

    this.on = {};

    this.next = 'init';

}