function transporter(options) {

    // global parameters
    this.model = null;
    this.parameter = null;
    this.api = null;

    // positional parameters
    this.position = null;
    this.direction = null;
    this.destination = null;
    this.route = [];
    this.busRoute = [];
    this.nextStation = null;
    this.busStop = false;

    // of type {'forward', 'approachIntersection', 'crossIntersection'}
    this.actionQueue = [];
    this.skip = false;

    // reservation system
    this.reservationState = 'none';
    this.intersectionQueue = [];
    this.currentIntersection = null;

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
                net.set('width', 20);
                net.set('height', 5);
                break;
            case 'car':
                net.set('color', 'blue');
                net.set('width', 10);
                net.set('height', 5);
                break;
            case 'bike':
                net.set('color', 'green');
                net.set('width', 5);
                net.set('height', 3);
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

    // Patch -> int
    this.getNextIntersectionFromPatch = function (patch) {
        let self = this;
        if (patch.type === 'intersection') {
            return patch.sid;
        } else if (patch.type === 'street') {
            let n = self.api.getRelVector(patch.direction, [patch.x, patch.y], [0, -1]);
            return self.getNextIntersectionFromPatch(net.ask('patch', [n[0], n[1]]));
        }
    };

    // Patch -> int
    this.getPrevIntersectionFromPatch = function (patch) {
        let self = this;
        if (patch.type === 'intersection') {
            return patch.sid;
        } else if (patch.type === 'street') {
            let n = self.api.getRelVector(patch.direction, [patch.x, patch.y], [0, 1]);
            return self.getPrevIntersectionFromPatch(net.ask('patch', [n[0], n[1]]));
        }
    };

    // Patch -> Patch -> [int]
    this.getRoute = function (from, to) {
        let self = this,
            route = [];
        const fromIntersection = self.getNextIntersectionFromPatch(from),
            toIntersection = self.getPrevIntersectionFromPatch(to),
            bf = self.api.bellmanFord(fromIntersection),
            ni1int = parseInt(self.getNextIntersectionFromPatch(to)),
            ni2int = parseInt(toIntersection);
        route.push(ni1int);
        route.push(ni2int);
        for (let i = 0; i < bf.distances.length; i++) {
            if (bf.prevs[route[route.length - 1]] === undefined) {
                break;
            } else {
                route.push(bf.prevs[route[route.length - 1]]);
            }
        }
        return self.route = route.reverse();
    };

    // int -> DIR
    this.getNextIntersectionFromRoute = function (sid) {
        let self = this,
            pd = self.api.getDestinationsFromIntersectionID(sid),
            nextDestination = self.route[0];
        for (let p in pd) {
            if (pd[p].id === nextDestination) {
                self.route.shift();
                return pd[p].direction;
            }
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
                    let nd;
                    if (self.type === 'bus') {
                        nd = self.getNextIntersectionFromRoute(patch.sid);
                    } else {
                        // use this for random walk
                        nd = self.api.getRandomNextIntersectionFromIntersectionID(patch.sid);
                        if (patch.intersectionType === 'normal') {
                            let i = 0;
                            // higher probability for going forward
                            while (i < 3) {
                                i += 1;
                                // do not allow turning back in random walk
                                while (self.api.getRelDir(nd, 'back') === pos.direction) {
                                    nd = self.api.getRandomNextIntersectionFromIntersectionID(patch.sid);
                                }
                                if (nd === pos.direction) {
                                    break;
                                }
                            }
                        }
                    }
                    let intersection = self.parameter.intersections[patch.sid],
                        intersectionPatch = net.ask('patch', [intersection.x, intersection.y]);
                    let sequence = self.api.getIntersectionPath(pos.direction, nd, intersectionPatch);
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

    // string -> Station
    this.getStationFromID = function (id) {
        let self = this;
        return self.parameter.stations.filter(function (station) {
            return station.stationID === id;
        })[0];
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
                self.busRoute = self.model.parameter.busRoutes[0];
                let from = net.ask('patch', [self.position.x, self.position.y]),
                    toStation = self.getStationFromID(self.busRoute.stations[0]),
                    to = net.ask('patch', [toStation.street.x, toStation.street.y]);
                self.destination = [to.x, to.y];
                self.nextStation = toStation;
                self.getRoute(from, to);
                self.route.shift();
                self.params.hasPassengers = true;
            }
        },
        percept: function () {
            let self = this,
                view = 2 * self.speed.allowed,
                i = 1,
                speedPossible = Math.min(self.speed.max, self.speed.allowed),
                speedRecommended = speedPossible;
            self.position = net.ask('patch');
            self.speed.allowed = self.position.speedLimit;
            if (self.type === 'bus') {
                if (self.route.length === 0 && self.type === 'bus') {
                    let from = net.ask('patch', [self.nextStation.street.x, self.nextStation.street.y]),
                        nextIndex = (self.busRoute.stations.indexOf(self.nextStation.stationID) + 1) % self.busRoute.stations.length,
                        nextStation = self.busRoute.stations[nextIndex],
                        toStation = self.getStationFromID(nextStation),
                        to = net.ask('patch', [toStation.street.x, toStation.street.y]);
                    self.destination = [to.x, to.y];
                    self.nextStation = toStation;
                    self.getRoute(from, toStation.street);
                    self.route.shift();
                }
            }
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
            /*if (nextPosition.type === 'intersection' && self.position.type === 'street') {
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
                            w = net.ask('agents-vehicle', [wc]);
                        if (w.length > 0) {
                            self.skip = true;
                        }
                }
            }*/
            self.speed.current = Math.min(speedPossible, speedRecommended);
        },
        intersectionAndStops: function () {
            let self = this, sendRequest = false;

            const nextPosition = self.actionQueue[0],
                nearPosition = self.actionQueue[1];

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
                });
                self.reservationState = 'waiting';
            }
            if (nextPosition.type === 'street' && self.position.type === 'intersection' && self.currentIntersection !== null) {
                create('reservation_agent', {
                    mode: 'COMPLETED',
                    linkNode: self.currentIntersection
                });
                self.currentIntersection = null;
                self.intersectionQueue.shift();
                self.reservationState = 'none';
            }

            // checks for cars in the current path
            if (net.ask('agents-vehicle', [nextPosition.x, nextPosition.y]).length > 0) {
                self.skip = true;
            }

            // checks for bus stop
            if (self.type === 'bus' && self.busRoute.stations.indexOf(nextPosition.stationLink) >= 0) {
                self.busStop = true;
                self.params.numPassengers = Math.round(Math.random() * self.params.maxPassengers);
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
        intersectionAndStops: drive,
        drive: wait,
        wait: percept
    };

    this.on = {
        'CONFIRMED': function (args) {
            let self = this;
            self.reservationState = 'confirmed';
        },
        'REJECTED': function (args) {
            let self = this;
            self.reservationState = 'none';
        }
    };

    this.next = 'init';
}