function world(options) {

    this.model = null;
    this.parameter = null;
    this.api = null;

    this.carLimit = 1;

    // evaluation
    this.monitor = {
        data: [],
        mSpeed: [],
    };
    this.eval = {
        last: 0
    };

    this.network = {
        plan: {},
        paths: [],
        token: null,
        verifiedRemotes: []
    };

    this.test = {};

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

            self.parameter.const.world.agent = me();
            self.parameter.const.world.node = myNode();
            self.carLimit = self.parameter.numCars;

            for (let l in self.parameter.log) {
                log('SIMLOG:' + self.parameter.log[l]);
            }

            self.eval.last = clock(true);

            self.refreshSourcesAndSinks();

            create('network_mapper', {});

            //create ('network_explorer', []);
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
                        patches[j][i].intersectionType = res[2];
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
            });
            sleep(self.parameter.simulationSpeed);
        },
        initCars: function () {
            let self = this;
            net.create('agents-vehicle', self.parameter.const.num.cars, function () {
                this.type = 'car';
                this.speed.max = 2;
                this.parking.toggle = Math.random() < 0.5;
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
                    mSpeed = dataset.map(a => a.s).reduce((a, b) => a + b) / dataset.length,
                    mSpeedK = self.monitor.data.map(a => a.s).reduce((a, b) => a + b) / self.monitor.data.length,
                    mSpeedP = dataset.map(a => a.sp).reduce((a, b) => a + b) / dataset.length,
                    mSpeedPK = self.monitor.data.map(a => a.sp).reduce((a, b) => a + b) / self.monitor.data.length;
                self.monitor.mSpeed.push({s: mSpeed, sk: mSpeedK, sp: mSpeedP, spk: mSpeedPK});
                self.eval.last = clock(true);
            }
        }
    };

    this.trans = {
        init: initPatches,
        initPatches: initIntersections,
        initIntersections: initStations,
        initStations: initBuses,
        initBuses: initCars,
        initCars: wait,
        wait: evalData,
        evalData: wait
    };

    this.on = {
        'RECEIVE_COMP_EVALUATION_DATA': function (args) {
            let self = this;
            self.monitor.data.push({t: clock(true), ag: args[0], s: args[1], sp: args[2]});
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
                });
            }
        },
        'VALIDATE_TOKEN': function (args) {
            let self = this;
            if (parseInt(args[1]) === self.network.token) {
                self.network.verifiedRemotes.push(args[0]);
                send(args[0], 'ACCEPT_TOKEN', []);
            }
            else {
                send(args[0], 'DENY_TOKEN', []);
            }
        }
    };
    this.next = 'init';
}
