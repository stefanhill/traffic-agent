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
        init_trafficLights: function () {
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

        },
        wait: function () {
            sleep(2000);
        }
    };

    this.trans = {
        init: function () {
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
        init_circuit: wait,
        wait: wait
    };

    this.on = {
        'test': function (args) {
            log(args[0]);
        }
    };

    this.next = 'init';
}