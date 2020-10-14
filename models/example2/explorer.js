function explorer(options) {
  this.dir=null;
  this.origin=null;
  this.connects=[];
  this.visited=[];
  this.path=[];
  this.path0=[];
  this.node=null;
  this.goback=false;
  this.index=-1;
  this.verbose = options.verbose||0;
  this.fake = options.fake || false;
  
  // {text:string }
  // {question:string,answer?:string|undefined, type?:'number'|'text', default?:number|string, value?:number|string}
  // {question:string,answer?:string|undefined, type?:'number'|'text', choices:(string|number|{text,value}) []}
  this.dialog=options.dialog||[{question:'Do you know what I should ask you?',default:'Any Question'}];
  this.action=options.action||function () {};
  
  this.act = {
    init:function () {
      this.origin=this.node=myNode();
      this.path=[this.origin];
      this.visited=[this.origin];
      if (this.verbose) log('Explorer starting on '+this.origin+'['+info('host').type+'] privilege'+privilege());
      log('Explorer is '+(this.fake?'a fake':'exploring.'))
      // out(['MESSAGE',me(),'Greetings from '+this.origin]);
    },
    wait:function () { 
      var newconnects=[],next;
      this.connects=link(DIR.IP('%'));
      newconnects=filter(this.connects,function (node) {
        return !isin(this.visited,node)
      });
      if (newconnects) next=random(newconnects);
      if (newconnects && this.verbose) log ('New connects: ',newconnects,next);
      if (next!=null) this.dir=DIR.NODE(next);
      if (this.dir==null) sleep(1000);
    },
    travel: function () {
      this.path.push(this.dir.node);
      log('Travelling to '+DIR.print(this.dir));
      moveto(this.dir)
    },
    route: function () {
      this.dir=null;
      this.node=myNode();
      if (this.verbose) log('Route: Visiting '+this.node+'['+info('host').type+'] CHAT? '+test(['CHAT']));
      if (!test(['CHAT'])) { 
        // Go on searching chat bot node ...
        var newconnects=[],next;
        this.connects=link(DIR.IP('%'));
        newconnects=filter(this.connects,function (node) {
          return !isin(this.visited,node) && !isin(this.path,node)
        });
        if (newconnects) next=random(newconnects);
        if (this.verbose) log ('New connects: ',newconnects,next);
        if (next!=null) this.dir=DIR.NODE(next);
        else { this.path0=reverse(this.path); this.path.pop(); this.goback=true; }  
      }
    },
    goback: function () {
      var next = this.path.pop();
      this.index=-1;
      if (next == null) this.goback=false;
      else {
        if (this.verbose) log('Going back to '+this.origin+' from '+this.node+ ' via '+next);
        moveto(DIR.NODE(next)) 
      }
    },
    
    explore: function () {
      var todo;
      // Arrival on destination or source node (after goback)
      this.node=myNode();
      if (this.verbose) log('Explore: I am arrived on '+this.node+'['+info('host').type+'] privilege '+privilege());
      if (test(['CHAT'])) {
        if (this.verbose) log('I am on target. Path to destination: ',this.path);
        log(info('node').location)
        // Start dialog iteration
        this.index=0;
        // prepare way back
        this.path0=reverse(this.path); 
        this.path.pop();
        this.goback=true;
      } else {
        // I am back
        // Any new information from destination?
        log('I am back. Path from destination: ',this.path0);
        iter(this.dialog,function (dialog) {
          if (this.verbose) log(dialog.question+'? '+dialog.answer);
        });
        out(['SURVEY',this.dialog]);
      }
    },
    
    deliver : function () {
      var sample;
      // Deliver answers
      if (this.fake) {
        sample=random(this.fake);
        iter(sample,function (v,tag) {
          iter(this.dialog,function (q) {
            if (q.tag == tag) q.answer=v;
          })
        })
        // log(simu.inspect(this.dialog))
        out(['SURVEY',this.dialog]);
      } else {
      
      }
    },
    
    // Chat Bot Dialog Manager 
    ask: function () {
      var tmo=30000,res,regex;
      var dialog=this.dialog[this.index],action={};
      if (this.index>0 && !this.dialog[this.index-1].answer) return this.index=-1;
      this.index++;
      if (dialog.text || dialog.message) out(['MESSAGE',me(),dialog.text||dialog.message]);
      else {
        // Conditional evaluation?
        if (dialog.cond) {
          if (!dialog.cond.call(this,this.dialog)) return dialog.answer='*';
        } 
        // Evaluate dialog question text?
        if (dialog.eval) {
          res=dialog.eval.call(this,this.dialog);
          if (res) iter(res,function (v,i) {
            regex = new RegExp('\\$'+(i+1),'g')
            log(v,i+1)
            log(dialog.question.replace(regex,v))
            dialog.question=dialog.question.replace(regex,v);
          });
        }
        if (this.verbose) log('Asking: '+dialog.question);
        if (dialog.choices) action.choices=dialog.choices;
        if (dialog.default)
          action.default=(typeof dialog.default == 'function'?
                             dialog.default.call(this):
                             dialog.default);
        if (dialog.value)
          action.value=(typeof dialog.value == 'function'?
                             dialog.value.call(this):
                             dialog.value);
        
        out(['QUESTION',me(),dialog.question,action]);
        inp.try(tmo,['ANSWER',me(),dialog.question,_],function (t){
          if (t) {
            if (this.verbose) log('Answer: ',t[3]);
            dialog.answer=t[3];
          }
        });
      }
    },
    
    end: function () {
      if (this.verbose) log('Explorer terminates.');
      kill();
    } 
  }
  this.trans = {
    init:     function () { return this.fake?deliver:wait },
    wait:     function () { return this.dir!=null?travel:wait },
    travel :  route,
    goback:   function () { return this.goback?goback:explore },
    route:    function () { if (this.goback) return goback; else; return this.dir!=null?travel:explore },
    explore:  function () { return this.index==-1?end:ask },
    ask:      function () { log('ask?'); return this.dialog[this.index]?ask:goback },
    deliver:  end
  }
  this.on = {
  
  }
  this.next=init;
}
