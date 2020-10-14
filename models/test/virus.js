function virus() {

    this.primes = [2, 3];
    this.i = 4;
    this.t1 = null;
    this.t2 = null;

    let p = [];

    this.path = ['gujamoqa', 'kavicewa', 'kavezoko'];

    this.act = {
        init: function () {
            let self = this;
            self.t1 = clock(true);
        },
        calPrime: function () {
            let self = this,
                i = 4,
                ps = [2, 3];
            self.t1 = clock(true);
            while (i < 1000) {
                let sqrt = Math.sqrt(i),
                    k = 0,
                    c = true;
                while (k < ps.length) {
                    if (ps[k] > sqrt) break;
                    c = c && i % ps[k] !== 0;
                    k++;
                }
                if (c) ps.push(i);
                i++;
            }
            self.t2 = clock(true);
            self.primes = ps;

        },
        calPrimeIterate: function () {
            let self = this,
                sqrt = Math.sqrt(self.i),
                k = 0,
                c = true;
            while (k < self.primes.length) {
                if (self.primes[k] > sqrt) break;
                c = c && self.i % self.primes[k] !== 0;
                k++;
            }
            if (c) self.primes.push(self.i);
            self.i++;
        },
        logPrime: function () {
            let self = this;
            self.t2 = clock(true);
            log(self.t2 - self.t1);
        },
        moveToTarget: function () {
            let self = this;
            if (myNode() !== self.path[self.path.length - 1]) {
                moveto(DIR.NODE(self.path[self.path.indexOf(myNode()) + 1]));
            }
        },
        moveToMe: function () {
            let self = this;
            if (myNode() !== self.path[0]) {
                moveto(DIR.NODE(self.path[self.path.indexOf(myNode()) - 1]));
            }
        },
        logSuccess: function () {
            let self = this;
            log('Wert wurde berechnet in ' +  (self.t2 - self.t1) + 'ms');
        },
        fini: function () {
            kill();
        }
    };

    this.trans = {
        init: moveToTarget,
        moveToTarget: function () {
            return myNode() !== this.path[this.path.length - 1] ? moveToTarget : calPrimeIterate;
        },
        calPrimeIterate: function () {
            return this.i < 20000 ? calPrimeIterate : logPrime;
        },
        calPrime: logPrime,
        logPrime: moveToMe,
        moveToMe: function () {
            return myNode() !== this.path[0] ? moveToMe : fini;
        },
    };

    this.next = 'init';


}