function world(options) {

    this.model = null;
    this.parameter = null;
    this.api = null;

    this.carLimit = 1;
    this.stationLimit = 1;

    this.intersectionDistance = 3;
    this.stationPositions = [];

    // -> Patch
    this.getRandomStationPosition = function () {
        const self = this,
            intersectionDistance = 3,
            streets = net.ask('resources-street', '*'),
            street = streets[Math.floor(Math.random() * streets.length)];
        if (street.w + street.h > 12) {
            let patch;
            if (street.w > street.h) {
                patch = net.ask('patch', [street.x + Math.round(random(street.w - 2 * intersectionDistance) + intersectionDistance), street.y]);
            } else {
                patch = net.ask('patch', [street.x, street.y + Math.round(random(street.h - 2 * intersectionDistance) + intersectionDistance)]);
            }
            for (let s in self.parameter.stations) {
                const station = self.parameter.stations[s];
                if (Math.abs(station.x - patch.x) + Math.abs(station.y - patch.y) < 2 * intersectionDistance) {
                    return self.getRandomStationPosition();
                }
            }
            return patch;
        } else {
            return self.getRandomStationPosition();
        }
    };

    //
    this.getStationPositions = function () {
        let self = this,
            streets = net.ask('resources-street', '*'),
            patches = [];
        for (let s in streets) {
            let street = streets[s];
            if (street.w > street.h) {
                for (let i = 0; i < street.w - 2 * self.intersectionDistance; i++) {
                    patches.push(net.ask('patch', [street.x + i + self.intersectionDistance, street.y]));
                }
            } else {

            }
        }
    };

    this.act = {
        init: function () {
            let self = this;

            self.model = simu.model();
            self.parameter = self.model.parameter;
            self.api = self.model.api;

            self.carLimit = self.parameter.numCars;
            self.stationLimit = Math.floor(self.parameter.graph.length * 2 / 3);

            self.model.world.resources([
                {
                    type: 'street', param: {
                        x: 1, y: 1, w: 4, h: 1
                    }
                }
            ]);

            for (let l in self.parameter.log) {
                log('SIMLOG:' + self.parameter.log[l]);
            }

            //create('network_explorer', []);
            sleep(1);
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
            sleep(10);
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
            sleep(5);
        },
        initStations: function () {
            /*let self = this;
            net.create('agents-station', 1, function () {
                let street = self.getRandomStationPosition();
                this.street = street;
                this.position = net.ask('patch', self.api.getRelVector(street.direction, [street.x, street.y], [1, 0]));
            });
            self.stationLimit--;*/
            let self = this;
            net.create('agents-station', 1, function () {
                let street = net.ask('patch', [6, 10]);
                this.street = street;
                this.stationID = 'station-1';
                this.position = net.ask('patch', self.api.getRelVector(street.direction, [street.x, street.y], [1, 0]));
            });
            net.create('agents-station', 1, function () {
                let street = net.ask('patch', [23, 6]);
                this.street = street;
                this.stationID = 'station-2';
                this.position = net.ask('patch', self.api.getRelVector(street.direction, [street.x, street.y], [1, 0]));
            });
            net.create('agents-station', 1, function () {
                let street = net.ask('patch', [24, 15]);
                this.street = street;
                this.stationID = 'station-3';
                this.position = net.ask('patch', self.api.getRelVector(street.direction, [street.x, street.y], [1, 0]));
            });
            net.create('agents-station', 1, function () {
                let street = net.ask('patch', [12, 24]);
                this.street = street;
                this.stationID = 'station-4';
                this.position = net.ask('patch', self.api.getRelVector(street.direction, [street.x, street.y], [1, 0]));
            });
            sleep(10);
        },
        initBuses: function () {
            net.create('agents-vehicle', 3, function () {
                this.type = 'bus';
                this.speed.max = 1;
            });
            sleep(1);
        },
        initCars: function () {
            let self = this;
            net.create('agents-vehicle', 1, function () {
                this.type = 'car';
                this.speed.max = 2;
            });
            self.carLimit--;
            sleep(1);
        },
        wait: function () {
            sleep(200);
        }
    };

    this.trans = {
        init: initPatches,
        initPatches: initIntersections,
        initIntersections: initCars,
        initStations: initBuses,
        initBuses: initCars,
        initCars: function () {
            return (this.carLimit > 0) ? initCars : wait;
        },
        wait: wait
    };

    this.on = {};

    this.next = 'init';
}
