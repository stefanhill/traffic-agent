function evaluation_agent(options) {

    this.model = null;
    this.world = null;

    this.vehicle = options.vehicle;
    this.vehicleNode = options.vehicleNode;

    // evaluation
    this.monitor = {
        data: [],
        mSpeed: [],
    };
    this.counter = 0;
    this.rcounter = 0;
    this.lastReport = 0;
    this.lastReduce = 0;

    this.act = {
        init: function () {
            let self = this;
            self.model = simu.model();
            self.world = self.model.parameter.const.world;
            self.lastReport = clock(true);
            self.lastReduce = clock(true);
        },
        sense: function () {
            let self = this;
            send(self.vehicle, 'GET_EVALUATION_DATA', []);
        },
        reduceData: function () {
            let self = this,
                dataset = self.monitor.data.filter(obj => {
                    return obj.t > self.lastReduce;
                }),
                pos = [];
            for (let i = 0; i < dataset.length - 1; i++) {
                pos.push({
                    x: Math.abs(dataset[i].x - dataset[i + 1].x),
                    y: Math.abs(dataset[i].y - dataset[i + 1].y),
                    p: (dataset[i].p + dataset[i + 1].p) / 2
                });
            }
            let mSpeed = pos.map(p => Math.sqrt(p.x * p.x + p.y * p.y))
                    .reduce((a, b) => a + b)
                / pos.length,
                mSpeedP = pos.map(p => Math.sqrt(p.x * p.x + p.y * p.y) * p.p)
                        .reduce((a, b) => a + b)
                    / pos.length;
            self.monitor.mSpeed.push({t: clock(true), ag: self.vehicle, s: mSpeed, sp: mSpeedP});
            self.counter = 0;
            self.rcounter++;
            self.lastReduce = clock(true);
        },
        moveToWorldAgent: function () {
            let self = this;
            moveto(DIR.PATH(self.world.node));
        },
        report: function () {
            let self = this,
                dataset = self.monitor.mSpeed.filter(obj => {
                    return obj.t > self.lastReport;
                }),
                mSpeedComp = dataset.map(a => a.s).reduce((a, b) => a + b) / dataset.length,
                mSpeedPComp = dataset.map(a => a.sp).reduce((a, b) => a + b) / dataset.length;
            send(self.world.agent, 'RECEIVE_COMP_EVALUATION_DATA', [self.vehicle, mSpeedComp, mSpeedPComp]);
            self.rcounter = 0;
            self.lastReport = clock(true);
        },
        moveToVehicle: function () {
            let self = this;
            moveto(DIR.PATH(self.vehicleNode));
        },
        wait: function () {
            sleep(10);
        }
    };

    this.trans = {
        init: sense,
        sense: wait,
        wait: function () {
            return this.counter >= 5 ? reduceData : sense;
        },
        reduceData: function () {
            return this.rcounter >= 5 ? moveToWorldAgent : sense;
        },
        moveToWorldAgent: report,
        report: moveToVehicle,
        moveToVehicle: sense
    };

    this.on = {
        'RECEIVE_EVALUATION_DATA': function (args) {
            let self = this;
            self.monitor.data.push({ag: self.vehicle, t: clock(true), x: args[0], y: args[1], p: args[2]});
            self.counter++;
        }
    };

    this.next = 'init';
}