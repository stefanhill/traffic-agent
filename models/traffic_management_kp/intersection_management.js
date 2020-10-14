function intersection_management(options) {

    this.model = null;
    this.parameter = null;
    this.api = null;

    this.type = null;

    this.position = null;
    this.intersection = null;
    this.connections = null;

    this.intersectionEmpty = false;

    // intersectionType: 'normal'
    this.trafficLights = [];
    this.numWaiting = {};

    // kp system
    this.kpQueue = [];

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
            switch (self.position.intersectionType) {
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
            }
            sleep(5);
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
                    });
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
                    rKP = elem.kp * elem.factor + self.kpQueue.length / self.trafficLights.length;
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
        wait: function () {
            sleep(20);
        }
    };

    this.trans = {
        init: function () {
            switch (this.position.intersectionType) {
                case 'normal':
                    return initTrafficLights;
                case 'circuit':
                    return initCircuit;
            }
        },
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
        initCircuit: wait,
        wait: wait
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
        }
    };

    this.next = 'init';
}