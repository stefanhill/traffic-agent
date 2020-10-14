function intersection_management(options) {

    this.model = null;
    this.parameter = null;
    this.api = null;

    this.type = null;
    this.mode = 'kp';

    this.position = null;
    this.intersection = null;
    this.connections = null;

    this.intersectionEmpty = false;

    // reservation system
    this.reservations = [];
    this.requestQueue = [];

    this.trafficLights = [];
    this.numWaiting = {};

    // kp system
    this.kpQueue = [];

    // sector system
    this.sectors = [[1, 1], [1, -1], [-1, -1], [-1, 1]];

    // normal system
    this.tlCounter = 0;

    // REQUEST -> bool
    this.evalRequest = function (request) {
        let self = this,
            res = true;
        for (let rq in self.reservations) {
            let r = self.reservations[rq];
            res = res && self.api.checkCrossRequest([request.from, request.to], [r.from, r.to]);
        }
        return res;
    };

    // REQUEST -> void
    this.addToRequestQueue = function (request) {
        let self = this,
            p1Q = [],
            p2Q = [];
        for (let rq in self.requestQueue) {
            let r = self.requestQueue[rq];
            if (r.distance > 1) {
                p2Q.push(r);
            } else {
                p1Q.push(r);
            }
        }
        /*if (request.distance > 1) {
            if (request.size > 1) {
                p2Q.unshift(request);
            }
            else {
                p2Q.push(request);
            }
        }
        else {
            if (request.size > 1) {
                p1Q.unshift(request);
            }
            else {
                p1Q.push(request);
            }
        }*/
        if (request.distance > 1) {
            p2Q.push(request);
        } else {
            p1Q.push(request);
        }
        self.requestQueue = p1Q.concat(p2Q);
    };

    // DIR -> [int, int] -> int -> int -> int
    this.getNumWaitingRec = function (dir, coord, num, limit) {
        let self = this;
        if (limit <= 0) {
            return num;
        } else {
            let patch = net.ask('patch', coord),
                agents = net.ask('agents', coord),
                nextPos = self.api.getRelVector(dir, coord, [0, 1]);
            if (agents.length > 0 && patch.type === 'street') {
                return self.getNumWaitingRec(dir, nextPos, num + 1, limit - 1);
            } else if (patch.type === 'street') {
                return self.getNumWaitingRec(dir, nextPos, num, limit - 1);
            } else {
                return num;
            }
        }
    };

    // void -> bool
    this.isIntersectionEmpty = function () {
        let self = this,
            patches = net.ask('patches', 1),
            vehicles = 0;
        for (let i in patches) {
            let row = patches[i];
            for (let j in row) {
                let patch = row[j];
                if (net.ask('agents-vehicle', [patch.x, patch.y]).length > 0) {
                    vehicles++;
                }
            }
        }
        const m = net.ask('agents-vehicle', [self.position.x, self.position.y]);
        return vehicles <= 1 && m.length === 0;
    };

    this.act = {
        init: function () {
            let self = this;
            self.model = simu.model();
            self.parameter = self.model.parameter;
            self.api = self.model.api;
            self.mode = self.parameter.mode;

            if (self.position !== null) {
                net.setxy(self.position.x, self.position.y);
            }
            self.connections = self.api.getDestinationsFromIntersectionID(self.intersection);
            let patches = net.ask('patches', 1);
            for (let p1 in patches) {
                let patch = patches[p1];
                for (let p2 in patch) {
                    let p = patch[p2];
                    p.intersectionPort = myNode();
                }
            }
            if (self.mode === 'kp' || self.mode === 'normal') {
                for (let c in self.connections) {
                    let connection = self.connections[c],
                        pos = self.api.getRelVector(connection.direction, [self.position.x, self.position.y], [0, -2]),
                        f = net.create('agents-flow', 1, function () {
                            this.position = net.ask('patch', [pos[0], pos[1]]);
                        });
                    self.trafficLights.push({id: f[0], direction: connection.direction, x: pos[0], y: pos[1]});
                }
            }
            out(['INTERSECTION', me()]);
            sleep(5);
        },
        initNormal: function () {
            let self = this;
            self.tlCounter = 0;
        },
        startCycleNormal: function () {
            let self = this;
            for (let tl in self.trafficLights) {
                let t = self.trafficLights[tl],
                    p = net.ask('patch', [t.x, t.y]);
                p.state = 'stop';
            }
        },
        waitUntilEmptyNormal: function () {
            let self = this;
            sleep(self.parameter.simulationSpeed);
        },
        setTrafficLightStateNormal: function () {
            let self = this,
                nextTL = self.trafficLights[self.tlCounter % self.trafficLights.length],
                patch = net.ask('patch', [nextTL.x, nextTL.y]);
            patch.state = 'go';
            self.tlCounter++;
        },
        waitCycleNormal: function () {
            let self = this;
            sleep(7 * self.parameter.simulationSpeed);
        },
        initTrafficLights: function () {
            let self = this;
            for (let tl in self.trafficLights) {
                let t = self.trafficLights[tl],
                    p = net.ask('patch', [t.x, t.y]);
                self.trafficLights.filter(function (val) {
                    return val.id === t.id;
                })[0].node = p.trafficLightNode;
                self.numWaiting[t.id] = 0;
            }
        },
        startCycle: function () {
            let self = this;
            for (let tl in self.trafficLights) {
                let t = self.trafficLights[tl],
                    p = net.ask('patch', [t.x, t.y]);
                p.state = 'stop';
            }
        },
        getTrafficInformation: function () {
            let self = this,
                links = link(DIR.PATH('%'));
            for (let l in links) {
                let link = links[l];
                if (link.startsWith('vehicle')) {
                    create('kp_agent', {
                        intersectionNode: myNode(),
                        vehicleNode: link
                    }, 2);
                }
            }
        },
        waitUntilEmpty: function () {
            let self = this;
            sleep(self.parameter.simulationSpeed);
        },
        waitForTrafficInformation: function () {
            let self = this;
            self.numReturnedExplorer = self.trafficLights.length;
            for (let tl in self.trafficLights) {
                let t = self.trafficLights[tl],
                    streetPatchPos = self.api.getRelVector(self.api.getRelDir(t.direction, 'back'), [t.x, t.y], [1, 0]),
                    streetPatch = net.ask('patch', streetPatchPos);
                self.numWaiting[t.id] = self.numWaiting[t.id] + self.getNumWaitingRec(streetPatch.direction, streetPatchPos, 0, 5);
            }
        },
        setTrafficLightState: function () {
            let self = this,
                tlCounter = {},
                nextTL = self.trafficLights[0];
            for (let tl in self.trafficLights) {
                tlCounter[self.trafficLights[tl].direction] = 0;
            }
            for (let k in self.kpQueue) {
                let elem = self.kpQueue[k],
                    dir = self.api.getRelDir(elem.position.direction, 'back'),
                    distance = self.api.getDistance([self.position.x, self.position.y], [elem.position.x, elem.position.y]);
                tlCounter[dir] = tlCounter[dir] + elem.kp / distance;
            }
            let tlCounterSorted = Object.keys(tlCounter).sort(function (a, b) {
                return tlCounter[b] - tlCounter[a]
            });
            nextTL = self.trafficLights.filter(obj => {
                return obj.direction === tlCounterSorted[0];
            })[0];
            for (let k in self.kpQueue) {
                let elem = self.kpQueue[k],
                    rKP = elem.kp + elem.factor * self.kpQueue.length / self.trafficLights.length;
                if (self.api.getRelDir(elem.position.direction, 'back') === tlCounterSorted[0]) {
                    rKP = (tlCounter[tlCounterSorted[0]] - tlCounter[tlCounterSorted[1]]) / self.kpQueue.length;
                }
                send(elem.agent, 'RESETKP', [rKP]);
            }
            self.kpQueue = [];
            let patch = net.ask('patch', [nextTL.x, nextTL.y]);
            patch.state = 'go';
            self.numWaiting[nextTL.id] = 0;
        },
        waitCycle: function () {
            let self = this;
            sleep(7 * self.parameter.simulationSpeed);
        },
        initCircuit: function () {
        },
        waitCircuit: function () {
            sleep(500);
        },
        checkRequests: function () {
            let self = this;
            if (self.requestQueue.length > 0) {
                let rq = self.requestQueue[0];
                if (self.evalRequest(rq)) {
                    self.reservations[rq.id] = rq;
                    self.requestQueue.shift();
                    send(rq.agent, 'CONFIRMED', []);
                } else {
                    if (rq.distance > 1) {
                        self.requestQueue.shift();
                        send(rq.agent, 'REJECTED', []);
                    }
                }
            }
            // TODO: Methode implementieren, die alle paar Male prüft, ob die Kreuzung leer ist
        },
        wait: function () {
            sleep(1);
        },
        initSector: function () {
            let self = this;
            for (let s in self.sectors) {
                let spos = self.api.getRelVector(DIR.NORTH, [self.position.x, self.position.y], self.sectors[s]),
                    patch = net.ask('patches', spos);
                patch.sector = true;
                patch.reservations = [];
                patch.permission = 'nobody';
                patch.chair = 'nobody';
            }
        },
        refreshSector: function () {
            let self = this,
                len = 0,
                agentList = [];
            let i = -1;
            while (i <= 1) {
                let j = -1;
                while (j <= 1) {
                    let agents = net.ask('agents', [self.position.x + i, self.position.y + j]);
                    if (agents.length > 0) {
                        len++;
                        if (Math.abs(i + j) === 1) {
                            agentList.push(agents.map(x => x.agent).reduce((x, y) => x + y));
                        }
                    }
                    j++;
                }
                i++;
            }
            for (let s in self.sectors) {
                let spos = self.api.getRelVector(DIR.NORTH, [self.position.x, self.position.y], self.sectors[s]),
                    patch = net.ask('patches', spos);
                patch.deadlockPrevention = len > 6;
                if (patch.deadlockPrevention
                    && patch.reservations.length > 0
                    && patch.chair === 'nobody'
                    && patch.reservations.map(x=>x.agent).indexOf(patch.permission) === -1) {
                    for (let r in patch.reservations) {
                        let reservation = patch.reservations[r];
                        if (agentList.indexOf(reservation.agent) !== -1) {
                            patch.permission = reservation.agent;
                        }
                    }
                }
            }
        },
        waitSector: function () {
            let self = this;
            sleep(2);
        }
    };

    this.trans = {
        init: function () {
            switch (this.mode) {
                case 'kp':
                    return initTrafficLights;
                case 'reservation':
                    return checkRequests;
                case 'normal':
                    return initNormal;
                case 'circuit':
                    return initCircuit;
                case 'sector':
                    return initSector;
            }
        },

        // kp
        initTrafficLights: startCycle,
        startCycle: getTrafficInformation,
        getTrafficInformation: waitUntilEmpty,
        waitUntilEmpty: function () {
            return this.isIntersectionEmpty() ? waitForTrafficInformation : waitUntilEmpty;
        },
        waitForTrafficInformation: setTrafficLightState,
        setTrafficLightState: waitCycle,
        waitCycle: function () {
            return this.isIntersectionEmpty() ? startCycle : waitCycle;
        },

        // normal
        initNormal: startCycleNormal,
        startCycleNormal: waitUntilEmptyNormal,
        waitUntilEmptyNormal: function () {
            return this.isIntersectionEmpty() ? setTrafficLightStateNormal : waitUntilEmptyNormal;
        },
        setTrafficLightStateNormal: waitCycleNormal,
        waitCycleNormal: startCycleNormal,

        // circuit
        initCircuit: waitCircuit,
        waitCircuit: waitCircuit,

        // reservation
        checkRequests: wait,
        wait: checkRequests,

        // sector
        initSector: refreshSector,
        refreshSector: waitSector,
        waitSector: refreshSector
    };

    this.on = {
        'TRANSMITKP': function (args) {
            let self = this;
            self.kpQueue.push({
                agent: args[0],
                kp: args[1],
                position: args[2],
                factor: args[3]
            });
        },
        'REQUEST': function (args) {
            let self = this;
            self.addToRequestQueue(args[0]);
        },
        'COMPLETED': function (args) {
            let self = this;
            delete self.reservations[args[0]];
        }
    };

    this.next = 'init';
}