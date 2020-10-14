function twin () {
  this.model = null;

  this.goto={}
    
  // Sakoda model parameters
  this.sogroup = '?'
  this.sodista = 1
  this.sorelat = null
  this.somobil = 1

  this.modista = 3
  this.moka    = 1
  
  this.robot = false;
  
  // notify agent sent to neighbouring nodes
  this.connects = []
  this.notified = []
  
  // Perception / sensors 
  this.places = []
  this.togo = []
  this.togoBestSocial = null
  this.togoBestMobile = null
  this.here = 0;
  this.position = null;
  this.force = 0;   // attraction of / distance to destination
  
  this.verbose = 0;
  
  // Utility functions
  this.getso = function (x,y) {
    return this.sorelat[x+y];
  }
    
  this.veclength = function (v) {
    return Math.sqrt(Math.pow(v.x,2)+
                     Math.pow(v.y,2));
  }
  
  this.soexpec = function (places,root) {
    var v=0,place,i,j,k,s,dp,dist;
    for(j=-this.sodista+root.y;j<=(this.sodista+root.y);j++)
      for(i=-this.sodista+root.x;i<=(this.sodista+root.x);i++) {
        if (i==0 && j==0) continue;
        place=places[j] && places[j][i];
        if (!place) continue;
        dist=Math.sqrt(Math.pow(i-root.x,2)+
                       Math.pow(j-root.y,2));
        k=1/dist;
        s=this.sorelat[this.sogroup+place] 
        if (s) v += s*k;
      } 
    return v;
  }
  
  this.moexpec = function (place2) {
    var dist0,dist1,place0,place1;
    place0=this.position;
    place1=this.goto;
    if (Math.abs(place2.x) > this.modista || 
        Math.abs(place2.y) > this.modista) return 0;
    dist0=Math.sqrt(Math.pow(place0.x-place1.x,2)+
                    Math.pow(place0.y-place1.y,2));
    dist1=Math.sqrt(Math.pow(place0.x+place2.x-place1.x,2)+
                    Math.pow(place0.y+place2.y-place1.y,2));
    return (dist0-dist1)*this.moka/4*this.force;    
  }
  
  this.color = function () {
      var diff;
      switch (this.sogroup) {
        case 'a':
          if (!this.robot) return 'blue';
          diff=Math.abs(this.model.sorelat.aa-this.sorelat.aa)+
               Math.abs(this.model.sorelat.ab-this.sorelat.ab)
          switch (diff) {
            case 0:   return 'blue'; break;
            default:  return 'green'; break;
          }
          break;
        case 'b':
          if (!this.robot) return 'red';
          diff=Math.abs(this.model.sorelat.bb-this.sorelat.bb)+
               Math.abs(this.model.sorelat.ba-this.sorelat.ba)
          switch (diff) {
            case 0:   return 'red'; break;
            default:  return 'orange'; break;
          }
          break;
      }    
  }
  this.act = {
    init : function () {
      if (this.verbose) log('I am a physical agent on my own mobile node '+myNode());

      this.model = net.globals().default;
      
      if (this.robot) net.set('shape','triangle')
      net.set('color',this.color());
      this.position = simu.position();
      net.ask('patch',[this.position.x,this.position.y], function (place) {
        place.sogroup=this.sogroup; 
      })      
    },
    percept : function () {
      var i,j,d,p,self=this,patches,patch,place;
      if (this.verbose)  log('Percepting');
      this.position = simu.position();
      this.connects=link(DIR.PATH('*'));

      this.force = this.veclength(delta(this.position,this.goto));
      
      patches=net.ask('patches',this.sodista*2);

      this.places={};
      for(p in patches) {
        patch=patches[p];
        if (!patch.street) continue;
        d=delta({x:patch.x,y:patch.y},this.position);
        if (zero(d)) continue;
        if (!this.places[d.y]) this.places[d.y]={};
        this.places[d.y][d.x] = patch.sogroup;
      };
      
            
      this.here = this.soexpec(this.places,{x:0,y:0});
      this.togo = [];
      
      for(j=-this.sodista;j<=this.sodista;j++)
        for(i=-this.sodista;i<=this.sodista;i++) {
          if (i==0 && j==0) continue;
          place=this.places[j] && this.places[j][i];
          
          if (place == 0) {
            this.togo.push({
              x:i,
              y:j,
              here:this.soexpec(this.places,{x:i,y:j}),
              next:this.moexpec({x:i,y:j})
            })
          }
        }
      // Find the most attractive places to move on
      this.togoBestSocial=this.togo[0];
      this.togoBestMobile=this.togo[0];
      for(p in this.togo) {
        if (this.togo[p].here > this.togoBestSocial.here)
          this.togoBestSocial=this.togo[p];
        if (this.togo[p].next > this.togoBestMobile.next)
          this.togoBestMobile=this.togo[p];
      }
    },

    process : function () {
      iter(this.connects, function (node) {
        if (!isin(this.notified,node)) {
          this.notified.push(node);
          create('notifier',{
            dest:node
          },2);
        }
      })    
    },
    
    wait : function () {
      sleep(10)
    },
    
    migrate : function () {
      var set,place1=this.togoBestSocial,place2=this.togoBestMobile,place;
      if (place1 && place2 && place2.next > place1.here) 
        place=place2;
      else if (place1.here > this.here)
        place=place1;
         
      if (place) {
        // log('Candidate: '+simu.inspect(place))
        // check again that the place is free
        set=net.ask('agents-twin',[this.position.x+place.x,
                                   this.position.y+place.y]);
        if (set.length==0) {
          net.ask('patch',[this.position.x,this.position.y], function (place) {
            place.sogroup=0;
          })
          net.setxy(this.position.x+place.x,
                    this.position.y+place.y); 
          this.position = simu.position();
          net.ask('patch',[this.position.x,this.position.y], function (place) {
            place.sogroup=this.sogroup; 
          })
        } // else log('no go')
      }
    }
  }
  this.trans = {
    init : percept,
    percept : process,
    process : wait,
    wait: migrate,
    migrate: percept,
  }
  this.next = init
}
