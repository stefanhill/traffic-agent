function car(options) {
    this.name = "Car";
    this.x = 0;
    this.y = 0;
    this.speed = 4;
    this.links = [];
    this.home = undefined;
    this.dir = undefined;

    this.getRand = function () {
        var dir = Math.floor(Math.random() * 2);
        var d = Math.floor(Math.random() * this.speed);
        return dir <= 0 ? d : (-1) * d;
    };

    this.act = {
        init: function () {
            //net.set('color', 'red');
            net.setxy(25, 25);
        },
        drive: function () {
            var pos = simu.position();
            net.setxy(pos.x + this.getRand(), pos.y + this.getRand());
            if (link(DIR.PATH('*'))) {
                this.links = link(DIR.PATH('*'));
            }
        },
        explore: function () {
            //create('person', {dir: this.links.shift()});
            this.dir = this.links.shift();
            if (this.dir.startsWith('house')) {
                this.home = true;
            }
            else {
                create('person', {dir: this.dir});

            }
        },
        wait: function () {
            net.set('color', 'blue');
            sleep(100);
        },
        stop: function () {
            kill();
        }
    };

    this.trans = {
        init: drive,
        drive: function () {
            return this.links.length === 0 ? drive : explore;
        },
        explore: function () {
            return this.home ? wait : drive;
        },
        wait: wait
    };

    this.on = {};

    this.next = init;
}
