function i_explorer(options) {

    this.job = options.job;
    this.platform = options.platform;
    this.flow = options.flow;

    this.act = {
        init: function () {
        },
        init_getNumWaiting: function () {
            let self = this;
            moveto(DIR.PATH(self.platform));
            send(myParent(), 'test', ['test']);
            log(link(DIR.PATH('*')));
            log(myParent());
            log(self.flow);
        },
        wait: function () {
            sleep(2000);
        }
    };

    this.trans = {
        init: function () {
            switch (this.job) {
                case 'getNumWaiting':
                    return init_getNumWaiting;
            }
        },
        init_getNumWaiting: wait,
        wait: wait
    };

    this.on = {};

    this.next = 'init';
}