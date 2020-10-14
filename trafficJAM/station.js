function station(options) {

    this.position = null;
    this.street = null;
    this.stationID = null;

    this.act = {
        init: function () {
            let self = this;
            if (self.position != null) {
                net.setxy(self.position.x, self.position.y);
            }
            self.street.stationLink = self.stationID;
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