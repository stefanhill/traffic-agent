function intersection_management(options) {

    this.model = null;
    this.parameter = null;
    this.api = null;

    this.p = null;

    this.type = null;

    this.position = null;
    this.intersection = null;
    this.connections = null;

    this.intersectionEmpty = false;

    // reservation system
    this.reservations = [];
    this.requestQueue = [];

    // intersectionType: 'normal'
    this.trafficLights = [];
    this.numWaiting = {};

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
            }
            else {
                p1Q.push(r);
            }
        }
        if (request.distance > 1) {
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

    this.act = {
        init: function () {
            let self = this;
            self.model = simu.model();
            self.parameter = self.model.parameter;
            self.api = self.model.api;
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
            /*switch (self.position.intersectionType) {
                case 'normal':
                    for (let c in self.connections) {
                        let parent = me(),
                            connection = self.connections[c],
                            pos = self.api.getRelVector(connection.direction, [self.position.x, self.position.y], [0, -2]),
                            f = net.create('agents-flow', 1, function () {
                                this.position = net.ask('patch', [pos[0], pos[1]]);
                            });
                        self.trafficLights.push({id: f[0], direction: connection.direction, x: pos[0], y: pos[1]});
                    }
                    break;
                case 'circuit':
                    break;
            }*/
            out(['INTERSECTION', me()]);
            sleep(5);
        },
        /*init_trafficLights: function () {
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
            let self = this;
            for (let tl in self.trafficLights) {
                let t = self.trafficLights[tl];
            }
        },
        waitUntilEmpty: function () {
            let self = this,
                patches = net.ask('patches', 1),
                vehicles = 0;
            self.intersectionEmpty = false;
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
            if (vehicles <= 1 && m.length === 0) {
                self.intersectionEmpty = true;
            }
            sleep(10);
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
                nextTL = self.trafficLights[0];
            for (let tl in self.trafficLights) {
                let t = self.trafficLights[tl];
                if (self.numWaiting[t.id] > self.numWaiting[nextTL.id]) {
                    nextTL = t;
                }
            }
            let patch = net.ask('patch', [nextTL.x, nextTL.y]);
            patch.state = 'go';
            self.numWaiting[nextTL.id] = 0;
        },
        waitCycle: function () {
            sleep(Math.round(random(100)) + 50);
        },
        init_circuit: function () {

        },*/
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
            if (myNode() === 'intersection_management-4') {
                log(self.reservations.length);
                log('-');
            }
        },
        wait: function () {
            sleep(1);
        }
    };

    this.trans = {
        /*init: function () {
            switch (this.position.intersectionType) {
                case 'normal':
                    return init_trafficLights;
                case 'circuit':
                    return init_circuit;
            }
        },
        init_trafficLights: startCycle,
        startCycle: getTrafficInformation,
        getTrafficInformation: waitUntilEmpty,
        waitUntilEmpty: function () {
            return (this.intersectionEmpty) ? waitForTrafficInformation : waitUntilEmpty;
        },
        waitForTrafficInformation: function () {
            return (this.numReturnedExplorer === this.trafficLights.length) ? setTrafficLightState : waitForTrafficInformation;
        },
        setTrafficLightState: waitCycle,
        waitCycle: startCycle,
        init_circuit: wait,*/
        init: checkRequests,
        checkRequests: wait,
        wait: checkRequests
    };

    this.on = {
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