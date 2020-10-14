function station(options) {

    this.model = null;
    this.parameter = null;
    this.api = null;

    this.position = null;
    this.street = null;
    this.stationID = null;

    this.act = {
        init: function () {
            let self = this;
            self.model = simu.model();
            self.parameter = self.model.parameter;
            self.api = self.model.api;
            if (self.position != null) {
                net.setxy(self.position.x, self.position.y);
            }
            self.parameter.stations.push({
                stationID: self.stationID,
                x: self.position.x,
                y: self.position.y,
                street: self.street
            });
            self.street.stationLink = self.stationID;
            log(net.ask('patch', [self.street.x, self.street.y]));
        },
        wait: function () {
            sleep(200);
        }
    };

    this.trans = {
        init: wait,
        wait: wait
    };

    this.on = {};

    this.next = 'init';
}