function evaluation_agent(options) {

    this.model = null;
    this.world = null;

    this.vehicle = options.vehicle;
    this.vehicleNode = options.vehicleNode;

    // evaluation
    this.monitor = {
        localData: [],
        waits: [],
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
            if (mSpeed < 0.1) {
                self.monitor.waits.push({t: clock(true), ag: self.vehicle, w: 1});
            }
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
                datasetSpeed = self.monitor.mSpeed.filter(obj => {
                    return obj.t > self.lastReport;
                }),
                datasetLocal = self.monitor.localData.filter(obj => {
                    return obj.t > self.lastReport;
                }),
                datasetWaits = self.monitor.waits.filter(obj => {
                    return obj.t > self.lastReport;
                }),
                mSpeedComp = false,
                mSpeedPComp = false,
                sentSum = false,
                receivedSum = false,
                createSum = false,
                waitsSum = 0;
            if (datasetSpeed.length > 0) {
                mSpeedComp = datasetSpeed.map(a => a.s).reduce((a, b) => a + b) / datasetSpeed.length;
                mSpeedPComp = datasetSpeed.map(a => a.sp).reduce((a, b) => a + b) / datasetSpeed.length;
            }
            if (datasetLocal.length > 0) {
                sentSum = datasetLocal.map(a => a.messages.sent).reduce((a, b) => a + b);
                receivedSum = datasetLocal.map(a => a.messages.received).reduce((a, b) => a + b);
                createSum = datasetLocal.map(a => a.messages.create).reduce((a, b) => a + b);
            }
            if (datasetWaits.length > 0) {
                waitsSum = datasetWaits.map(a => a.w).reduce((a, b) => a + b);
            }
            send(self.world.agent, 'RECEIVE_COMP_EVALUATION_DATA', [
                self.vehicle,
                mSpeedComp,
                mSpeedPComp,
                sentSum,
                receivedSum,
                createSum,
                waitsSum]);
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
            self.monitor.data.push({
                ag: self.vehicle,
                t: clock(true),
                x: args[0],
                y: args[1],
                p: args[2]
            });
            if (args[3]) {
                self.monitor.localData.push({
                    ag: self.vehicle,
                    t: clock(true),
                    messages: args[3].messages,
                    vs: args[3].valSeries
                });
            }
            self.counter++;
        }
    };

    this.next = 'init';
}