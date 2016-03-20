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
        it("catches exceptions in listener function and continues ", function() {
            scope.aValue = 'abc';
            scope.counter = 0;
            scope.$watch(
                function(scope) {return scope.aValue;},
                function(newValue, oldValue, scope)
                {
                    throw 'error';
                }
            );
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function(newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);
        })
    });
});