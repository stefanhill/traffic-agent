// this file contains all functions and variables from the old navigation system
// it is possible to use it for a navigation agent

this.destination = null;
this.route = [];


// use this in getPathRec() for intersection path
let nd = self.getNextIntersectionFromRoute(patch.sid);


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

startChat: function () {
    if (exists(['CHAT'])) {
        log('chat agent');
        out(['MESSAGE', me(), 'Hallo, du komischer Vogel.']);
        out(['QUESTION', me(), 'Was geht?', {choices: ['Nix', 'Alles, was Beine hat. Ausser Tische und Stuehle.']}]);
        inp.try(20000, ['ANSWER', me(), 'Was geht?', _], function (t) {
            if (t) {
                out(['MESSAGE', me(), 'Echt jetzt, du Lappen?']);
                out(['MESSAGE', me(), 'Naja, ich geh dann mal wieder :)']);
            }
        });
    } else {
        log('no chat agent');
    }
},