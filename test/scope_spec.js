/* jshint globalstrict: true */ /* global Scope: false */
'use strict';
describe("Scope", function () {
    it("can be constructed and used as an object", function () {
        var scope = new Scope();
        scope.aProperty = 1;
        expect(scope.aProperty).toBe(1);
    });
    describe("digest", function () {
        var scope;
        beforeEach(function () {
            scope = new Scope();
        });
        it("calls the listener function of a watch on first $digest", function () {
            var watchFn = function () {
                return 'wat';
            };
            var listenerFn = jasmine.createSpy();
            scope.$watch(watchFn, listenerFn);
            scope.$digest();
            expect(listenerFn).toHaveBeenCalled();
        });
        it("schedules a digest in $evalAsync", function (done) {
            scope.aValue = "abc";
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$evalAsync(function (scope) {
            });

            expect(scope.counter).toBe(0);

            setTimeout(function () {
                expect(scope.counter).toBe(1);
                done();
            }, 50);
        });
        it("allows async $apply with $applyAsync", function (done) {
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.$applyAsync(function (scope) {
                scope.aValue = 'ac';
            });
            expect(scope.counter).toBe(1);

            setTimeout(function () {
                expect(scope.counter).toBe(2);
                done();
            }, 50);
        });
        it("never executes $applyAsync'ed function in the same cycle", function (done) {
            scope.aValue = [1, 2, 3];
            scope.asyncApplied = false;

            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.$applyAsync(function (scope) {
                        scope.asyncApplied = true;
                    });
                }
            );
            scope.$digest();
            expect(scope.asyncApplied).toBe(false);

            setTimeout(function () {
                expect(scope.asyncApplied).toBe(true);
                done();
            }, 50);
        });
        it("coalesces many calls to $applyAsync", function (done) {
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    scope.counter++;
                },
                function (newValue, oldValue, scope) {
                }
            );
            scope.$applyAsync(function (scope) {
                scope.aValue = 'abc';
            });
            scope.$applyAsync(function (scope) {
                scope.aValue = 'def';
            });
            setTimeout(function () {
                expect(scope.counter).toBe(2);
                done();
            }, 50);

        });
        it("cancels and flushes $applyAsync if digested first", function (done) {
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    scope.counter++;
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                }
            );

            scope.$applyAsync(function (scope) {
                scope.aValue = 'abc';
            });

            scope.$applyAsync(function (scope) {
                scope.aValue = 'def'
            });

            scope.$digest();
            expect(scope.counter).toBe(2);
            expect(scope.aValue).toEqual('def');
            setTimeout(function () {
                expect(scope.counter).toBe(2);
                done();
            }, 50);
        });
        it("runs a $$postDigest function after each digest", function () {
            scope.counter = 0;

            scope.$$postDigest(function () {
                scope.counter++;
            });

            expect(scope.counter).toBe(0);

            scope.$digest();

            expect(scope.counter).toBe(1);

            scope.$digest();
            expect(scope.counter).toBe(1);
        });
        it("does not include $$postDigest in the digest", function () {
            scope.aValue = 'original value';

            scope.$$postDigest(function () {
                scope.aValue = 'changed value';
            });
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.watchedValue = newValue;
                });
            scope.$digest();
            expect(scope.watchedValue).toBe('original value');

            scope.$digest();
            expect(scope.watchedValue).toBe('changed value');
        });
        it("catches exceptions in watch functions and continues", function () {
            scope.aValue = 'abc';
            scope.counter = 0;

            scope.$watch(function (scope) {
                    throw "error";
                },
                function () {
                });
            scope.$watch(function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                });

            scope.$digest();
            expect(scope.counter).toBe(1);
        });
        it("catches exceptions in listener function and continues ", function () {
            scope.aValue = 'abc';
            scope.counter = 0;
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    throw 'error';
                }
            );
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);
        });
        it('allows destroying a $watch during digest', function () {
            scope.aValue = 'abc';

            var watchCalls = [];

            scope.$watch(
                function (scope) {
                    watchCalls.push('first');
                    return scope.aValue;
                }
            );

            var destroyWatch = scope.$watch(
                function (scope) {
                    watchCalls.push('second');
                    destroyWatch();
                }
            );

            scope.$watch(
                function (scope) {
                    watchCalls.push('third');
                    return scope.aValue;
                }
            );
            scope.$digest();
            expect(watchCalls).toEqual(['first', 'second', 'third', 'first', 'third']);
        });
        it("allows a $watch to detroy another during digest", function () {
            scope.aValue = 'abc';
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    detroyWatch();
                }
            );

            var destroyWatch = scope.$watch(
                function (scope) {
                },
                function (newn, p, d) {

                }
            );

            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (nenw, old, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
        });
        it(" allows destroying serveral $watches during digest", function () {
            scope.aValue = 'abc';
            scope.counter = 0;

            var destroyWatch1 = scope.$watch(
                function (scope) {
                    destroyWatch1();
                    destroyWatch2();
                }
            );
            var destroyWatch2 = scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(0);
        });
    });
    describe('$watchGroup', function () {
        var scope;
        beforeEach(function () {
            scope = new Scope();
        });

        it('takes watches as an array and calls listener with arrays', function () {
            var gotNewValues, gotOldValues;

            scope.aValue = 1;

            scope.anotherValue = 2;

            scope.$watchGroup([
                    function (scope) {
                        return scope.aValue;
                    },
                    function (scope) {
                        return scope.anotherValue;
                    }
                ],
                function (newValues, oldValues, scope) {
                    gotNewValues = newValues;
                    gotOldValues = oldValues;
                });

            scope.$digest();

            expect(gotNewValues).toEqual([1, 2]);
            expect(gotOldValues).toEqual([1, 2]);
        });

        it('only calls listener once per digest', function () {
            var counter = 0;

            scope.aValue = 1;
            scope.anotherValue = 2;

            scope.$watchGroup([
                function (scope) {
                    return scope.aValue;
                },
                function (scope) {
                    return scope.anotherValue;
                }
            ], function (newValues, oldValues, scope) {
                counter++;
            });
            scope.$digest();
            expect(counter).toEqual(1);
        });
        it(" uses the same aarray of old and new values on first run", function () {
            var gotNewValues, gotOldValues;

            scope.aValue = 1;
            scope.anotherValue = 2;

            scope.$watchGroup([
                    function (scope) {
                        return scope.aValue;
                    },
                    function (scope) {
                        return scope.anotherValue;
                    }
                ],
                function (newValues, oldValues, scope) {
                    gotNewValues = newValues;
                    gotOldValues = oldValues;
                });

            scope.$digest();
            expect(gotNewValues).toBe(gotOldValues);
        });
        it('uses different arrays for old and newvalues on subsequent runs', function () {
            var gotNewValues, gotOldValues;

            scope.aValue = 1;
            scope.anotherValue = 2;

            scope.$watchGroup([
                    function (scope) {
                        return scope.aValue;
                    },
                    function (scope) {
                        return scope.anotherValue;
                    }
                ],
                function (newValues, oldValues, scope) {
                    gotNewValues = newValues;
                    gotOldValues = oldValues;
                });
            scope.$digest();

            scope.anotherValue = 3;
            scope.$digest();

            expect(gotNewValues).toEqual([1, 3]);
            expect(gotOldValues).toEqual([1, 2]);
        });
        it('calls  the listener once when the watch array is empty', function () {
            var gotNewValues, gotOldValues;

            scope.$watchGroup([], function (newValues, oldValues, scope) {
                gotNewValues = newValues;
                gotOldValues = oldValues;
            });
            scope.$digest();

            expect(gotNewValues).toEqual([]);
            expect(gotOldValues).toEqual([]);
        });
        it('can be deregisterd', function () {
            var counter = 0;

            scope.aValue = 1;
            scope.anotherValue = 2;

            var destroyGroup = scope.$watchGroup([
                function (scope) {
                    return scope.aValue;
                },
                function (scope) {
                    return scope.anotherValue;
                }
            ], function (newValues, oldValues, scope) {
                counter++;
            });

            scope.$digest();

            scope.anotherValue = 3;
            destroyGroup();
            scope.$digest();

            expect(counter).toEqual(1);
        });
        it('does not call the zero-watch listener when deregistered first', function () {
            var counter = 0;
            var destroyGroup = scope.$watchGroup([], function (newValues, oldValues, scope) {
                counter++;
            });

            destroyGroup();
            scope.$digest();

            expect(counter).toEqual(0);
        });
    });

    describe('inheritance', function () {
        it("inherits the parent's properties", function () {
            var parent = new Scope();
            parent.aValue = [1, 2, 3];

            var child = parent.$new();
            expect(child.aValue).toEqual([1, 2, 3]);
        });
        it('does not cause a parent to inherit its properties', function () {
            var parent = new Scope();

            var child = parent.$new();

            child.aValue = [1, 2, 3];

            expect(parent.aValue).toBeUndefined();

        });
        it("inherits the parent's properties whenever they are defined", function () {
            var parent = new Scope();
            var child = parent.$new();

            parent.aValue = [1, 2, 3];

            expect(child.aValue).toEqual([1, 2, 3]);
        });
        it("can manipulate a parent scope's prperty", function () {
            var parent = new Scope();
            var child = parent.$new();
            parent.aValue = [1, 2, 3];

            child.aValue.push(4);

            expect(child.aValue).toEqual([1, 2, 3, 4]);
            expect(parent.aValue).toEqual([1, 2, 3, 4]);

        });
        it("can watch a property in the parent", function () {
            var parent = new Scope();
            var child = parent.$new();
            parent.aValue = [1, 2, 3];
            child.counter = 0;

            child.$watch(function (scope) {
                return scope.aValue;
            }, function (newValue, oldValue, scope) {
                scope.counter++;
            }, true);

            child.$digest();
            expect(child.counter).toBe(1);

            parent.aValue.push(4);
            child.$digest();
            expect(child.counter).toBe(2);
        });
        it("can be nested at any depth", function () {
            var a = new Scope();
            var aa = a.$new();
            var aaa = aa.$new();
            var aab = aa.$new();
            var ab = a.$new();
            var abb = ab.$new();

            a.value = 1;

            expect(aa.value).toBe(1);
            expect(aaa.value).toBe(1);
            expect(aab.value).toBe(1);
            expect(ab.value).toBe(1);
            expect(abb.value).toBe(1);

            ab.anotherValue = 2;

            expect(abb.anotherValue).toBe(2);
            expect(aa.anotherValue).toBeUndefined();
            expect(aaa.anotherValue).toBeUndefined();
        });
        it("shadows a parent's property with the same name", function () {
            var parent = new Scope();
            var child = parent.$new();
            parent.name = 'Joe';
            child.name = 'Jill';

            expect(child.name).toBe('Jill');
            expect(parent.name).toBe('Joe');
        });
        it("does not shadow members of parent scope's attributes", function () {
            var parent = new Scope();
            var child = parent.$new();

            parent.user = {name: 'Joe'};
            child.user.name = 'Jill';

            expect(child.user.name).toBe('Jill');
            expect(parent.user.name).toBe('Jill');
        });
        it("does not digest its parent(s)", function () {
            var parent = new Scope();
            var child = parent.$new();

            parent.aValue = 'abc';
            parent.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.aValueWas = newValue;
                }
            );

            child.$digest();
            expect(child.aValueWas).toBeUndefined();
        });
        it("keeps a recocrd of its children", function () {
            var parent = new Scope();
            var child1 = parent.$new();
            var child2 = parent.$new();
            var child2_1 = child2.$new();

            expect(parent.$$children.length).toBe(2);
            expect(parent.$$children[0]).toBe(child1);
            expect(parent.$$children[1]).toBe(child2);
            expect(child1.$$children.length).toBe(0);
            expect(child2.$$children.length).toBe(1);
            expect(child2.$$children[0]).toBe(child2_1);
        });
        it("digests its children", function () {
            var parent = new Scope();
            var child = parent.$new();

            parent.aValue = 'abc';
            child.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.aValueWas = newValue;
                }
            );

            parent.$digest();
            expect(child.aValueWas).toBe('abc');
        });
        it('digests from root on $apply', function () {
            var parent = new Scope();
            var child = parent.$new();
            var child2 = child.$new();

            parent.aValue = 'abc';
            parent.counter = 0;
            parent.$watch(function (scope) {
                return scope.aValue;
            }, function (newValue, oldValue, scope) {
                scope.counter++;
            });

            child2.$apply(function (scope) {

            });
            expect(parent.counter).toBe(1);
        });
        it("schedules a digest from root on $evalAsync", function (done) {
            var parent = new Scope();
            var child = parent.$new();
            var child2 = child.$new();

            parent.aValue = 'abc';
            parent.counter = 0;
            parent.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            child2.$evalAsync(function (scope) {

            });
            setTimeout(function () {
                expect(parent.counter).toBe(1);
                done();
            }, 50);
        });
        it('cannot watch parent attributes when iolated', function () {
            var parent = new Scope();
            var child = parent.$new(true);

            parent.aValue = 'abc';
            child.$watch(function (scope) {
                return scope.aValue;
            }, function (newValue, oldValue, scope) {
                scope.aValueWas = newValue;
            });
            child.$digest();
            expect(child.aValueWas).toBeUndefined();

        });
        it('digests its isolated children', function () {
            var parent = new Scope();
            var child = parent.$new(true);
            child.aValue = 'abc';
            child.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.aValueWas = newValue;
                }
            );
            parent.$digest();
            expect(child.aValueWas).toBe('abc');
        });
        it('digests  from root on $apply when isolated', function () {
            var parent = new Scope();
            var child = parent.$new(true);
            var child2 = child.$new();

            parent.aValue = 'abc';
            parent.counter = 0;
            parent.$watch(function (scope) {
                return scope.aValue;
            }, function (newValue, oldValue, scope) {
                scope.counter++;
            });

            child2.$apply(function () {

            });

            expect(parent.counter).toBe(1);
        });
        it('schedules a digest from root on $evalAsync when isolatd', function (done) {
            var parent = new Scope();
            var child = parent.$new(true);
            var child2 = child.$new();

            parent.aValue = 'abc';
            parent.counter = 0;
            parent.$watch(function (scope) {
                return scope.aValue;
            }, function (newValue, oldValue, scope) {
                scope.counter++;
            });

            child2.$evalAsync(function(scope) { });
            setTimeout(function() { expect(parent.counter).toBe(1); done();
            }, 50);
        });
        it('executes $evalAsync functions on isolated scopes', function (done) {
            var parent = new Scope();
            var child = parent.$new(true);

            child.$evalAsync(function (scope) {
                scope.didEvalAsync = true;
            });

            setTimeout(function () {
                expect(child.didEvalAsync).toBe(true);
                done();
            })
        });
        it('executes $$postDigest function on isolated scopes', function () {
            var parent = new Scope();
            var child = parent.$new(true);

            child.$$postDigest(function () {
                child.didPostDigest = true;
            });
            parent.$digest();

            expect(child.didPostDigest).toBe(true);
        });

    })
});