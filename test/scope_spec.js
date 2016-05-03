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

            child2.$evalAsync(function (scope) {
            });
            setTimeout(function () {
                expect(parent.counter).toBe(1);
                done();
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
        it('can take some other scope as the parent', function () {
            var prototyeParent = new Scope();
            var hierarchyParent = new Scope();
            var child = prototyeParent.$new(false, hierarchyParent);

            prototyeParent.a = 42;
            expect(child.a).toBe(42);

            child.counter = 0;
            child.$watch(function (scope) {
                scope.counter++;
            });

            prototyeParent.$digest();
            expect(child.counter).toBe(0);

            hierarchyParent.$digest();
            expect(child.counter).toBe(2);
        });
        it('is no longer digested when $destroy has been called', function () {
            var parent = new Scope();
            var child = parent.$new();

            child.aValue = [1, 2, 3];
            child.counter = 0;
            child.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                },
                true
            );
            parent.$digest();
            expect(child.counter).toBe(1);

            child.aValue.push(4);
            parent.$digest();
            expect(child.counter).toBe(2);

            child.$destroy();
            child.aValue.push(5);
            parent.$digest();
            expect(child.counter).toBe(2);
        });
    });
    describe('$watchCollection', function () {
        var scope;

        beforeEach(function () {
            scope = new Scope();
        });
        it('works like a normal watch for non-collections', function () {
            var valueProvided;

            scope.avalue = 42;
            scope.counter = 0;

            scope.$watchCollection(
                function (scope) {
                    return scope.avalue;
                },
                function (newValue, oldVlaue, scope) {
                    valueProvided = newValue;
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            expect(valueProvided).toBe(scope.avalue);
            scope.avalue = 43;
            scope.$digest();
            expect(scope.counter).toBe(2);

            scope.$digest();
            expect(scope.counter).toBe(2);
        });
        it('works like a normal watch for NaNs', function () {
            scope.aValue = 0 / 0;
            scope.counter = 0;
            scope.$watchCollection(function (scope) {
                return scope.aValue;
            }, function (newValue, oldValue, scope) {
                scope.counter++;
            });
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.$digest();
            expect(scope.counter).toBe(1);
        });
        it('notices when the value becomes an array', function () {
            scope.counter = 0;
            scope.$watchCollection(
                function (scope) {
                    return scope.arr;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.arr = [1, 2, 3];
            scope.$digest();
            expect(scope.counter).toBe(2);

            scope.$digest();
            expect(scope.counter).toBe(2);
        });
        it('notices an item added  to an array', function () {
            scope.arr = [1, 2, 3];
            scope.counter = 0;

            scope.$watchCollection(
                function (scopce) {
                    return scope.arr;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.arr.push(4);
            scope.$digest();
            expect(scope.counter).toBe(2);

            scope.$digest();
            expect(scope.counter).toBe(2);
        });
        it('notices an item replaced in an array', function () {
            scope.arr = [1, 2, 3];
            scope.counter = 0;
            scope.$watchCollection(
                function (scope) {
                    return scope.arr;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.arr[1] = 42;
            scope.$digest();
            expect(scope.counter).toBe(2);

            scope.$digest();
            expect(scope.counter).toBe(2);
        });
        it("notices items reordered in an array", function () {
            scope.arr = [2, 1, 3];
            scope.counter = 0;

            scope.$watchCollection(
                function (scope) {
                    return scope.arr;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.arr.sort();
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });
        it('does not fail on NaNs in arrays', function () {
            scope.arr = [2, NaN, 3];
            scope.counter = 0;

            scope.$watchCollection(
                function (scope) {
                    return scope.arr;
                }, function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);
        });
        it('notices an item replaced in an arguments object', function () {
            (function () {
                scope.arrayLike = arguments
            })(1, 2, 3);

            scope.counter = 0;
            scope.$watchCollection(
                function (scope) {
                    return scope.arrayLike;
                }, function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.arrayLike[1] = 42;
            scope.$digest();
            expect(scope.counter).toBe(2);

            scope.$digest();
            expect(scope.counter).toBe(2);
        });
        it('notices an item replaced in NodeList object', function () {
            document.documentElement.appendChild(document.createElement(('div')));
            scope.arrayLike = document.getElementsByTagName('div');

            scope.counter = 0;

            scope.$watchCollection(
                function (scope) {
                    return scope.arrayLike;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                });

            scope.$digest();
            expect(scope.counter).toBe(1);

            document.documentElement.appendChild(document.createElement('div'));
            scope.$digest();
            expect(scope.counter).toBe(2);

            scope.$digest();
            expect(scope.counter).toBe(2);
        });
        it('notices when the value becomes an object', function () {
            scope.counter = 0;
            scope.$watchCollection(
                function (scope) {
                    return scope.obj;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.obj = {a: 1};
            scope.$digest();
            expect(scope.counter).toBe(2);

            scope.$digest();
            expect(scope.counter).toBe(2);
        });
        it('notices when an attribute is added to an object', function () {
            scope.counter = 0;
            scope.obj = {a: 1};
            scope.$watchCollection(
                function (scope) {
                    return scope.obj;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.obj.b = 2;
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });
        it("notices when an attribute is changed in an object", function () {
            scope.counter = 0;
            scope.obj = {a: 1};
            scope.$watchCollection(
                function (scope) {
                    return scope.obj;
                }, function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.obj.a = 2;
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it("does not fail on NaN attributes in objects", function () {
            scope.counter = 0;
            scope.obj = {a: NaN};
            scope.$watchCollection(
                function (scope) {
                    return scope.obj;
                }, function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
        });
        it('notices when an attribute is removed from an object', function () {
            scope.counter = 0;
            scope.obj = {a: 1};

            scope.$watchCollection(
                function (scope) {
                    return scope.obj;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);

            delete scope.obj.a;
            scope.$digest();
            expect(scope.counter).toBe(2);

            scope.$digest();
            expect(scope.counter).toBe(2);
        });
        it('does not consider any object with a length property an array', function () {
            scope.obj = {length: 42, otherKey: 'abc'};
            scope.counter = 0;

            scope.$watchCollection(
                function (scope) {
                    return scope.obj;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();

            scope.obj.newKey = 'def';
            scope.$digest();

            expect(scope.counter).toBe(2);
        });

        it("gives the old non-collection value to listeners", function () {
            scope.aValue = 42;
            var oldValueGiven;
            scope.$watchCollection(
                function (scope) {
                    return scope.aValue;
                }, function (newValue, oldValue, scope) {
                    oldValueGiven = oldValue;
                }
            );
            scope.$digest();
            scope.aValue = 43;
            scope.$digest();
            expect(oldValueGiven).toBe(42);
        });
        it("gives the old array value to listeners", function () {
            scope.aValue = [1, 2, 3];
            var oldValueGiven;
            scope.$watchCollection(
                function (scope) {
                    return scope.aValue;
                }, function (newValue, oldValue, scope) {
                    oldValueGiven = oldValue;
                }
            );
            scope.$digest();
            scope.aValue.push(4);
            scope.$digest();
            expect(oldValueGiven).toEqual([1, 2, 3]);
        });
        it("gives the old object value to listeners", function () {
            scope.aValue = {a: 1, b: 2};
            var oldValueGiven;
            scope.$watchCollection(
                function (scope) {
                    return scope.aValue;
                }, function (newValue, oldValue, scope) {
                    oldValueGiven = oldValue;
                }
            );
            scope.$digest();
            scope.aValue.c = 3;
            scope.$digest();
            expect(oldValueGiven).toEqual({a: 1, b: 2});
        });
        it("uses the new value as the old value on first digest", function () {
            scope.aValue = {a: 1, b: 2};
            var oldValueGiven;
            scope.$watchCollection(
                function (scope) {
                    return scope.aValue;
                }, function (newValue, oldValue, scope) {
                    oldValueGiven = oldValue;
                }
            );
            scope.$digest();
            expect(oldValueGiven).toEqual({a: 1, b: 2});
        });
    });
    describe('Events', function () {
        var parent;
        var scope;
        var child;
        var isolatedChild;

        beforeEach(function () {
            parent = new Scope();
            scope = parent.$new();
            child = scope.$new();
            isolatedChild = scope.$new(true);
        });

        it('allows registering listeners', function () {
            var listener1 = function () {

            };
            var listener2 = function () {

            };
            var listener3 = function () {

            };
            scope.$on('someEvent', listener1);
            scope.$on('someEvent', listener2);
            scope.$on('someOtherEvent', listener3);

            expect(scope.$$listeners).toEqual({
                someEvent: [listener1, listener2],
                someOtherEvent: [listener3]
            });

        });
        it('registers different listeners for every scope', function () {
            var listener1 = function () {

            };
            var listener2 = function () {

            };
            var listener3 = function () {

            };

            scope.$on('someEvent', listener1);
            child.$on('someEvent', listener2);
            isolatedChild.$on('someEvent', listener3);

            expect(scope.$$listeners).toEqual({someEvent: [listener1]});
            expect(child.$$listeners).toEqual({someEvent: [listener2]});
            expect(isolatedChild.$$listeners).toEqual({someEvent: [listener3]});
        });
        it('calls the listeners of the matching event on $emit', function () {
            var listener1 = jasmine.createSpy();
            var listener2 = jasmine.createSpy();

            scope.$on('someEvent', listener1);
            scope.$on('someOtherEvent', listener2);

            scope.$emit('someEvent');

            expect(listener1).toHaveBeenCalled();
            expect(listener2).not.toHaveBeenCalled();
        });
        it("calls the listeners of the matching event on $broadcast", function () {
            var listener1 = jasmine.createSpy();
            var listener2 = jasmine.createSpy();

            scope.$on('someEvent', listener1);
            scope.$on('someOtherEvent', listener2);
            scope.$broadcast('someEvent');
            expect(listener1).toHaveBeenCalled();
            expect(listener2).not.toHaveBeenCalled();
        });
        _.forEach(['$emit', '$broadcast'], function (method) {
            it("calls listeners registered for matching events on " + method, function () {
                var listener1 = jasmine.createSpy();
                var listener2 = jasmine.createSpy();
                scope.$on('someEvent', listener1);
                scope.$on('someOtherEvent', listener2);
                scope[method]('someEvent');
                expect(listener1).toHaveBeenCalled();
                expect(listener2).not.toHaveBeenCalled();
            });
            it('passes an event object with a name to listeners on' + method, function () {
                var listener = jasmine.createSpy();
                scope.$on('someEvent', listener);

                scope[method]('someEvent');

                expect(listener).toHaveBeenCalled();
                expect(listener.calls.mostRecent().args[0].name).toEqual('someEvent');
            });
            it('passes the same event object to each listener on' + method, function () {
                var listener1 = jasmine.createSpy();
                var listener2 = jasmine.createSpy();
                scope.$on('someEvent', listener1);
                scope.$on('someEvent', listener2);

                scope[method]('someEvent');

                var event1 = listener1.calls.mostRecent().args[0];
                var event2 = listener1.calls.mostRecent().args[0];

                expect(event1).toBe(event2);
            });
            it('passes additional arguments to listeners on' + method, function () {
                var listener = jasmine.createSpy();
                scope.$on('someEvent', listener);

                scope[method]('someEvent', 'and', ['additional', 'arguments'], '...');

                expect(listener.calls.mostRecent().args[1]).toEqual('and');
                expect(listener.calls.mostRecent().args[2]).toEqual(['additional', 'arguments']);
                expect(listener.calls.mostRecent().args[3]).toEqual('...');
            });
            it('returns the event object on' + method, function () {
                var returnedEvent = scope[method]('someEvent');

                expect(returnedEvent).toBeDefined();
                expect(returnedEvent.name).toEqual('someEvent');
            });
            it('can be deregistered' + method, function () {
                var listener = jasmine.createSpy();
                var deregister = scope.$on('someEvent', listener);

                deregister();

                scope[method]('someEvent');
                expect(listener).not.toHaveBeenCalled();
            });
            it('does not skip the next listener when removed on' + method, function () {
                var deregister;
                var listener = function () {
                    deregister();
                };
                var nextListener = jasmine.createSpy();

                deregister = scope.$on('someEvent', listener);
                scope.$on('someEvent', nextListener);

                scope[method]('someEvent');

                expect(nextListener).toHaveBeenCalled();
            });
        });
        it('propagates up the scope hierarchy on $emit', function () {
            var parentListner = jasmine.createSpy();
            var scopeListener = jasmine.createSpy();

            parent.$on('someEvent', parentListner);
            scope.$on('someEvent', scopeListener);
            scope.$emit('someEvent');

            expect(scopeListener).toHaveBeenCalled();
            expect(parentListner).toHaveBeenCalled();
        });
        it('propagates the same event  up on $emit', function () {
            var parentListener = jasmine.createSpy();
            var scopeListener = jasmine.createSpy();

            parent.$on('someEvent', parentListener);
            scope.$on('someEvent', scopeListener);

            scope.$emit('someEvent');


            var scopeEvent = scopeListener.calls.mostRecent().args[0];
            var parentEvent = parentListener.calls.mostRecent().args[0];
            expect(scopeEvent).toBe(parentEvent);
        });
        it('propagates down the scope hierarchy on $broadcast', function () {
            var scopeListener = jasmine.createSpy();
            var childListener = jasmine.createSpy();
            var isolatedChildListener = jasmine.createSpy();

            scope.$on('someEvent', scopeListener);
            child.$on('someEvent', childListener);

            isolatedChild.$on('someEvent', isolatedChildListener);
            scope.$broadcast('someEvent');

            expect(scopeListener).toHaveBeenCalled();
            expect(childListener).toHaveBeenCalled();
            expect(isolatedChildListener).toHaveBeenCalled();
        });
        it('propagates the same event down on $broadcast', function () {
            var scopeListener = jasmine.createSpy();
            var childListener = jasmine.createSpy();

            scope.$on('someEvent', scopeListener);
            child.$on('someEvent', childListener);

            scope.$broadcast('someEvent');

            var scopeEvent = scopeListener.calls.mostRecent().args[0];
            var childEvent = childListener.calls.mostRecent().args[0];
            expect(scopeEvent).toBe(childEvent);
        });
        it('attaches targetScope on $emit', function () {
            var scopeListener = jasmine.createSpy();
            var parentListener = jasmine.createSpy();
            scope.$on('someEvent', scopeListener);
            parent.$on('someEvent', parentListener);
            scope.$emit('someEvent');
            expect(scopeListener.calls.mostRecent().args[0].targetScope).toBe(scope);
            expect(parentListener.calls.mostRecent().args[0].targetScope).toBe(scope);
        });
        it('attaches targetScope on $broadcast', function () {
            var scopeListener = jasmine.createSpy();
            var childListener = jasmine.createSpy();
            scope.$on('someEvent', scopeListener);
            child.$on('someEvent', childListener);
            scope.$broadcast('someEvent');
            expect(scopeListener.calls.mostRecent().args[0].targetScope).toBe(scope);
            expect(childListener.calls.mostRecent().args[0].targetScope).toBe(scope);
        });
        it('attaches currentScope on$emit', function () {
            var currentScopeOnScope, currentScopeOnParent;
            var scopeListener = function (event) {
                currentScopeOnScope = event.currentScope;
            };
            var parentListener = function (event) {
                currentScopeOnParent = event.currentScope;
            };

            scope.$on('someEvent', scopeListener);
            parent.$on('someEvent', parentListener);

            scope.$emit('someEvent');

            expect(currentScopeOnParent).toBe(parent);
            expect(currentScopeOnScope).toBe(scope);


        });
        it("attaches currentScope on $broadcast", function () {
            var currentScopeOnScope, currentScopeOnChild;
            var scopeListener = function (event) {
                currentScopeOnScope = event.currentScope;
            };
            var childListener = function (event) {
                currentScopeOnChild = event.currentScope;
            };
            scope.$on('someEvent', scopeListener);
            child.$on('someEvent', childListener);
            scope.$broadcast('someEvent');
            expect(currentScopeOnScope).toBe(scope);
            expect(currentScopeOnChild).toBe(child);
        });
        it("sets currentScope to null after propagation on $emit", function () {
            var event;
            var scopeListener = function (evt) {
                event = evt;
            };
            scope.$on('someEvent', scopeListener);
            scope.$emit("someEvent");
            expect(event.currentScope).toBe(null);
        });
        it("sets currentScope to null after propagation on $broadcast", function () {
            var event;
            var scopeListener = function (evt) {
                event = evt;
            };
            scope.$on('someEvent', scopeListener);
            scope.$broadcast('someEvent');
            expect(event.currentScope).toBe(null);
        });
        it('does not propagate to parents when stopped', function () {
            var scopeListener = function (event) {
                event.stopPropagation();
            };
            var parentListener = jasmine.createSpy();
            scope.$on('someEvent', scopeListener);
            parent.$on('someEvent', parentListener);
            scope.$emit('someEvent');
            expect(parentListener).not.toHaveBeenCalled();
        });
        it("is received by listeners on current scope after being stopped", function () {
            var listener1 = function (event) {
                event.stopPropagation();
            };
            var listener2 = jasmine.createSpy();
            scope.$on('someEvent', listener1);
            scope.$on('someEvent', listener2);
            scope.$emit('someEvent');
            expect(listener2).toHaveBeenCalled();
        });
        _.forEach(['$emit', '$broadcast'], function (method) {
            it("is sets defaultPrevented when preventDefault called on " + method, function () {
                var listener = function (event) {
                    event.preventDefault();
                };
                scope.$on('someEvent', listener);
                var event = scope[method]('someEvent');
                expect(event.defaultPrevented).toBe(true);
            });
            it("does not stop on exceptions on " + method, function () {
                var listener1 = function (event) {
                    throw  "listener1 throwing an exception ";
                };
                var listener2 = jasmine.createSpy();
                scope.$on('someEvent', listener1);
                scope.$on('someEvent', listener2);
                scope[method]('someEvent');
                expect(listener2).toHaveBeenCalled();
            });
        });
        it("fires $destroy when destroyed", function () {
            var listener = jasmine.createSpy();
            scope.$on('$destroy', listener);
            scope.$destroy();
            expect(listener).toHaveBeenCalled();
        });
        it("fires $destroy on children destroyed", function () {
            var listener = jasmine.createSpy();
            child.$on('$destroy', listener);
            scope.$destroy();
            expect(listener).toHaveBeenCalled();
        });
        it('no longers calls listeners after destroyed', function () {
            var listener = jasmine.createSpy();
            scope.$on('myEvent', listener);
            scope.$destroy();
            scope.$emit('myEvent');
            expect(listener).not.toHaveBeenCalled();
        });

    });

});