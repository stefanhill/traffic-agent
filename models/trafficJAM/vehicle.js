function vehicle(options) {

    // global parameters
    this.model = null;
    this.parameter = null;
    this.api = null;
    this.world = null;

    this.mode = 'kp';
    this.twin = {
        sFactor: 1,
        dFactor: 1
    };

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

    // reservation system
    this.reservationState = 'none';
    this.intersectionQueue = [];
    this.currentIntersection = null;

    // kp system
    this.kp = 1;
    this.lastIntersection = null;

    // sector system
    this.val = 1;
    this.platoon = [];
    this.leader = null;
    this.leaderNode = null;
    this.blockingFactor = 1;
    this.nextSector = null;
    this.valSum = 0;
    this.negotiationBias = 1;
    this.multiplicator = 0;
    this.lFactor = 0.5;
    this.competingReservation = null;
    this.proposerNotInRange = false;

    // evaluation
    this.monitor = {
        reportLocal: false,
        messages: {
            sent: 0,
            received: 0,
            create: 0
        },
        valSeries: []
    };
    this.eval = {
        agent: null
    };

    // behavioural parameters
    this.type = null;
    this.speed = {
        max: 3,
        allowed: 0,
        current: 0,
        sFactor: 1,
        dFactor: 1
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
                    self.intersectionQueue.push({from: pos.direction, to: nd});
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
            self.mode = self.parameter.mode;
            self.world = self.model.parameter.const.world;
            // use this for random walk
            let randomPos = self.getRandomStreetCoordinates();

            net.setxy(randomPos[0], randomPos[1]);
            self.position = net.ask('patch');

            self.direction = self.position.direction;
            self.speed.current = 0;
            if (self.twin !== null) {
                self.speed.dFactor = self.twin.dFactor;
                self.speed.sFactor = self.twin.sFactor;
                self.lFactor = self.twin.lFactor;
            }
            self.setColor();

            if (self.type === 'bus') {
                self.params.hasPassengers = true;
            }

            out(['VEHICLE', me()]);
            create('agent_control', {
                target: self.world.agent,
                targetNode: self.world.node,
                message: 'INIT_AG',
                params: [me(), myNode(), self.type, 'active', self.twin !== null],
            }, 2);
            self.eval.agent = create('evaluation_agent', {
                vehicle: me(),
                vehicleNode: myNode(),
            }, 2);
        },
        percept: function () {
            let self = this;
            self.position = net.ask('patch');
            self.speed.allowed = self.position.speedLimit;

            let view = 2 * self.speed.allowed;
            self.actionQueue = self.getPathRec(self.position, self.actionQueue, view, view);

            let j = 0,
                speedPossible = Math.min(self.speed.max, self.speed.allowed),
                speedBehaviour = speedPossible * self.speed.sFactor,
                setSector = true;
            for (let e in self.actionQueue) {
                let elem = self.actionQueue[e],
                    agents = net.ask('agents', [elem.x, elem.y]);
                if (agents.length > 0) {
                    for (let a in agents) {
                        if (agents[a].class === 'vehicle') {
                            speedBehaviour = speedBehaviour - 1 / (Math.pow(2, j) * self.speed.dFactor);
                        }
                    }
                }
                if (self.mode === 'sector' && elem.sector && setSector) {
                    setSector = false;
                    self.nextSector = net.ask('patch', [elem.x, elem.y]);
                }
                j++;
            }
            if (setSector) {
                self.nextSector = null;
            }
            if (self.mode === 'sector') {
                if (self.position.type === 'intersection') {
                    self.blockingFactor = 2;
                } else {
                    self.blockingFactor = 0;
                }
                if (self.nextSector !== null) {
                    let myDir = self.api.getRelDirPGrid([self.nextSector.x, self.nextSector.y], [self.position.x, self.position.y]),
                        distance = self.api.getDistance([self.nextSector.x, self.nextSector.y], [self.position.x, self.position.y]),
                        pushMyReservation = true;
                    self.competingReservation = null;
                    self.valSum = 0;
                    self.multiplicator = 0;
                    self.valSum += self.val;
                    self.multiplicator += self.params.numPassengers + self.blockingFactor + 1 / distance;
                    if (self.platoon.length > 0) {
                        self.negotiationBias += self.platoon.map(x => x[2]).reduce((x, y) => x + y);
                        self.multiplicator += self.platoon.map(x => x[3] + x[4] + 1 / x[5]).reduce((x, y) => x + y);
                    }
                    self.negotiationBias = self.valSum * self.multiplicator;
                    if (self.nextSector.reservations.length > 0 && self.nextSector.permission !== me()) {
                        let i = 0;
                        while (i < self.nextSector.reservations.length) {
                            let elem = self.nextSector.reservations[i];
                            if (distance > 0) {
                                if (elem.dir === myDir) {
                                    pushMyReservation = false;
                                    if (elem.agent === me()) {
                                        self.leader = null;
                                        self.leaderNode = null;
                                        self.nextSector.reservations.splice(i, 1);
                                        self.nextSector.reservations.push({
                                            dir: myDir,
                                            agent: me(),
                                            node: myNode(),
                                            distance: distance,
                                            value: self.negotiationBias
                                        });
                                    } else {
                                        if (elem.distance >= distance) {
                                            self.leader = null;
                                            self.leaderNode = null;
                                            self.nextSector.reservations.splice(i, 1);
                                            self.nextSector.reservations.push({
                                                dir: myDir,
                                                agent: me(),
                                                node: myNode(),
                                                distance: distance,
                                                value: self.negotiationBias
                                            });
                                        } else {
                                            if (DIR.PATH(elem.node) && self.leader === null) {
                                                self.leader = elem.agent;
                                                self.leaderNode = elem.node;
                                                create('agent_control', {
                                                    target: self.leader,
                                                    targetNode: self.leaderNode,
                                                    message: 'FOLLOW',
                                                    params: [me(),
                                                        myNode(),
                                                        self.val,
                                                        self.params.numPassengers,
                                                        self.blockingFactor,
                                                        distance]
                                                }, 2);
                                                self.monitor.messages.create++;
                                            }
                                        }
                                    }
                                } else {
                                    self.competingReservation = elem;
                                }
                            }
                            i++;
                        }
                    }
                    if (pushMyReservation) {
                        self.leader = null;
                        self.leaderNode = null;
                        self.nextSector.reservations.push({
                            dir: myDir,
                            agent: me(),
                            node: myNode(),
                            distance: distance,
                            value: self.negotiationBias
                        });
                    }
                    if (self.leader === null
                        && self.nextSector.permission === 'nobody'
                        && self.nextSector.chair === 'nobody'
                        && self.competingReservation !== null
                        && !self.nextSector.deadlockPrevention
                        && distance < 3
                        && self.negotiationBias > self.competingReservation.value) {
                        self.nextSector.chair = me();
                        create('negotiation_agent', {
                            chair: me(),
                            chairNode: myNode(),
                            proposer: self.competingReservation.agent,
                            proposerNode: self.competingReservation.node,
                            nb1: self.negotiationBias,
                            nb2: self.competingReservation.value
                        }, 2);
                        self.monitor.messages.create++;
                    }
                    if (distance === 1
                        && self.competingReservation === null
                        && !self.nextSector.deadlockPrevention
                        ||
                        self.proposerNotInRange) {
                        self.proposerNotInRange = false;
                        self.nextSector.permission = me();
                        self.nextSector.chair = 'nobody';
                        self.competingReservation = null;
                        for (let i = 0; i < self.nextSector.reservations.length; i++) {
                            let elem = self.nextSector.reservations[i];
                            if (elem.agent === me()) {
                                self.nextSector.reservations.splice(i, 1);
                            }
                        }
                        for (let p in self.platoon) {
                            let follower = self.platoon[p];
                            create('agent_control', {
                                target: follower[0],
                                targetNode: follower[1],
                                message: 'UNFOLLOW',
                                params: [follower[2]]
                            }, 2);
                            self.monitor.messages.create++;
                        }
                        self.platoon = [];
                    }
                }
            }
            self.speed.current = (self.speed.current + speedBehaviour) / 2;
        },
        intersectionAndStops: function () {
            let self = this,
                sendRequest = false,
                patch = net.ask('patch', [self.position.x, self.position.y]),
                nextPosition = self.actionQueue[0],
                nearPosition = self.actionQueue[1];
            switch (self.mode) {
                case 'kp':
                    if (nextPosition.type === 'intersection' && self.position.type === 'street') {
                        let tlc = self.api.getRelVector(self.direction, [self.position.x, self.position.y], [-1, 0]),
                            tl = net.ask('patch', tlc);
                        if (tl.state === 'stop') {
                            self.skip = true;
                        }
                    }
                    if (self.position.type === 'intersection') {
                        self.lastIntersection = self.position.intersectionPort;
                    }
                    self.monitor.valSeries.push({val: self.kp});
                    break;
                case 'reservation':
                    if (nextPosition.type === 'intersection' && self.position.type === 'street') {
                        if (self.reservationState === 'waiting') {
                            self.skip = true;
                        } else if (self.reservationState === 'none') {
                            self.skip = true;
                            sendRequest = true;
                            self.currentIntersection = net.ask('patch', [nextPosition.x, nextPosition.y]).intersectionPort;
                        }
                    }
                    if (nearPosition.type === 'intersection' && self.reservationState === 'none') {
                        sendRequest = true;
                        self.currentIntersection = net.ask('patch', [nearPosition.x, nearPosition.y]).intersectionPort;
                    }
                    if (sendRequest) {
                        create('reservation_agent', {
                            from: self.intersectionQueue[0].from,
                            to: self.intersectionQueue[0].to,
                            distance: 1,
                            size: self.params.numPassengers + 1,
                            mode: 'REQUEST',
                            linkNode: self.currentIntersection
                        }, 2);
                        self.monitor.messages.create++;
                        self.reservationState = 'waiting';
                    }
                    if (nextPosition.type === 'street' && self.position.type === 'intersection' && self.currentIntersection !== null) {
                        create('reservation_agent', {
                            mode: 'COMPLETED',
                            linkNode: self.currentIntersection
                        }, 2);
                        self.monitor.messages.create++;
                        self.currentIntersection = null;
                        self.intersectionQueue.shift();
                        self.reservationState = 'none';
                    }
                    break;
                case 'normal':
                    if (nextPosition.type === 'intersection' && self.position.type === 'street') {
                        let tlc = self.api.getRelVector(self.direction, [self.position.x, self.position.y], [-1, 0]),
                            tl = net.ask('patch', tlc);
                        if (tl.state === 'stop') {
                            self.skip = true;
                        }
                    }
                    break;
                case 'circuit':
                    if (nextPosition.type === 'intersection' && self.position.type === 'street') {
                        let w1c = self.api.getRelVector(self.direction, [self.position.x, self.position.y], [-1, -1]),
                            w2c = self.api.getRelVector(self.direction, [self.position.x, self.position.y], [-2, -1]),
                            w1 = net.ask('agents', w1c),
                            w2 = net.ask('agents', w2c);
                        if (w1.length > 0 || w2.length > 0) {
                            self.skip = true;
                        }
                    }
                    break;
                case 'sector':
                    let np = net.ask('patch', [nextPosition.x, nextPosition.y]);
                    if (self.nextSector !== null) {
                        if (np.deadlockPrevention) {
                            if (self.position.type === 'street' && self.nextSector.permission === me()) {
                                self.nextSector.permission = 'nobody';
                                self.skip = true;
                            }
                            self.nextSector.chair = 'nobody';
                        }
                        if (self.leader !== null && self.nextSector.permission === me()) {
                            self.nextSector.permission = 'nobody';
                        }
                    }
                    if (np.sector && np.permission !== me()) {
                        self.skip = true;
                    }
                    if (self.position.sector) {
                        patch.permission = 'nobody';
                        self.competingReservation = null;
                        for (let i = 0; i < self.position.reservations.length; i++) {
                            let elem = self.position.reservations[i];
                            if (elem.agent === me()) {
                                self.position.reservations.splice(i, 1);
                            }
                        }
                        for (let p in self.platoon) {
                            let follower = self.platoon[p];
                            create('agent_control', {
                                target: follower[0],
                                targetNode: follower[1],
                                message: 'UNFOLLOW',
                                params: [follower[2]]
                            }, 2);
                            self.monitor.messages.create++;
                        }
                        self.platoon = [];
                    }
                    self.monitor.valSeries.push({val: self.val, nb: self.negotiationBias, m: self.multiplicator});
                    break;
            }
            if (net.ask('agents-vehicle', [nextPosition.x, nextPosition.y]).length > 0) {
                self.skip = true;
            }
            if (self.type === 'bus' && nextPosition.stationLink) {
                self.busStop = true;
                self.params.numPassengers = Math.round(Math.random() * self.params.maxPassengers);
            }
            if (self.position.type === 'intersection' && nextPosition.type === 'street') {
                self.monitor.reportLocal = true;
            }
            /*
            if (Math.random() < 0.01 && self.type !== 'bus') {
                self.parking.toggle = true;
            }*/
        },
        initParking: function () {
            let self = this,
                parkSlotCoords = self.api.getRelVector(self.direction, [self.position.x, self.position.y], [1, 0]),
                parkSlot = net.ask('agents', parkSlotCoords);
            if (self.parking.toggle && parkSlot.length === 0 && self.position.type === 'street' && self.reservationState === 'none') {
                net.setxy(parkSlotCoords[0], parkSlotCoords[1]);
                self.parking.state = true;
                self.parking.toggle = false;
                create('agent_control', {
                    target: self.world.agent,
                    targetNode: self.world.node,
                    message: 'UPDATE_AG_PARKING_STATE',
                    params: [me(), 'parking']
                }, 2);
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
                self.speed.current = 0;
                self.skip = false;
            }
        },
        wait: function () {
            let self = this;
            if (self.speed.current < 0.1) {
                self.speed.current = 0;
            }
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
            self.monitor.messages.received++;
            if (self.lastIntersection !== args[1] && !self.parking.state) {
                let factorKP = function () {
                    return self.params.hasPassengers ? self.params.numPassengers + 1 : 1;
                };
                send(args[0], 'RETURNKP', [self.kp, self.position, factorKP()]);
                self.monitor.messages.sent++;
            } else {
                send(args[0], 'NONEED', []);
                self.monitor.messages.sent++;
            }
        },
        'SETKP': function (args) {
            let self = this;
            self.monitor.messages.received++;
            self.kp = args[0];
        },
        'GET_EVALUATION_DATA': function (args) {
            let self = this,
                p = function () {
                    return self.params.hasPassengers ? self.params.numPassengers + 1 : 1;
                },
                local = function () {
                    return self.monitor.reportLocal ? {
                        messages: self.monitor.messages,
                        valSeries: self.monitor.valSeries
                    } : false;
                };
            if (!self.parking.state) {
                send(self.eval.agent, 'RECEIVE_EVALUATION_DATA', [
                    self.position.x,
                    self.position.y,
                    p(),
                    local()
                ]);
            }
            if (self.monitor.reportLocal) {
                self.monitor = {
                    reportLocal: false,
                    messages: {
                        sent: 0,
                        received: 0,
                        create: 0
                    },
                    valSeries: []
                };
            }
        },
        'CONFIRMED': function (args) {
            let self = this;
            self.monitor.messages.received++;
            self.reservationState = 'confirmed';
        },
        'REJECTED': function (args) {
            let self = this;
            self.monitor.messages.received++;
            self.reservationState = 'none';
        },
        'C_TOGGLE_PARKING': function (args) {
            let self = this;
            self.parking.toggle = true;
        },
        'FOLLOW': function (args) {
            let self = this;
            self.monitor.messages.received++;
            if (!self.platoon.map(x => x[0]).includes(args[0])) {
                self.platoon.push(args);
            }
        },
        'UNFOLLOW': function (args) {
            let self = this;
            self.monitor.messages.received++;
            self.leader = null;
            self.leaderNode = null;
        },
        'TRANSMIT_VALUE': function (args) {
            let self = this,
                vSplit = self.valSum + args[0] / (self.platoon.length + 1);
            self.monitor.messages.received++;
            self.val = vSplit;
            for (let p in self.platoon) {
                let follower = self.platoon[p];
                create('agent_control', {
                    target: follower[0],
                    targetNode: follower[1],
                    message: 'SET_VALUE',
                    params: [vSplit]
                }, 2);
                self.monitor.messages.create++;
            }
        },
        'SET_VALUE': function (args) {
            let self = this;
            self.monitor.messages.received++;
            self.val = args[0];
        },
        'ASK_VALUE': function (args) {
            let self = this,
                factor = args[2] === 'chair' ? self.lFactor: (1 - self.lFactor),
                v = args[1] / self.multiplicator * factor;
            self.monitor.messages.received++;
            send(args[0], 'REPORT_VALUE', [me(), v]);
            self.monitor.messages.sent++;
        },
        'VOTE_VALUE': function (args) {
            let self = this,
                condVal;
            self.monitor.messages.received++;
            if (args[2] === 'chair') {
                condVal = (self.valSum - args[1]) / self.valSum;
            } else {
                condVal = self.valSum / (self.valSum + args[1]);
            }
            send(args[0], 'REPORT_VOTE', [me(), condVal > self.lFactor]);
            self.monitor.messages.sent++;
        },
        'NEGOTIATION_RESULT': function (args) {
            let self = this,
                vSplit = (self.valSum - args[0]) / (self.platoon.length + 1);
            self.monitor.messages.received++;
            if (self.nextSector !== null) {
                self.nextSector.permission = me();
                self.nextSector.chair = 'nobody';
                self.competingReservation = null;
                create('agent_control', {
                    target: args[1],
                    targetNode: args[2],
                    message: 'TRANSMIT_VALUE',
                    params: [args[0]]
                }, 2);
                self.monitor.messages.create++;
                self.val = vSplit;
                for (let i = 0; i < self.nextSector.reservations.length; i++) {
                    let elem = self.nextSector.reservations[i];
                    if (elem.agent === me()) {
                        self.nextSector.reservations.splice(i, 1);
                    }
                }
                for (let p in self.platoon) {
                    let follower = self.platoon[p];
                    create('agent_control', {
                        target: follower[0],
                        targetNode: follower[1],
                        message: 'UNFOLLOW',
                        params: [vSplit]
                    }, 2);
                    self.monitor.messages.create++;
                }
                self.platoon = [];
            }
        },
        'NOT_IN_RANGE': function (args) {
            let self = this;
            self.monitor.messages.received++;
            self.proposerNotInRange = true;
        }
    };

    this.next = 'init';
}