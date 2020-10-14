// World agent controlling the simulation and collection monitoring data
function (options) {  
  this.input = '/tmp/crowd.sql';
  this.output = '/tmp/results.sql';
  this.steps = 0;
  this.idle = 0;
  this.start = 0;
  this.stop = 0;
  this.delay=1;
  this.dialogs = [];
  this.survey = [];
  this.twins = [];
  this.moreTwins = false;
  this.lastSurvey = 0;
  
  this.modelSim;
  this.modelDefault = {
    sodista  : 3,
    // sorelat  : {aa:-1,ab:1,ba:1,bb:-1}, 
    sorelat  : {aa:1,ab:-1,ba:-1,bb:1},
    somobil  : 1.0,
  }
  this.parameter = null;
  this.patchgrid = null;
  
  this.options = options||{};
  
  this.verbose=options.verbose;
  
  // Analyze answers of a survey dialog
  this.survey2model = function (dialog) {
    var descriptor={sorelat:{aa:0,ab:0,ba:0,bb:0}};
    iter(dialog,function (question) {
      switch (question.tag) {
        case 'class':
          if (question.answer == 'Poor') descriptor.class='a';
          if (question.answer == 'Rich') descriptor.class='b';
          break;
        case 'attitudeP':
          if (question.answer == '*') return;
          if (descriptor.class == 'a') descriptor.sorelat.aa=Number(question.answer);
          if (descriptor.class == 'b') descriptor.sorelat.bb=Number(question.answer);
          break;
        case 'attitudeN':
          if (question.answer == '*') return;
          if (descriptor.class == 'a') descriptor.sorelat.ab=Number(question.answer);
          if (descriptor.class == 'b') descriptor.sorelat.ba=Number(question.answer);
          break;
        case 'mobility':
          switch (question.answer) {
            case 'Yes': descriptor.somobil=1; break;
            case 'No': descriptor.somobil=0; break;
            case 'Maybe': descriptor.somobil=0.5; break;
          }
          break;
        case 'contacts':
          if (Number(question.answer)< 10) descriptor.sodista=2;
          else if (Number(question.answer)< 30) descriptor.sodista=3;
          else descriptor.sodista=5;
          break;
      }
    })
    return descriptor
  }
  
  // Check survey answers
  this.validSurvey = function (dialog) {
    var empty=0;
    iter(dialog,function (question) {
      if (question.answer == undefined) empty++;
    })
    return empty < (dialog.length/2)
  }
  
  // typeof @coord = [x,y,w,h]
  this.within = function (x,y,coord) {
    return  x >= coord[0] && 
            y >= coord[1] && 
            x < (coord[0]+coord[2]) &&
            y < (coord[1]+coord[3])
  }
  
  this.act = {
    init: function () {
      var self=this,
          i,j;
      if (this.verbose) log('Starting with level '+privilege());

      this.modelSim = simu.model();
      this.dialogs = this.modelSim.dialogs;
      this.parameter = this.modelSim.parameter;
      this.patchgrid = this.modelSim.world.patchgrid;
      this.modelDefault = net.globals().default || this.modelDefault;
      
      negotiate('CPU',10000000);
      negotiate('SCHED',100000);

      if (!options.frac)
         options.frac=net.globals().frac||{a:50,b:50,twins:5}
      
      simu.db.init(this.input,undefined,function (response) {
        log('Openend DB '+this.input+': '+response.code);
      })      
      simu.db.init(this.output,undefined,function (response) {
        log('Openend DB '+this.output+': '+response.code);
      })      
      // this.steps=simu.stop();
      // Setup patches variables
      iter(net.ask('patches','*'),function (patch) {
        patch.sogroup=0;
        iter(this.parameter.streets, function (street) {
          if (this.within(patch.x*this.patchgrid.width,
                          patch.y*this.patchgrid.height,
                          street)) patch.street=true;
        })
      })
      // Create group 'a' twins
      net.create('agents-twin',this.options.frac.a,function (o) {
        while (true) {
          var x0=random(0,self.modelSim.world.patchgrid.cols-1),
              y0=random(0,self.modelSim.world.patchgrid.rows-1);
          if (net.ask('agents-twin',[x0,y0]).length==0 && 
              net.ask('patch',[x0,y0])[0].street) { 
            net.setxy(x0,y0)
            break
          } // else log('occupied '+x+','+y)
        }
        var x1=random(0,self.modelSim.world.patchgrid.cols-1),
            y1=random(0,self.modelSim.world.patchgrid.rows-1);

        this.sogroup = 'a';
        this.sodista = self.modelDefault.sodista;
        this.modista = self.modelDefault.modista;
        this.sorelat = self.modelDefault.sorelat;
        this.somobil = self.modelDefault.somobil;
        this.moka    = self.modelDefault.moka;
        this.goto = {x:x1,y:y1}
        
        if (this.verbose) log('Now I am at '+simu.position().x+','+simu.position().y)
      })
      // Create group 'b' twins
      net.create('agents-twin',this.options.frac.b,function (o) {
        while (true) {
          var x0=random(0,self.modelSim.world.patchgrid.cols-1),
              y0=random(0,self.modelSim.world.patchgrid.rows-1);
          if (net.ask('agents-twin',[x0,y0]).length==0 && 
              net.ask('patch',[x0,y0])[0].street) { 
            net.setxy(x0,y0)
            break
          } // else log('occupied '+x+','+y)
        }
        var x1=random(0,self.modelSim.world.patchgrid.cols-1),
            y1=random(0,self.modelSim.world.patchgrid.rows-1);

        this.sogroup = 'b';
        this.sodista = self.modelDefault.sodista;
        this.modista = self.modelDefault.modista;
        this.sorelat = self.modelDefault.sorelat;
        this.somobil = self.modelDefault.somobil;
        this.moka    = self.modelDefault.moka;
        this.goto = {x:x1,y:y1}

        if (this.verbose) log('Now I am at '+simu.position().x+','+simu.position().y)
      })
    },
    
    survey : function () {
      // Start survey explorer agents ...
      // log(simu.inspect(this.modelSim.dialogs.dialog1))
      log(link(DIR.IP('%')))
      create('explorer',{dialog:this.dialogs.dialog1,fake:net.globals().fake});
      this.lastSurvey=time();
    },
    
    percept: function () {
      // Get feedback
      inp.try(10,['SURVEY',_],function (ta) {
        if (ta) {
          this.survey = concat(this.survey, map(ta,function (t) {
            return t[1]
          }))
        }
      },true)
    },
    
    process: function () {
      var self=this;
      // Evaluate surveys
      this.moreTwins=false;
      iter(this.survey, function (s) {
        this.moreTwins=this.twins.length<this.options.frac.twins;
        if (!this.validSurvey(s)) return log('survey not valid: '+simu.inspect(s));
        var para = this.survey2model(s);
        log(simu.inspect(para))
        this.twins.push(net.create('agents-twin',1,function (o) {
          // TODO: narrow area
          while (true) {
            var x=random(0,self.modelSim.world.patchgrid.cols-1),
                y=random(0,self.modelSim.world.patchgrid.rows-1);
            if (net.ask('agents-twin',[x,y]).length==0 && net.ask('patch',[x,y])[0].street) { 
              net.setxy(x,y)
              break
            } // else log('occupied '+x+','+y)
          }
          this.sogroup = para.class || random(['a','b']);
          this.sodista = para.sodista || self.modelDefault.sodista;
          this.modista = para.modista || self.modelDefault.modista;
          this.sorelat = para.sorelat || self.modelDefault.sorelat;
          this.somobil = para.somobil || self.modelDefault.somobil;
          this.moka    = para.moka    || self.modelDefault.moka;
          this.robot=true;
        }))
      });
      this.survey = [];
    },
    wait: function () {
      sleep(this.delay)
    }
  }
  this.trans = {
    init: survey,
    survey : percept,
    percept: function () {
      this.idle=0;
      return process
    },
    process: function () {
      return this.moreTwins?survey:wait
    },
    wait: function () {return percept}
  }
  this.next='init';
}
