function kp_agent(options) {

    this.intersection = null;
    this.intersectionNode = options.intersectionNode;
    this.vehicle = null;
    this.vehicleNode = options.vehicleNode;

    this.kp = null;
    this.position = null;
    this.reset = false;
    this.factorKP = 1;

    this.act = {
        init: function () {
            let self = this;
            self.intersection = myParent();
        },
        moveToVehicle: function () {
            let self = this;
            moveto(DIR.PATH(self.vehicleNode));
        },
        getVehicleID: function () {
            let self = this;
            rd(['VEHICLE', _], function (t) {
                if (t) {
                    self.vehicle = t[1];
                }
            });
        },
        getVehicleKP: function () {
            let self = this;
            send(self.vehicle, 'GETKP', [me(), self.intersectionNode]);
        },
        waitForKP: function () {
            sleep(1);
        },
        moveToIntersection: function () {
            let self = this;
            moveto(DIR.PATH(self.intersectionNode));
        },
        transmitKP: function () {
            let self = this;
            send(self.intersection, 'TRANSMITKP', [me(), self.kp, self.position, self.factorKP]);
        },
        waitForReset: function () {
            sleep(1);
        },
        moveToVehicleReset: function () {
            let self = this;
            moveto(DIR.PATH(self.vehicleNode));
        },
        resetKP: function () {
            let self = this;
            send(self.vehicle, 'SETKP', [self.kp]);
            kill();
        },
        wait: function () {
            sleep(2);
        }
    };

    this.trans = {
        init: moveToVehicle,
        moveToVehicle: getVehicleID,
        getVehicleID: getVehicleKP,
        getVehicleKP: waitForKP,
        waitForKP: function () {
            return this.kp === null ? waitForKP : moveToIntersection;
        },
        moveToIntersection: transmitKP,
        transmitKP: waitForReset,
        waitForReset: function () {
            return this.reset ? moveToVehicleReset : waitForReset;
        },
        moveToVehicleReset: resetKP,
        resetKP: wait,
        wait: wait
    };

    this.on = {
        'RETURNKP': function (args) {
            let self = this;
            self.kp = args[0];
            self.position = args[1];
            self.factorKP = args[2];
        },
        'RESETKP': function (args) {
            let self = this;
            self.kp = args[0];
            self.reset = true;
        },
        'NONEED': function (args) {
            kill();
        }
    };

    this.next = 'init';
}