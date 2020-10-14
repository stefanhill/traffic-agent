{
  name:'Crowdsensing Simulation',
  agents : {
    world : {
      behaviour:open('world.js'),
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
    twin : {
      behaviour : open('twin.js'),
      visual:{
          shape:'circle',
          width:4,
          height:4,
          fill: {
            color:'blue',
            opacity: 0.0
          }
      },
      type:'physical', 
    },
    explorer : {
      behaviour : open('explorer.js'),
      visual:{
          shape:'circle',
          width:7,
          height:7,
          fill: {
            color:'green',
            opacity: 0.0
          }
      }    
    },
    notifier : {
      behaviour : open('notify.js'),
      visual:{
          shape:'circle',
          width:7,
          height:7,
          x:3,
          y:3,
          fill: {
            color:'yellow',
            opacity: 0.0
          }
      }    
    }
  },
  resources : {
  
  },
  // optional patch field visuals - can be missing 
  // default patch world visual: frame boundary around world with lattice
  patches : {
    nodefault : {
      parameters : {},
      visual : {
        shape : 'rect',
        line : {
            width:0,
            color:'#bbb'
        },
        fill: {
            color:'white',
            opacity: 0.0
        }
      }
    }
  },

  nodes: {
    world: function (x,y) {
        var phy={type:'physical',
                 ip:'*',
                 to:model.parameter.ip+':'+model.parameter.ipport,
                 proto:model.parameter.proto};
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
          ports : {
            phy:phy
          }
        }
    },
    twin : function (x,y,id) {
        return {
          id:id,
          x:x, // patch position
          y:y,
          ports: {
            wlan : {
              type:'multicast',
              status: function (nodes) {
                // Filter out nodes, e.g., beacons only?
                return nodes;
              },
              visual: {
                shape:'circle',
                width:  20,
                height: 20,
                line: {
                  color: 'grey'
                }
              }
            }
          },
          
          visual : {
            shape:'rect',
            width:10,
            height:10,
            line : {
              width:0,
            },
            fill: {
              color:'yellow',
              opacity: 0.5
            }
          }
        }      
    }
  },
  
  dialogs : {
    dialog1 : [
      {question:'Who are you? Do you think you are poor or rich?',
        choices:['Poor','Rich','Do not know'], tag:'class'},
      {question:'How do you rate your relation to people of your own group $1? Do you like (1) or dislike (-1) them?',choices:['-1','0','1'], 
        eval:function (dialog) { return [dialog[0].answer]}, 
        cond:function (dialog) { return dialog[0].answer!='Do not know'},tag:'attitudeP'},
      {question:'How do you rate your relation to people of the other group $1? Do you like (1) or dislike (-1) them?',choices:['-1','0','1'],
        eval:function (dialog) { return [dialog[0].answer=='Poor'?'Rich':'Poor']}, 
        cond:function (dialog) { return dialog[0].answer!='Do not know'},tag:'attitudeN'},
      {question:'Do you have $1 friends?',choices:['Yes','No'],
        eval:function (dialog) { return [dialog[0].answer=='Poor'?'Rich':'Poor']}, 
        cond:function (dialog) { return dialog[0].answer!='Do not know' },tag:'friendsN'},
      {question:'How old are you?',tag:'age'},
      {question:'What is your monthly salary?', 
        choices :['<1000','1000-3000','3000-5000','>5000'],tag:'salery'},
      {question:'Where do you live [Enter ZIP Code]?',
        value:function () { var l = info('node'); l=l.location && l.location.geo; 
                            return l && l.city?l.city:'Koblenz'},tag:'location'},
      {question:'How many social contacts do you have?',tag:'contacts'},
      {question:'Do you like to move?',choices:['Yes','Maybe','No'],tag:'mobility'},
      {message:'Thank you!'}
    ]
  },

  parameter : {
    ip:'localhost',
    ipport:10003,
    proto:'tcp',
    phy:true,
    frac : { a:100, b:100, twins: 800 },
    default : {
      sodista  : 5,
      modista  : 5,
      // sorelat  : {aa:-1,ab:1,ba:1,bb:-1}, 
      // sorelat  : {aa:1,ab:-1,ba:-1,bb:1},
      sorelat  : {aa:1,ab:-1,ba:-1,bb:-1},
      somobil  : 1.0,
      moka     : 1.0,
    },
    streets : {
    },
    // Fake answers on survey dialogs
    fake :  [
      {
        class:'Poor',
        attitudeP:1,
        attitudeN:-1,
        friendsN:'Yes',
        contacts:12,
        age: function () { return random(23,57) },
        mobility:'Yes'
      },
      {
        class:'Rich',
        attitudeP:1,
        attitudeN:1,
        friendsN:'Yes',
        contacts:32,
        age: function () { return random(43,77) },
        mobility:'Yes'
      },
      {
        class:'Poor',
        attitudeP:0,
        attitudeN:0,
        friendsN:'No',
        contacts:8,
        age: function () { return random(25,40) },
        mobility:'Maybe'
      },
      {
        class:'Rich',
        attitudeP:0,
        attitudeN:0,
        friendsN:'Yes',
        contacts:20,
        age: function () { return random(20,50) },
        mobility:'Yes'
      },
      {
        class:'Rich',
        attitudeP:1,
        attitudeN:-1,
        friendsN:'Yes',
        contacts:42,
        age: function () { return random(30,67) },
        mobility:'Yes'
      },
    ]

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
    map : function () {
      return [
          model.nodes.world(52,52),  // graphical position    
      ]
    },
    // resources
    resources : function () {
      var i,j,x,y;
      function makeStreet(id,x,y,w,h) {
        return {
          id:id,
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
      // construct street map
      var streets=[];
      i=1;
      for(y=3;y<model.world.patchgrid.rows-5;y+=7,i++) {
        model.parameter.streets['street'+i] = [
            20,y*10,(model.world.patchgrid.cols-4)*10,30
        ]
        i++;
        if (y<model.world.patchgrid.rows-10) 
          for(x=3;x<model.world.patchgrid.cols-5;x+=10,i++) {
            model.parameter.streets['street'+i] = [
              x*10,(y+3)*10,30,40
            ]
          }
      }
      // construct
      for(var p in model.parameter.streets) {
        var coord = model.parameter.streets[p];
        streets.push(makeStreet(p,coord[0],coord[1],coord[2],coord[3]))
      }
      return streets;
    },
    patchgrid : {
      rows : 100,
      cols : 100,
      width : 10, // geometrical width and height of patch in pixels
      height : 10,
      floating : true,  // physical agents are tuples <logical node, behavioural agent>
    }
  }
}
