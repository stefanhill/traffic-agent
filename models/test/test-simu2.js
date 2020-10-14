/*
  SEJAM2 Demo: Vehicle agents on streets
  1. Physical and computational agents
  2. Netlog API und Patchworld
  3. Resources (streets)
*/

function world() {
  this.modelSim=null;
  this.children=[];
  this.streets=[];
  
  this.act = {
    init: function () {
      var self=this, row , patches, i,j,s,st;
      this.modelSim = simu.model();
      this.streets=net.ask('resources-street','*');
      patches = net.ask('patches','*');
      for(s=0;s<this.streets.length;s++) {
        st=this.streets[s];
        for(j=st.y;j<st.y+st.h;j++)
          for(i=st.x;i<st.x+st.w;i++)
            patches[j][i].street=st.resource;
      }
      net.create('agent-vehicle',4,function (ag,index) {
          var st=self.streets[0];
          ag.street=st;
          ag.dir=DIR.WEST;
          net.turn(ag.dir);
          net.setxy(st.x+int(st.w/2)-3+index,st.y)
      })
    },
    wait: function () {},
    end: function () {}
  }
  this.trans = {
    init:wait,
  }
  this.next=init
}
function vehicle() {
  this.group=null;
  this.passenger=[];
  this.dir=DIR.ORIGIN;
  this.sensors={}
  this.speed=0;
  this.street=null;
  this.todo={};
  this.last=null;
  
  this.act = {
    init: function () {
    },
    percept: function () {
      switch (this.dir) {
        case DIR.WEST:
          this.sensors.front = reverse(net.ask('patches',{dir:DIR.WEST,distance:4}))
          this.sensors.left  =         net.ask('patches',{dir:DIR.SOUTH,distance:4})
          this.sensors.right = reverse(net.ask('patches',{dir:DIR.NORTH,distance:4}))
          break;
        case DIR.EAST:
          this.sensors.front =         net.ask('patches',{dir:DIR.EAST,distance:4})
          this.sensors.left  = reverse(net.ask('patches',{dir:DIR.NORTH,distance:4}))
          this.sensors.right =         net.ask('patches',{dir:DIR.SOUTH,distance:4})
          break;
        case DIR.NORTH:
          this.sensors.front = reverse(net.ask('patches',{dir:DIR.NORTH,distance:4}))
          this.sensors.left  = reverse(net.ask('patches',{dir:DIR.WEST,distance:4}))
          this.sensors.right =         net.ask('patches',{dir:DIR.EAST,distance:4})
          break;
        case DIR.SOUTH:
          this.sensors.front =         net.ask('patches',{dir:DIR.SOUTH,distance:4})
          this.sensors.left  =         net.ask('patches',{dir:DIR.EAST,distance:4})
          this.sensors.right = reverse(net.ask('patches',{dir:DIR.WEST,distance:4}))
          break;
        
      }
      if (this.sensors.front[0].street != this.street.resource) 
        net.die();       // vehicle left the road!
      log(simu.inspect(this.sensors.right))
      if (this.sensors.right[1].street &&
          this.sensors.right[1].street != this.street.resource &&
          this.last != this.sensors.right[1].street) {
        var next=net.ask('resource',this.sensors.right[1].street)
        log(next.resource)
        this.todo={right:next};
      }
      if (this.sensors.front[1].street &&
          this.sensors.front[1].street != this.street.resource &&
          this.last != this.sensors.front[1].street) {
        var next=net.ask('resource',this.sensors.front[1].street)
        log(next.resource)
        this.todo={forward:1,right:next};
      }
    },
    move: function () {
      if (this.todo.forward) net.forward(this.todo.forward);
      if (this.todo.right) {
        // change street by right turn
        this.last=this.street.resource;
        this.street=this.todo.right;
        net.turn(90);
        switch (net.get('heading')) {
          case 0:   this.dir=DIR.NORTH; break;
          case 90:  this.dir=DIR.EAST; break;
          case 180: this.dir=DIR.SOUTH; break;
          case 270: this.dir=DIR.WEST; break;
        }
      }
      if (!this.todo.forward) net.forward(1);
      this.todo={}
    },
    wait: function () {
      sleep(5)
    },
    end: function () {}
  }
  this.trans = {
    init:percept,
    percept:wait,
    wait:move,
    move:percept,
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
    vehicle : {
      behaviour : vehicle,
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
    vehicle : function (x,y,id) {
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
    }

  },  
  
  resources : {
    street : function (id,x,y,w,h) {
        return {
          id:id,
          class:'street',
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
        };
      }
  },

  parameter : {
    streets:{}
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
      var i,j,x,y;
      // construct street map
      var streets=[];
      i=1;
      for(y=3;y<model.world.patchgrid.rows-5;y+=7,i++) {
        model.parameter.streets['street'+i] = [
            2,y,(model.world.patchgrid.cols-4),3
        ]
        i++;
        if (y<model.world.patchgrid.rows-10) 
          for(x=3;x<model.world.patchgrid.cols-5;x+=10,i++) {
            model.parameter.streets['street'+i] = [
              x,(y+3),3,4
            ]
          }
      }
      // construct
      for(var p in model.parameter.streets) {
        var coord = model.parameter.streets[p];
        streets.push(model.resources.street(p,coord[0],coord[1],coord[2],coord[3]))
      }
      return streets;
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
