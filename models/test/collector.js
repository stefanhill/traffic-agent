function collector() {


    this.act = {
        init: function () {
            let self = this;
            let db = db.Database;
        },
        fini: function () {
            kill();
        }
    };

    this.trans = {
        init: fini,
        fini: fini
    };

    this.next = 'init';

}