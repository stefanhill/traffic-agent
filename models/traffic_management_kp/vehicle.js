function transporter(options) {

    // global parameters
    this.model = null;
    this.parameter = null;
    this.api = null;

    // positional parameters
    this.position = null;
    this.direction = null;
    this.busStop = false;

    this.actionQueue = [];
    this.skip = false;
    this.parking = {
        state: false,
        toggle: false,
    };

    // kp system
    this.kp = 0;
    this.lastIntersection = null;

    // evaluation
    this.monitor = {
        speed: [],
        kp: []
    };
    this.eval = {
        agent: null
    };

    // behavioural parameters
    this.type = null;
    this.speed = {
        max: 3,
        allowed: 0,
        current: 0
    };
    this.params = {
        hasPassengers: false,
        maxPassengers: 5,
        numPassengers: 0
    };

    // void
    this.setColor = function () {
        let self = this;
        switch (self.type) {
            case 'bus':
                net.set('color', 'orange');
                break;
            case 'car':
                net.set('color', 'blue');
                break;
        }
    };

    // -> [int, int]
    this.getRandomStreetCoordinates = function () {
        let self = this,
            streets = net.ask('resources-street', '*'),
            s = streets[Math.floor(Math.random() * streets.length)],
            p = [Math.floor(Math.random() * s.w) + s.x, Math.floor(Math.random() * s.h) + s.y];
        if (net.ask('agents', p).length === 0) {
            return p;
        } else {
            return self.getRandomStreetCoordinates();
        }
    };

    // Patch -> [Patches] -> int -> [Patches]
    this.getPathRec = function (pos, path, limit, recSafety) {
        let self = this;
        recSafety++;
        if (path.length > recSafety) {
            return path;
        } else if (path.length > limit) {
            return path;
        } else {
            if (path.length !== 0) {
                pos = path[path.length - 1];
            }
            const nextPath = self.api.getRelVector(pos.direction, [pos.x, pos.y], [0, -1]),
                patch = net.ask('patch', [nextPath[0], nextPath[1]]);
            switch (patch.type) {
                case 'street':
                    path.push(patch);
                    break;
                case 'intersection':
                    let backwards = self.api.getRelDir(pos.direction, 'back'),
                        nd = self.api.getRandomNextIntersectionFromIntersectionID(patch.sid, backwards);
                    // deprecated
                    /*if (patch.intersectionType === 'normal') {
                        while (self.api.getRelDir(nd, 'back') === pos.direction) {
                            nd = self.api.getRandomNextIntersectionFromIntersectionID(patch.sid);
                        }
                    }*/
                    let intersection = self.parameter.intersections[patch.sid],
                        intersectionPatch = net.ask('patch', [intersection.x, intersection.y]),
                        sequence = self.api.getIntersectionPath(pos.direction, nd, intersectionPatch);
                    for (let s in sequence) {
                        let seq = sequence[s];
                        seq.type = 'intersection';
                        seq.sid = patch.sid;
                        seq.intersectionType = patch.intersectionType;
                        path.push(seq);
                    }
                    break;
            }
            return self.getPathRec(path[path.length - 1], path, limit, recSafety);
        }
    };

    this.act = {
        init: function () {
            let self = this;
            self.model = simu.model();
            self.parameter = self.model.parameter;
            self.api = self.model.api;
            self.setColor();

            // use this for random walk
            let randomPos = self.getRandomStreetCoordinates();
            net.setxy(randomPos[0], randomPos[1]);

            self.position = net.ask('patch');
            self.direction = self.position.direction;
            self.speed.allowed = self.position.speedLimit;
            self.speed.current = Math.min(self.speed.max, self.speed.allowed);

            if (self.type === 'bus') {
                self.params.hasPassengers = true;
            }

            out(['VEHICLE', me()]);
            self.eval.agent = create('evaluation_agent', {
                vehicle: me(),
                vehicleNode: myNode(),
            });
        },
        percept: function () {
            let self = this,
                view = 2 * self.speed.allowed,
                i = 1,
                speedPossible = Math.min(self.speed.max, self.speed.allowed),
                speedRecommended = speedPossible;
            self.position = net.ask('patch');
            self.speed.allowed = self.position.speedLimit;
            self.actionQueue = self.getPathRec(self.position, self.actionQueue, view, view);
            for (let e in self.actionQueue) {
                let elem = self.actionQueue[e];
                let agents = net.ask('agents', [elem.x, elem.y]);
                if (elem.type === 'intersection') {
                    let intersection = self.parameter.intersections[elem.sid],
                        intersection_managements = net.ask('agents-intersection_management', [intersection.x, intersection.y]);
                }
                if (agents.length > 0) {
                    for (let a in agents) {
                        if (agents[a].class === 'vehicle') {
                            speedRecommended = i / 2;
                        }
                    }
                    break;
                }
                i++;
            }
            self.speed.current = Math.min(speedPossible, speedRecommended);
        },
        intersectionAndStops: function () {
            let self = this,
                nextPosition = self.actionQueue[0];
            if (nextPosition.type === 'intersection' && self.position.type === 'street') {
                switch (nextPosition.intersectionType) {
                    case 'normal':
                        let tlc = self.api.getRelVector(self.direction, [self.position.x, self.position.y], [-1, 0]),
                            tl = net.ask('patch', tlc);
                        if (tl.state === 'stop') {
                            self.skip = true;
                        }
                        break;
                    case 'circuit':
                        let wc = self.api.getRelVector(self.direction, [self.position.x, self.position.y], [-1, -1]),
                            w = net.ask('agents-vehicle', wc);
                        if (w.length > 0) {
                            self.skip = true;
                        }
                }
            }
            if (self.position.type === 'intersection') {
                self.lastIntersection = self.position.intersectionPort;
            }
            if (net.ask('agents-vehicle', [nextPosition.x, nextPosition.y]).length > 0) {
                self.skip = true;
            }
            if (self.type === 'bus' && nextPosition.stationLink) {
                self.busStop = true;
                self.params.numPassengers = Math.round(Math.random() * self.params.maxPassengers);
            }
            if (Math.random() < 0.01 && self.type !== 'bus') {
                self.parking.toggle = true;
            }
        },
        initParking: function () {
            let self = this,
                parkSlotCoords = self.api.getRelVector(self.direction, [self.position.x, self.position.y], [1, 0]),
                parkSlot = net.ask('agents', parkSlotCoords);
            if (self.parking.toggle && parkSlot.length === 0 && self.position.type === 'street') {
                net.setxy(parkSlotCoords[0], parkSlotCoords[1]);
                self.parking.state = true;
                self.parking.toggle = false;
            }
        },
        parking: function () {
            let self = this;
            if (Math.random() < 0.005) {
                self.parking.toggle = true;
            }
            sleep(self.parameter.simulationSpeed);
        },
        stopParking: function () {
            let self = this,
                safetyPatchCoords = self.api.getRelVector(self.direction, [self.position.x, self.position.y], [0, -1]),
                safetyPatchAgents = net.ask('agents', safetyPatchCoords),
                streetPatchAgents = net.ask('agents', [self.position.x, self.position.y]);
            if (self.parking.toggle && safetyPatchAgents.concat(streetPatchAgents).length === 0) {
                net.setxy(self.position.x, self.position.y);
                self.parking.state = false;
                self.parking.toggle = false;
            }
        },
        drive: function () {
            let self = this;
            if (!self.skip) {
                if (self.speed.current > 0) {
                    let next = self.actionQueue.shift();
                    if (next) {
                        self.direction = next.direction;
                        net.setxy(next.x, next.y);
                    }
                }
            } else {
                self.skip = false;
            }
        },
        wait: function () {
            let self = this;
            if (self.busStop) {
                self.busStop = false;
                sleep(self.parameter.simulationSpeed * 15);
            } else if (self.speed.current !== 0) {
                sleep(Math.round(self.parameter.simulationSpeed / self.speed.current));
            }
        }
    };

    this.trans = {
        init: percept,
        percept: intersectionAndStops,
        intersectionAndStops: function () {
            return this.parking.toggle ? initParking : drive;
        },
        drive: wait,
        wait: percept,
        initParking: function () {
            return this.parking.state ? parking : drive;
        },
        parking: function () {
            return this.parking.toggle ? stopParking : parking;
        },
        stopParking: function () {
            return this.parking.state ? parking : percept;
        }

    };

    this.on = {
        'GETKP': function (args) {
            let self = this;
            if (self.lastIntersection !== args[1] && !self.parking.state) {
                let factorKP = function () {
                    return self.params.hasPassengers ? self.params.numPassengers + 1 : 1;
                };
                send(args[0], 'RETURNKP', [self.kp, self.position, factorKP()]);
            } else {
                send(args[0], 'NONEED', []);
            }
        },
        'SETKP': function (args) {
            let self = this;
            self.kp = args[0];
        },
        'GET_EVALUATION_DATA': function (args) {
            let self = this,
                p = function () {
                    return self.params.hasPassengers ? self.params.numPassengers + 1 : 1;
                };
            if (!self.parking.state) {
                send(self.eval.agent, 'RECEIVE_EVALUATION_DATA', [self.position.x, self.position.y, p()]);
            }
        }
    };

    this.next = 'init';
}