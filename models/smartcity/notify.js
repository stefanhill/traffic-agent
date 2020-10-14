function notifier(options) {
  this.root = null
  this.dest = options.dest
  this.act = {
    init : function () { 
      this.root=myNode()
      log('Starting') 
    },
    goto : function () {
      log('Going to '+this.dest) 
      moveto(DIR.PATH(this.dest))
    },
    notify : function () {
      log('Notification from neighbour '+this.root)
    },
    end : function () { kill() }
  }
  this.trans = {
    init : goto,
    goto : notify,
    notify : end
  }
  this.next = init
}
