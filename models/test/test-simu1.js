/*
  SEJAM2:
  1. Physical and computational agents
  2. Netlog API und Patchworld
  3. Agent groups
  4. Resources (obstacles)
*/

function world() {
  this.modelSim=null;
  this.children=[];
  
  this.act = {
    init: function () {
      var self=this;
      this.modelSim = simu.model();
      this.children=net.create('agents-follower',10, function (o) {
          var x0=random(0,self.modelSim.world.patchgrid.cols-1),
              y0=random(0,self.modelSim.world.patchgrid.rows-1);
          net.setxy(x0,y0)        
      })
      this.children.push(net.create('agents-leader',1,function (o) {
          var x0=random(0,self.modelSim.world.patchgrid.cols-1),
              y0=random(0,self.modelSim.world.patchgrid.rows-1);
          net.setxy(x0,y0)        
      }))
    },
    wait: function () {},
    end: function () {}
  }
  this.trans = {
    init:wait,
  }
  this.next=init
}

function follower() {
  this.group=null;
  this.children=[];
  this.position=null;
  
  this.act = {
    init: function () {
    },
    percept: function () {
      this.group = net.ask('agent',net.ask('parent'));
      
      if (this.group && this.group.length) this.group=this.group[0];
      if (this.group) this.position=this.group.pos;
    },
    wait: function () {
      sleep(5)
    },
    end: function () {}
  }
  this.trans = {
    init:percept,
    percept:wait,
    wait:percept,
  }
  this.next=init
}

function leader() {
  this.children = []
  this.steps = 0
  this.act = {
    init: function () {
      log('waiting for twins...')
      net.turn(DIR.WEST)
      sleep(2)
    },
    groupthem: function () {
      log('group')
      // Collect some follower agents in the world
      this.children = 
        map(net.ask('agents-follower','*'), function (o) {
          if (Math.random()>0.5) return o.agent;
          else return none;
        });
      log(this.children)
      net.group.add(me(),this.children,DIR.EAST)  
    },
    percept : function () {
      var obstacles = net.ask('resource-obstacle',4);
      log(4); log(simu.inspect(obstacles))
      var sensors = [DIR.NORTH,DIR.SOUTH,DIR.WEST,DIR.EAST];
      iter(sensors,function (sensor) {
        var next = net.ask('distance',sensor);
        log(sensor); log(simu.inspect(next))
      })
      var next = net.ask('resource',{dx:-2,dy:-2,w:5,h:5});
      log('bbox'); log(simu.inspect(next))
    },
    move: function () {
      if (this.steps==3) {
        log('turning');
        net.turn(DIR.NORTH);
      } else {
        log('moving');
        net.forward(1);
      }
      this.steps++
    },
    wait: function () { sleep(5)},
    end: function () {}
  }
  this.trans = {
    init:groupthem,
    groupthem:wait,
    wait:percept,
    percept:move,
    move:wait
  }
  this.next=init
}

model = {
  name:'Test Simulation',
  
  // Agents behaviour and visuals
  agents : {
    world : {
      behaviour:world,
      visual:{
          shape:'circle',
          width:10,
          height:10,
          fill: {
            color:'green',
            opacity: 0.0
          }
      } 
    },
    
    follower : {
      behaviour : follower,
      visual:{
          shape:'circle',
          width:4,
          height:4,
          fill: {
            color:'blue',
            opacity: 0.0
          }
      },
      type:'physical'
    },
    
    leader : {
      behaviour : leader,
      visual:{
          shape:'circle',
          width:4,
          height:4,
          fill: {
            color:'white',
            opacity: 0.0
          }
      },
      type:'physical'
    },
  },
  
  parameter : {
  },


  // Node constructor functions (visual)
  nodes: {
    world: function (x,y) {
        return {
          id:'world',
          x:x, // patch position
          y:y,
          visual : {
            shape:'icon',
            icon:'world',
            label:{
              text:'World',
              fontSize:14
            },
            width:20,
            height:20,
            fill: {
              color:'black',
              opacity: 0.5
            }
          },
        }
    },
    follower : function (x,y,id) {
        return {
          id:id,
          x:x, // patch position
          y:y,
          visual : {
            shape:'circle',
            width:10,
            height:10,
            line : {
              width:0,
            },
            fill: {
              color:'orange',
              opacity: 0.5
            }
          }
        }      
    },
    
    leader : function (x,y,id) {
        return {
          id:id,
          x:x, // patch position
          y:y,
          visual : {
            shape :'rect',
            width :10,
            height:10,
            fill: {
              color:'black',
              opacity: 0.5
            },
            line : {
              width:1,
              color:'black'
            },
          }
        }      
    },

  },  
  
  resources : {
    block : function (x,y,w,h,id) {
      return {
          data : [],
          id : id,
          class : 'obstacle',
          visual: {
            shape:'rect',
            label:{
              text:id,
              fontSize:5
            },
            x:x,
            y:y,
            width:w,
            height:h,
            line: {
              color: '#888',
              width: 0
            },
            fill : {
              color: '#888',
              opacity: 0.2,
            }
          }    
      }
    }
  },

  world : {
    init: {
      agents: {
        world: function(nodeId) {
          if (nodeId=='world') 
            return {level:3,args:{verbose:1}};
        }
      }
    },
    // special nodes
    map : function (model) {
      return [
          model.nodes.world(20,20),  // patch position    
      ]
    },
    resources : function (model) {
      // patch grid coordinates!!
      return [
        model.resources.block(10,15,2,3,'obstacle1'),
        model.resources.block(3,5,2,3,'obstacle2'),
        model.resources.block(7,10,2,3,'obstacle3'),
        model.resources.block(10,3,2,3,'obstacle4'),
      ]
    },
    patchgrid : {
      rows : 20,
      cols : 20,
      width : 10, // geometrical width and height of patch in pixels
      height : 10,
      floating : true,  // physical agents are tuples <logical node, physical agent>
    }
  }  
}
