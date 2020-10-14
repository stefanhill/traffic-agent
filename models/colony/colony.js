function colony() {

    // typeC: colony, typeN: network, typeM: messenger, typeL: learner, typeR: rebuild, typeD: delete
    this.type = 'typeC';

    this.colony = {
        start: null,
        name: null,
    };

    this.network = {
        links: [],
        node: {
            name: null,
            type: null,
        },
        activeConnections: []
    };

    this.tN = {
        dir: null,
        home: myNode(),
        links: [],
        rid: null,
        startTime: null,
        waitTime: 50,
        waitCounter: 0,
        nodePlan: {},
        numChildren: 0,
        root: true,
    };


    this.act = {

        // typeC agent
        tC_init: function () {
            let self = this;
            self.colony.name = me();
            self.colony.start = clock(true);
            out(['COLONY', self.colony.name, self.colony.start]);
        },
        tC_createUnit: function () {

        },
        tC_initUnit: function () {

        },
        tC_wait: function () {
            sleep(2000);
        },

        // typeN agent
        tN_init: function () {
            var self = this;
            self.dir = myNode();
            self.nodePlan.time = 0;
            self.nodePlan.name = myNode();
            self.rid = clock(true);
        },
        tN_initNode: function () {
            var self = this;
            self.nodePlan.nodes = [];
            self.nodePlan.type = info('node').type;
        },
        tN_getLinks: function () {
            var self = this;
            out(['VISITED', self.rid, clock(true), me()]);
            self.links = link(DIR.IP('%')).filter(obj => {
                return obj !== self.home;
            });
        },
        tN_sendChildren: function () {
            var self = this;
            self.links.forEach(function (elem) {
                self.numChildren += 1;
                fork({dir: elem, numChildren: 0, waitTime: 50, root: false});
            });
        },
        tN_explore: function () {
            var self = this;
            log('GOTO:' + self.dir + ' RID:' + self.rid);
            self.startTime = clock(true);
            self.home = myNode();
            moveto(DIR.NODE(self.dir));
        },
        tN_sendReport: function () {
            var self = this,
                stopTime = clock(true);
            self.nodePlan.time = stopTime - self.startTime - self.waitCounter * self.waitTime;
            self.nodePlan.name = self.dir;
            send(myParent(), 'REPORT', [me(), self.nodePlan]);
        },
        tN_wait: function () {
            var self = this;
            log('AWAITING:' + self.numChildren);
            self.waitCounter += 1;
            sleep(self.waitTime)
        },
        tN_goHome: function () {
            var self = this;
            log('HOME:' + self.home + ' RID:' + self.rid);
            moveto(DIR.NODE(self.home));
        },
        tN_sendNodePlan: function () {
            var self = this;
            send(myParent(), 'RECEIVE_NODE_PLAN', [self.nodePlan]);
        },

        // general functions
        fini: function () {
            kill();
        },
    };

    this.trans = {
        tC_init: tC_createUnit,
        tC_createUnit: tC_initUnit,
        tC_initUnit: function () {
            switch (this.type) {
                case "typeC":
                    return tC_wait;
                case "typeN":
                    return tN_init;
            }
        },
        tC_wait: tC_wait,
        tN_init: tN_initNode,
        tN_initNode: function () {
            return exists(['VISITED', this.rid, _, _]) ? tN_goHome : tN_getLinks;
        },
        tN_getLinks: function () {
            return this.links.length > 0 ? tN_sendChildren : tN_goHome;
        },
        tN_sendChildren: function () {
            return this.dir === myNode() ? tN_wait : tN_explore;
        },
        tN_explore: tN_initNode,
        tN_goHome: tN_sendReport,
        tN_sendReport: fini,
        tN_wait: function () {
            if (this.waitCounter < 200) {
                if (this.numChildren > 0) {
                    return tN_wait;
                } else if (this.home === myNode()) {
                    if (this.root) {
                        return tN_sendNodePlan;
                    }
                    else {
                        return tN_wait;
                    }
                } else {
                    return tN_goHome;
                }

            } else {
                return fini;
            }
        },
        sendNodePlan: fini
    };

    this.on = {
        'REPORT': function (arg, from) {
            var self = this;
            self.numChildren = self.numChildren - 1;
            self.nodePlan.nodes.push(arg[1]);
        }
    };

    this.next = 'tC_init';

}