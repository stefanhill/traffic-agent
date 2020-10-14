function network_explorer(options) {

    this.act = {
        init: function () {
            log(myParent());
        },
        move: function () {
            let links = link(DIR.IP('%'));
            log(links[0]);
            moveto(DIR.NODE(links[0]));
        },
        wait: function () {
            log('hello relais');
            sleep(20000);
        }
    };

    this.trans = {
        init: move,
        move: wait,
        wait: wait
    };

    this.on = {};

    this.next = 'init';
}