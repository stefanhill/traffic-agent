function flow(options) {

    this.state = null;
    this.position = null;

    this.setState = function (s) {
        switch (s) {
            case 'stop':
                net.set('color', 'red');
                break;
            case 'go':
                net.set('color', 'green');
        }
    };

    this.act = {
        init: function () {
            let self = this;
            if (self.position !== null) {
                net.setxy(self.position.x, self.position.y);
            }
            let patch = net.ask('patch');
            patch.trafficLightNode = myNode();
        },
        setTrafficLightState: function () {
            let self = this,
                state = net.ask('patch', [self.position.x, self.position.y]).state;
            if (state !== undefined) {
                self.setState(state);
            }
        },
        wait: function () {
            sleep(3);
        }
    };

    this.trans = {
        init: setTrafficLightState,
        setTrafficLightState: wait,
        wait: setTrafficLightState
    };

    this.on = {};

    this.next = 'init';
}