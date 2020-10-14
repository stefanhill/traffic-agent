function world(options) {

    this.model = null;
    this.parameter = null;
    this.api = null;

    this.mode = 'normal';


    // evaluation
    this.monitor = {
        data: [],
        speed: [],
        waits: [],
        messages: [],
        all: []
    };
    this.eval = {
        last: 0,
        counter: 0
    };

    this.network = {
        plan: {},
        paths: [],
        token: null,
        verifiedRemotes: []
    };

    this.ag = [];

    this.checkValidation = function (id) {
        return this.network.verifiedRemotes.indexOf(id) !== -1;
    };

    // void
    this.refreshSourcesAndSinks = function () {
        let self = this;
        for (let k in self.parameter.intersections) {
            let i = self.parameter.intersections[k],
                maxDistance = 2 * self.model.world.patchgrid.rows / Math.log(self.model.world.patchgrid.rows);
            self.parameter.intersections[k].sources = self.parameter.sources.filter(function (elem) {
                return self.api.getDistance([i.x, i.y], [elem.x, elem.y]) < maxDistance;
            });
        }
    };

    // {time: int, nodes: [{..}], type: string, name: string} -> {nodes: [string], time: int} -> void
    this.getNodePathsRec = function (nodes, path) {
        let self = this;
        for (let n in nodes) {
            let node = nodes[n],
                nodeObj = {nodes: [node.name].concat(path.nodes), time: path.time + node.time};
            if (node.type === 'webapp') {
                self.network.paths.push(nodeObj);
            }
            self.getNodePathsRec(node.nodes, nodeObj);
        }
    };

    this.act = {
        init: function () {
            let self = this;

            self.model = simu.model();
            self.parameter = self.model.parameter;
            self.api = self.model.api;
            self.mode = self.parameter.mode;

            self.parameter.const.world.agent = me();
            self.parameter.const.world.node = myNode();

            for (let l in self.parameter.log) {
                log('SIMLOG:' + self.parameter.log[l]);
            }

            self.eval.last = clock(true);

            self.refreshSourcesAndSinks();

            if (self.parameter.const.enable.network) {
                create('network_mapper', {});
            }

            sleep(self.parameter.simulationSpeed);
        },
        initPatches: function () {
            let self = this,
                streets = net.ask('resources-street', '*'),
                patches = net.ask('patches', '*'),
                s, j, i;
            for (s = 0; s < streets.length; s++) {
                let st = streets[s];
                for (j = st.y; j < st.y + st.h; j++) {
                    for (i = st.x; i < st.x + st.w; i++) {
                        let res = st.resource.split('-');
                        patches[j][i].type = res[0];
                        patches[j][i].sid = res[1];
                        patches[j][i].speedLimit = 5;
                        patches[j][i].direction = self.api.getDirectionFromString(res[2]);
                    }
                }
            }
            let intersections = net.ask('resources-intersection', '*');
            for (s = 0; s < intersections.length; s++) {
                let inters = intersections[s];
                for (j = inters.y; j < inters.y + inters.h; j++) {
                    for (i = inters.x; i < inters.x + inters.w; i++) {
                        let res = inters.resource.split('-');
                        patches[j][i].type = res[0];
                        patches[j][i].sid = res[1];
                        patches[j][i].speedLimit = 5;
                        patches[j][i].intersectionType = self.mode;
                    }
                }
            }
            sleep(self.parameter.simulationSpeed);
        },
        initIntersections: function () {
            let self = this;
            for (let i in self.parameter.intersections) {
                const intersection = self.parameter.intersections[i];
                net.create('agents-intersection_management', 1, function () {
                    this.position = net.ask('patch', [intersection.x, intersection.y]);
                    this.intersection = i;
                });
            }
            sleep(self.parameter.simulationSpeed);
        },
        initStations: function () {
            let self = this,
                streets = net.ask('resources-street', '*').filter(obj => {
                    return obj.w + obj.h > 2 * self.parameter.const.stations.distance;
                }).filter(obj => {
                    return Math.random() < self.parameter.const.stations.granularity;
                }).map(obj =>
                    net.ask('patch', [obj.x + Math.floor(obj.w / 2), obj.y + Math.floor(obj.h / 2)])
                );
            let i = 1;
            streets.forEach(function (elem) {
                const pos = self.api.getRelVector(elem.direction, [elem.x, elem.y], [1, 0]);
                net.create('agents-station', 1, function () {
                    this.position = net.ask('patch', pos);
                    this.stationID = 'station-' + i;
                    this.street = elem;
                });
                self.parameter.stations.push({
                    stationID: 'station-' + i,
                    x: pos[0],
                    y: pos[1],
                    street: elem
                });
                i++;
            });
            sleep(self.parameter.simulationSpeed);
        },
        initBuses: function () {
            let self = this;
            net.create('agents-vehicle', self.parameter.const.num.buses, function () {
                this.type = 'bus';
                this.speed.max = 1;
                this.params.numPassengers = Math.floor(Math.random() * 5) + 1;
            });
            sleep(self.parameter.simulationSpeed);
        },
        initCars: function () {
            let self = this;
            /*net.create('agents-vehicle', self.parameter.const.num.cars, function () {
                this.type = 'car';
                this.speed.max = 2;
                this.parking.toggle = Math.random() < 0.5;
            });*/
            net.create('agents-vehicle', self.parameter.const.num.cars, function () {
                this.type = 'car';
                this.speed.max = 2;
                //this.parking.toggle = Math.random() < 0.5;
                this.twin = {
                    sFactor: Math.random() * 0.5 + 0.75,
                    dFactor: Math.random() * 0.5 + 0.75,
                    lFactor: Math.random() * 0.5 + 0.5
                };
                this.params.numPassengers = 1;
            });
            sleep(self.parameter.simulationSpeed);
        },
        wait: function () {
            let self = this;
            self.refreshSourcesAndSinks();
            sleep(50 * self.parameter.simulationSpeed);
        },
        evalData: function () {
            let self = this;
            if (self.monitor.data.length > 0) {
                let dataset = self.monitor.data.filter(obj => {
                        return obj.t > self.eval.last;
                    }),
                    dLen = dataset.length,
                    len = self.monitor.data.length,
                    mSpeed = dataset.map(a => a.s).reduce((a, b) => a + b) / dLen,
                    mSpeedK = self.monitor.data.map(a => a.s).reduce((a, b) => a + b) / len,
                    mSpeedP = dataset.map(a => a.sp).reduce((a, b) => a + b) / dLen,
                    mSpeedPK = self.monitor.data.map(a => a.sp).reduce((a, b) => a + b) / len,
                    sentSum = dataset.map(a => a.sent).reduce((a, b) => a + b) / dLen,
                    sentSumK = self.monitor.data.map(a => a.sent).reduce((a, b) => a + b) / len,
                    receivedSum = dataset.map(a => a.received).reduce((a, b) => a + b) / dLen,
                    receivedSumK = self.monitor.data.map(a => a.received).reduce((a, b) => a + b) / len,
                    createSum = dataset.map(a => a.create).reduce((a, b) => a + b) / dLen,
                    createSumK = self.monitor.data.map(a => a.create).reduce((a, b) => a + b) / len,
                    waitsSum = dataset.map(a => a.waits).reduce((a, b) => a + b),
                    waitsSumK = self.monitor.data.map(a => a.waits).reduce((a, b) => a + b) / (self.eval.counter + 1);
                self.monitor.speed.push({
                    s: mSpeed, sk: mSpeedK, sp: mSpeedP, spk: mSpeedPK
                });
                self.monitor.waits.push({
                    w: waitsSum, wk: waitsSumK
                });
                self.monitor.messages.push({
                    snd: sentSum, sndk: sentSumK, r: receivedSum,
                    rk: receivedSumK, c: createSum, ck: createSumK
                });
                self.monitor.all.push({
                    s: mSpeed, sk: mSpeedK,
                    sp: mSpeedP, spk: mSpeedPK,
                    w: waitsSum, wk: waitsSumK,
                    snd: sentSum, sndk: sentSumK,
                    r: receivedSum, rk: receivedSumK,
                    c: createSum, ck: createSumK
                });
                self.eval.last = clock(true);
                self.eval.counter++;
            }
        }
    };

    this.trans = {
        init: initPatches,
        initPatches: initIntersections,
        initIntersections: initBuses, // initStations
        initStations: initBuses,
        initBuses: initCars,
        initCars: wait,
        wait: evalData,
        evalData: wait
    };

    this.on = {
        'RECEIVE_COMP_EVALUATION_DATA': function (args) {
            let self = this;
            self.monitor.data.push({
                t: clock(true),
                ag: args[0],
                s: args[1],
                sp: args[2],
                sent: args[3],
                received: args[4],
                create: args[5],
                waits: args[6]
            });
        },
        'RECEIVE_NODE_PLAN': function (args) {
            let self = this;
            self.network.plan = args[0];
            self.getNodePathsRec(self.network.plan.nodes, {nodes: [self.network.plan.name], time: 0});
            if (self.network.token === null) {
                self.network.token = Math.floor(Math.random() * 9000) + 1000;
            }
            log('TOKEN:' + self.network.token);
            for (let p in self.network.paths) {
                let path = self.network.paths[p];
                create('remote_control', {
                    path: path.nodes.reverse(),
                    time: path.time
                }, 2);
            }
        },
        'VALIDATE_TOKEN': function (args) {
            let self = this;
            if (parseInt(args[1]) === self.network.token) {
                self.network.verifiedRemotes.push(args[0]);
                send(args[0], 'ACCEPT_TOKEN', []);
            } else {
                send(args[0], 'DENY_TOKEN', []);
            }
        },
        // [agent, node, class, {active|parking}, bool]
        'INIT_AG': function (args) {
            let self = this;
            self.ag.push({
                agent: args[0],
                node: args[1],
                type: args[2],
                state: args[3],
                twin: args[4]
            });
        },
        'UPDATE_AG_PARKING_STATE': function (args) {
            let self = this;
            self.ag.filter(obj => {
                return obj.agent === args[0];
            })[0].state = args[1];
        },
        'CREATE_TWIN': function (args) {
            let self = this;
            /*if (self.checkValidation(args[0])) {*/
            let twin = net.create('agents-vehicle', 1, function () {
                this.type = 'car';
                this.speed.max = 1;
                this.twin = args[1];
            }, 2);
            send(args[0], 'CREATE_TWIN_CONFIRMATION', [twin]);
            /*} else {
                send(args[0], 'DENY_TOKEN', []);
            }*/
        },
        'ADD_BUS': function (args) {
            let self = this;
            if (self.checkValidation(args[0])) {
                let buses = self.ag.filter(obj => {
                    return obj.type === 'bus' && obj.state === 'parking';
                });
                if (buses.length > 0) {
                    create('agent_control', {
                        target: buses[0].agent,
                        targetNode: buses[0].node,
                        message: 'C_TOGGLE_PARKING',
                        params: []
                    }, 2);
                } else {
                    net.create('agents-vehicle', args[1], function () {
                        this.type = 'bus';
                        this.speed.max = 1;
                    });
                }
                send(args[0], 'ADD_BUS_CONFIRMATION', []);
                // TODO: wait for confirmation of vehicle send confirmation later
            } else {
                send(args[0], 'DENY_TOKEN', []);
            }
        },
        'REMOVE_BUS': function (args) {
            let self = this;
            if (self.checkValidation(args[0])) {
                let buses = self.ag.filter(obj => {
                    return obj.type === 'bus' && obj.state === 'active';
                });
                if (buses.length > 0) {
                    create('agent_control', {
                        target: buses[0].agent,
                        targetNode: buses[0].node,
                        message: 'C_TOGGLE_PARKING',
                        params: []
                    }, 2);
                }
                send(args[0], 'REMOVE_BUS_CONFIRMATION', []);
                // TODO: wait for confirmation of vehicle send confirmation later
            } else {
                send(args[0], 'DENY_TOKEN', []);
            }
        }
    };
    this.next = 'init';
}
