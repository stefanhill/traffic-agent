function navigation(options) {

    this.modelSim = null;
    this.parameter = null;

    this.route = null;

    // int -> int -> [[int], [int]]
    this.bellmanFord = function (from, to) {
        let self = this,
            distance = [],
            prev = [];
        for (let n in self.parameter.intersections) {
            let node = self.parameter.intersections[n];
            distance[node.id] = Infinity;
            prev[node.id] = undefined;
        }
        distance[from] = 0;
        for (let i = 0; i < self.parameter.intersections.length - 1; i++) {
            for (let e in self.parameter.graph) {
                let edge = self.parameter.graph[e];
                if (distance[edge.from] + edge.distance < distance[edge.to]) {
                    distance[edge.to] = distance[edge.from] + edge.distance;
                    prev[edge.to] = edge.from;
                }
            }
        }
        return {distances: distance, prevs: prev};
    };

    // DIR -> [int, int] -> [int, int] -> [int, int]
    this.getRelVector = function (dir, m, v) {
        const alpha = [DIR.NORTH, DIR.EAST, DIR.SOUTH, DIR.WEST].indexOf(dir) * Math.PI / 2,
            rM = [[Math.cos(alpha), -1 * Math.sin(alpha)], [Math.sin(alpha), Math.cos(alpha)]];
        let vR = [rM[0][0] * v[0] + rM[0][1] * v[1], rM[1][0] * v[0] + rM[1][1] * v[1]];
        return [Math.round(vR[0] + m[0]), Math.round(vR[1] + m[1])];
    };


    // Patch -> int
    this.getNextIntersectionFromPatch = function (patch) {
        let self = this;
        if (patch.type === 'intersection') {
            return patch.sid;
        } else if (patch.type === 'street') {
            let n = self.getRelVector(patch.direction, [patch.x, patch.y], [0, -1]);
            return self.getNextIntersectionFromPatch(net.ask('patch', [n[0], n[1]]));
        }
    };

    // Patch -> int
    this.getPrevIntersectionFromPatch = function (patch) {
        let self = this;
        if (patch.type === 'intersection') {
            return patch.sid;
        } else if (patch.type === 'street') {
            let n = self.getRelVector(patch.direction, [patch.x, patch.y], [0, 1]);
            return self.getPrevIntersectionFromPatch(net.ask('patch', [n[0], n[1]]));
        }
    };

    // Patch -> Patch -> [int]
    this.getRoute = function (from, to) {
        let self = this,
            route = [];
        const fromIntersection = self.getNextIntersectionFromPatch(from),
            toIntersection = self.getPrevIntersectionFromPatch(to),
            bf = self.bellmanFord(fromIntersection),
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

    this.act = {
        init: function () {
            let self = this;
            self.modelSim = simu.model();
            self.parameter = self.modelSim.parameter;
            let from = net.ask('patch', [6, 10]),
                to = net.ask('patch', [26, 20]);
            self.getRoute(from, to);

        },
        wait: function () {
            sleep(2000);
        }
    };

    this.trans = {
        init: wait,
        wait: wait
    };

    this.on = {};

    this.next = 'init';
}