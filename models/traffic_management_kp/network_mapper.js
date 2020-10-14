function network_mapper(options) {
    this.dir = null;
    this.home = myNode();
    this.links = [];
    this.rid = null;
    this.startTime = null;
    this.waitTime = 50;
    this.waitCounter = 0;
    this.nodePlan = {};
    this.numChildren = 0;
    this.root = true;

    this.act = {
        init: function () {
            var self = this;
            self.dir = myNode();
            self.nodePlan.time = 0;
            self.nodePlan.name = myNode();
            self.rid = clock(true);
        },
        initNode: function () {
            var self = this;
            self.nodePlan.nodes = [];
            self.nodePlan.type = info('node').type;
        },
        getLinks: function () {
            var self = this;
            out(['VISITED', self.rid, clock(true), me()]);
            self.links = link(DIR.IP('%')).filter(obj => {
                return obj !== self.home;
            });
        },
        sendChildren: function () {
            var self = this;
            self.links.forEach(function (elem) {
                self.numChildren += 1;
                fork({dir: elem, numChildren: 0, waitTime: 50, root: false});
            });
        },
        explore: function () {
            var self = this;
            log('GOTO:' + self.dir + ' RID:' + self.rid);
            self.startTime = clock(true);
            self.home = myNode();
            moveto(DIR.NODE(self.dir));
        },
        sendReport: function () {
            var self = this,
                stopTime = clock(true);
            self.nodePlan.time = stopTime - self.startTime - self.waitCounter * self.waitTime;
            self.nodePlan.name = self.dir;
            send(myParent(), 'REPORT', [me(), self.nodePlan]);
        },
        wait: function () {
            var self = this;
            log('AWAITING:' + self.numChildren);
            self.waitCounter += 1;
            sleep(self.waitTime)
        },
        goHome: function () {
            var self = this;
            log('HOME:' + self.home + ' RID:' + self.rid);
            moveto(DIR.NODE(self.home));
        },
        sendNodePlan: function () {
            var self = this;
            send(myParent(), 'RECEIVE_NODE_PLAN', [self.nodePlan]);
        },
        fini: function () {
            kill();
        },
    };

    this.trans = {
        init: initNode,
        initNode: function () {
            return exists(['VISITED', this.rid, _, _]) ? goHome : getLinks;
        },
        getLinks: function () {
            return this.links.length > 0 ? sendChildren : goHome;
        },
        sendChildren: function () {
            return this.dir === myNode() ? wait : explore;
        },
        explore: initNode,
        goHome: sendReport,
        sendReport: fini,
        wait: function () {
            if (this.waitCounter < 200) {
                if (this.numChildren > 0) {
                    return wait;
                } else if (this.home === myNode()) {
                    if (this.root) {
                        return sendNodePlan;
                    }
                    else {
                        return wait;
                    }
                } else {
                    return goHome;
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

    this.next = 'init';
}