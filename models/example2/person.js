function person(options) {

    this.dir = options.dir;

    this.act = {
        init: function () {

        },
        explore: function () {
            log(this.dir);
            var links = link(DIR.PATH('*'));
            var n = links.shift();
            log(n);
            moveto(DIR.PATH(n));
        },
        wait: function () {
            log('person still there');
            sleep(100);
        }
    };

    this.trans = {
        init: explore,
        explore: wait,
        wait: wait
    };

    this.on = {
        'get_car': function (args) {
            log('move to car ' + args[0]);
            log(link(DIR.NODE(args[0])));
            log(link(DIR.NODE('car-0')));
        }
    };

    this.next = 'init';

}