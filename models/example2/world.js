// World agent controlling the simulation and collection monitoring data
function world(options) {

    this.agents = [];
    this.limit = 3;

    this.act = {
        init: function () {
            net.create('agents-house', 1);
        },
        spawn: function () {
            var a = net.create('agents-car', 1);
            this.agents.push(a);
        },

        wait: function () {
            sleep(100);
        }
    };
    this.trans = {
        init: spawn,
        spawn: function () {
            this.limit = this.limit - 1;
            return this.limit > 0 ? spawn : wait;
        }
    };
    this.on = {
        'ask_car': function (args) {
            log(args[0] + ' asked for car');
            send(args[0], 'get_car', [this.agents.shift()]);
        }
    };
    this.next = 'init';
}
