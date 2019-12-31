import { AfterAdvice, AfterReturnAdvice, Aspect, AspectHooks } from '../../../../weaver/types';
import { AClass } from '../../../../tests/a';
import { AnnotationContext } from '../../../context/context';
import { Weaver } from '../../../../weaver/load-time/load-time-weaver';
import { setWeaver } from '../../../../index';

interface Labeled {
    labels?: string[];
}

function setupWeaver(...aspects: Aspect[]): void {
    const weaver = new Weaver().enable(...aspects);
    setWeaver(weaver);
    weaver.load();
}

let afterReturn: AfterReturnAdvice<any> = (ctxt, retVal) => {
    throw new Error('should configure afterThrowAdvice');
};

describe('given a class configured with some class-annotation aspect', () => {
    describe('that leverage "afterReturn" pointcut', () => {
        beforeEach(() => {
            class AfterReturnAspect extends Aspect {
                name = 'AClassLabel';

                apply(hooks: AspectHooks): void {
                    hooks.annotations(AClass).class.afterReturn((ctxt, retVal) => afterReturn(ctxt, retVal));
                }
            }

            afterReturn = jasmine
                .createSpy('afterReturnAdvice', function(ctxt) {
                    ctxt.instance.labels = ctxt.instance.labels ?? [];
                    ctxt.instance.labels.push('AClass');
                })
                .and.callThrough();

            setupWeaver(new AfterReturnAspect());
        });

        describe('creating an instance of this class', () => {
            describe('with a constructor that throws', () => {
                it('should not call the aspect', () => {
                    @AClass()
                    class A implements Labeled {
                        constructor(label: string) {
                            throw new Error('expected');
                        }
                    }

                    expect(() => {
                        new A('ctor');
                    }).toThrow();
                    expect(afterReturn).not.toHaveBeenCalled();
                });
            });

            describe('with a constructor that do not throws', () => {
                it('should call the aspect', () => {
                    @AClass()
                    class A implements Labeled {
                        public labels: string[];
                        constructor(label: string) {
                            this.labels = [label];
                        }
                    }

                    const labels = new A('ctor').labels;
                    expect(afterReturn).toHaveBeenCalled();
                    expect(labels).toEqual(['ctor', 'AClass']);
                });
            });
        });
    });
});