function simple (options) {
  this.name = "Simple Agent";

  this.act = {
    init: function () {
      log('test');
    },
    stop: function () {
      kill();
    }
  };

  this.trans = {
    init: stop
  };

  this.on = {

  };

  this.next = init;
}
