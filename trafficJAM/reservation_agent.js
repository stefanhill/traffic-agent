function reservation_agent(options) {

    this.vehicle = null;
    this.vehicleNode = null;
    this.intersection = null;
    this.intersectionNode = options.linkNode;

    this.fromDir = options.from;
    this.toDir = options.to;
    this.distance = options.distance;
    this.size = options.size;

    // reservation system
    this.requestState = null;
    this.reservationMode = options.mode;

    this.act = {
        init: function () {
            let self = this;
            self.vehicle = myParent();
            self.vehicleNode = myNode();
        },
        moveToIntersection: function () {
            let self = this;
            moveto(DIR.PATH(self.intersectionNode));
        },
        intersectionHandler: function () {
            let self = this;
            rd(['INTERSECTION', _], function (t) {
                if (t) {
                    self.intersection = t[1];
                }
            });
            if (self.reservationMode === 'REQUEST') {
                send(self.intersection, 'REQUEST', [{
                    agent: me(),
                    id: self.vehicle,
                    from: self.fromDir,
                    to: self.toDir,
                    distance: self.distance,
                    size: self.size
                }]);
            } else if (self.reservationMode === 'COMPLETED') {
                send(self.intersection, 'COMPLETED', [self.vehicle]);
                kill();
            }
        },
        moveToVehicle: function () {
            let self = this;
            moveto(DIR.PATH(self.vehicleNode));
        },
        wait: function () {
            sleep(2);
        },
        vehicleHandler: function () {
            let self = this;
            send(self.vehicle, self.requestState, []);
        },
        stopRoutine: function () {
            kill();
        }
    };

    this.trans = {
        init: moveToIntersection,
        moveToIntersection: intersectionHandler,
        intersectionHandler: wait,
        wait: function () {
            return this.requestState === null ? wait : moveToVehicle;
        },
        moveToVehicle: vehicleHandler,
        vehicleHandler: stopRoutine,
        stopRoutine: stopRoutine
    };

    this.on = {
        'CONFIRMED': function (args) {
            let self = this;
            self.requestState = 'CONFIRMED';
        },
        'REJECTED': function (args) {
            let self = this;
            self.requestState = 'REJECTED';
        }
    };

    this.next = 'init';
}