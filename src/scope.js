'use strict';

function Scope() {
    this.$$watchers = [];
<<<<<<< 81a891c0bc572564580e2a9358cc185a9c22e0b5
}
function initWatchVal() {
}
Scope.prototype.$watch = function (watchFn, listenerFn) {
=======
    this.$$lastDirtyWatch = null;
    this.$$asyncQueue = [];
    this.$$phase = null;
}
function initWatchVal() {
}
Scope.prototype.$beginPhase = function (phase) {
    if (this.$$phase) {
        throw this.$$phae + ' already in progress.';
    }
    this.$$phase = phase;
};
Scope.prototype.$clearPhase = function () {
    this.$$phase = null;
};
Scope.prototype.$watch = function (watchFn, listenerFn, valueEq) {
>>>>>>> Chapter 1: Scope
    var watcher = {
        watchFn: watchFn,
        listenerFn: listenerFn || function () {
        },
<<<<<<< 81a891c0bc572564580e2a9358cc185a9c22e0b5
=======
        valueEq: !!valueEq,
>>>>>>> Chapter 1: Scope
        last: initWatchVal
    };

    this.$$watchers.push(watcher);
<<<<<<< 81a891c0bc572564580e2a9358cc185a9c22e0b5
};
Scope.prototype.$digest = function() {
    var ttl = 10;
    var dirty;
    do {
        dirty = this.$$digestOnce();
        if (dirty && !(--ttl)) {
            throw "10 digest iterations reached";
        }
    } while (dirty);
=======
    this.$$lastDirtyWatch = null;
};
Scope.prototype.$digest = function () {
    var ttl = 10;
    var dirty;
    this.$$lastDirtyWatch = null;
    this.$beginPhase('$digest');
    do {
        while (this.$$asyncQueue.length) {
            var asyncTask = this.$$asyncQueue.shift();
            asyncTask.scope.$eval(asyncTask.expression)
        }
        dirty = this.$$digestOnce();
        if ((dirty || this.$$asyncQueue.length) && !(--ttl)) {
            this.$clearPhase();
            throw "10 digest iterations reached";
        }
    } while (dirty || this.$$asyncQueue.length)
    this.$clearPhase();
>>>>>>> Chapter 1: Scope
};
Scope.prototype.$$digestOnce = function () {
    var self = this;
    var newValue, oldValue, dirty;
    _.forEach(this.$$watchers, function (watcher) {
        newValue = watcher.watchFn(self);
        oldValue = watcher.last;
<<<<<<< 81a891c0bc572564580e2a9358cc185a9c22e0b5
        if (newValue !== oldValue) {
            watcher.last = newValue;
            watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), self);
            dirty = true;
        }
    });
    return dirty;
=======
        if (!self.$$areEqual(newValue, oldValue, watcher.valueEq)) {
            self.$$lastDirtyWatch = watcher;
            watcher.last = (watcher.valueEq ? _.cloneDeep(newValue) : newValue);
            watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), self);
            dirty = true;
        } else if (self.$$lastDirtyWatch === watcher) {
            return false;
        }
    });
    return dirty;
};

Scope.prototype.$$areEqual = function (newValue, oldValue, valueEq) {
    if (valueEq) {
        return _.isEqual(newValue, oldValue);
    } else {
        return newValue === oldValue || (typeof newValue === 'number' &&
            typeof oldValue === 'number' && isNaN(newValue) && isNaN(oldValue));
    }
};
Scope.prototype.$eval = function (expr, locals) {
    return expr(this, locals);
};
Scope.prototype.$apply = function (expr) {
    try {
        this.$beginPhase('$apply');
        return this.$eval(expr);
    } finally {
        this.$clearPhase();
        this.$digest();
    }
};
Scope.prototype.$evalAsync = function (expr) {
    this.$$asyncQueue.push({scope: this, expression: expr});
>>>>>>> Chapter 1: Scope
};