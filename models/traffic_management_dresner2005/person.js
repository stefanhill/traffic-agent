function person(options) {

    this.name = undefined;

    this.act = {
        init: function () {

        },
        wait: function () {
            sleep(2000);
        }
    };

    this.trans = {
        init: wait,
        wait: wait
    };

    this.on = {

    };

    this.next = 'init';
}