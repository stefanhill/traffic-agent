function house(options) {
    this.name = "House";
    this.x = 0;
    this.y = 0;

    this.getRand = function () {
        var dir = Math.floor(Math.random() * 2);
        var d = Math.floor(Math.random() * this.speed);
        return dir <= 0 ? d : (-1) * d;
    };

    this.act = {
        init: function () {
            //net.set('color', 'red');
            net.setxy(10, 10);
        },
        wait: function () {
            sleep(200);
        },
        stop: function () {
            kill();
        }
    };

    this.trans = {
        init: wait,
        wait: wait
    };

    this.on = {};

    this.next = init;
}
