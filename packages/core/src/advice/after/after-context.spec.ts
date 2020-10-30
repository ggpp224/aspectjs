import { AdviceContext, AfterContext, AfterReturnContext } from '../advice-context';
import { Aspect } from '../aspect';
import { on } from '../pointcut';
import {
    AClass,
    AMethod,
    AParameter,
    AProperty,
    BClass,
    BMethod,
    BParameter,
    BProperty,
} from '../../../testing/src/helpers';
import { After } from './after.decorator';
import { weaverContext } from '../../weaver/weaver-context';
import { Weaver } from '../../weaver/weaver';
import { JitWeaver } from '../../weaver/jit/jit-weaver';
import { AnnotationType } from '../../annotation/annotation.types';

describe('AfterReturnContext', () => {
    let weaver: Weaver;
    let afterAAdvice = jasmine.createSpy('afterAAdvice');
    let afterBAdvice = jasmine.createSpy('afterBAdvice');

    beforeEach(() => {
        // TODO use setupWeaver
        weaverContext.setWeaver((weaver = new JitWeaver()));
        afterAAdvice = jasmine.createSpy('afterAAdvice');
        afterBAdvice = jasmine.createSpy('afterBAdvice');
    });

    describe('on a class', () => {
        let classAspectB: any;
        beforeEach(() => {
            @Aspect()
            class ClassAspectA {
                @After(on.class.withAnnotations(AClass), { priority: 10 })
                afterA(ctxt: AfterContext<any, AnnotationType.PROPERTY>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class ClassAspectB {
                @After(on.class.withAnnotations(BClass), { priority: 9 })
                afterB(ctxt: AfterContext<any, AnnotationType.PROPERTY>): void {
                    afterBAdvice(ctxt);
                }
            }
            classAspectB = ClassAspectB;
            weaver.enable(new ClassAspectA(), new ClassAspectB());
        });
        describe('attribute "ctxt.data"', () => {
            let data: any;

            function pushData(ctxt: AdviceContext<any, any>, message: string): void {
                data = ctxt.data;
                ctxt.data.advices = ctxt.data.advices ?? [];
                ctxt.data.advices.push(message);
            }

            beforeEach(() => {
                data = null;

                afterAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterA'));
                afterBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterB'));
            });
            it('should be shared across two @After advices on the same class', () => {
                @AClass()
                @BClass()
                class Test {}
                new Test();
                expect(afterAAdvice).toHaveBeenCalled();
                expect(afterBAdvice).toHaveBeenCalled();
                expect(data.advices).toEqual(['afterA', 'afterB']);
            });

            it('should not shared across two @After advices on different classes', () => {
                @AClass()
                class Test1 {}
                new Test1();
                expect(data.advices).toEqual(['afterA']);
                @BClass()
                class Test2 {}
                new Test2();

                expect(data.advices).toEqual(['afterB']);
            });
        });
    });

    describe('on a property', () => {
        let propertyAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @After(on.property.withAnnotations(AProperty), { priority: 10 })
                afterA(ctxt: AfterContext<any, AnnotationType.CLASS>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @After(on.property.withAnnotations(BProperty), { priority: 9 })
                afterB(ctxt: AfterContext<any, AnnotationType.CLASS>): void {
                    afterBAdvice(ctxt);
                }
            }
            propertyAspectB = PropertyAspectB;
            weaver.enable(new PropertyAspectA(), new PropertyAspectB());
        });
        describe('attribute "ctxt.data"', () => {
            let data: any;

            function pushData(ctxt: AdviceContext<any, any>, message: string): void {
                data = ctxt.data;
                ctxt.data.advices = ctxt.data.advices ?? [];
                ctxt.data.advices.push(message);
            }

            beforeEach(() => {
                data = null;

                afterAAdvice.and.callFake((ctxt: AfterReturnContext<any, any>) => pushData(ctxt, 'afterA'));
                afterBAdvice.and.callFake((ctxt: AfterReturnContext<any, any>) => pushData(ctxt, 'afterB'));
            });
            it('should be shared across two @After advices on the same property', () => {
                class Test {
                    @AProperty()
                    @BProperty()
                    prop: any;
                }

                [afterAAdvice, afterBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
                new Test().prop;
                [afterAAdvice, afterBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
                expect(data.advices).toEqual(['afterA', 'afterB']);
            });

            it('should not shared across two @After advices on different properties', () => {
                @AClass()
                class Test {
                    @AProperty()
                    prop1: any;
                    @BProperty()
                    prop2: any;
                }
                const t = new Test();

                [afterAAdvice, afterBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
                t.prop1;
                t.prop2;
                [afterAAdvice, afterBAdvice].forEach((f) => expect(f).toHaveBeenCalled());

                expect(data.advices).toEqual(['afterB']);
            });
        });
    });

    describe('on a property setter', () => {
        let propertyAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @After(on.property.setter.withAnnotations(AProperty), { priority: 10 })
                afterA(ctxt: AfterContext<any, AnnotationType.CLASS>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @After(on.property.setter.withAnnotations(BProperty), { priority: 9 })
                afterB(ctxt: AfterContext<any, AnnotationType.CLASS>): void {
                    afterBAdvice(ctxt);
                }
            }
            propertyAspectB = PropertyAspectB;
            weaver.enable(new PropertyAspectA(), new PropertyAspectB());
        });
        describe('attribute "ctxt.data"', () => {
            let data: any;

            function pushData(ctxt: AdviceContext<any, any>, message: string): void {
                data = ctxt.data;
                ctxt.data.advices = ctxt.data.advices ?? [];
                ctxt.data.advices.push(message);
            }

            beforeEach(() => {
                data = null;

                afterAAdvice.and.callFake((ctxt: AfterReturnContext<any, any>) => {
                    pushData(ctxt, 'afterA');
                });
                afterBAdvice.and.callFake((ctxt: AfterReturnContext<any, any>) => {
                    pushData(ctxt, 'afterB');
                });
            });
            it('should be shared across two @After advices on the same property', () => {
                class Test {
                    @AProperty()
                    @BProperty()
                    prop: any;
                }
                [afterAAdvice, afterBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                new Test().prop = 'toto';
                [afterAAdvice, afterBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());
                expect(data.advices).toEqual(['afterA', 'afterB']);
            });

            it('should not shared across two @After advices on different properties', () => {
                @AClass()
                class Test {
                    @AProperty()
                    prop1: any;

                    @BProperty()
                    prop2: any;
                }

                [afterAAdvice, afterBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                const t = new Test();
                t.prop1 = 'toto';
                t.prop2 = 'toto';
                [afterAAdvice, afterBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());

                expect(data.advices).toEqual(['afterB']);
            });
        });
    });

    describe('on a method', () => {
        let methodAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @After(on.method.withAnnotations(AMethod), { priority: 10 })
                afterA(ctxt: AfterContext<any, AnnotationType.METHOD>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @After(on.method.withAnnotations(BMethod), { priority: 9 })
                afterB(ctxt: AfterContext<any, AnnotationType.METHOD>): void {
                    afterBAdvice(ctxt);
                }
            }
            methodAspectB = PropertyAspectB;
            weaver.enable(new PropertyAspectA(), new PropertyAspectB());
        });
        describe('attribute "ctxt.data"', () => {
            let data: any;

            function pushData(ctxt: AdviceContext<any, any>, message: string): void {
                data = ctxt.data;
                ctxt.data.advices = ctxt.data.advices ?? [];
                ctxt.data.advices.push(message);
            }

            beforeEach(() => {
                data = null;

                afterAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterA'));
                afterBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterB'));
            });

            it('should be shared across two @After advices on the same method', () => {
                class Test {
                    @AMethod()
                    @BMethod()
                    someMethod(): any {}
                }
                [afterAAdvice, afterBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                new Test().someMethod();
                [afterAAdvice, afterBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());

                expect(data.advices).toEqual(['afterA', 'afterB']);
            });

            it('should not shared across two @After advices on different method', () => {
                @AClass()
                class Test {
                    @AMethod()
                    method1(): any {}

                    @BMethod()
                    method2(): any {}
                }

                [afterAAdvice, afterBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                const t = new Test();
                t.method1();
                t.method2();
                [afterAAdvice, afterBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());

                expect(data.advices).toEqual(['afterB']);
            });
        });
    });

    describe('on a parameter', () => {
        let parameterAspectB: any;
        beforeEach(() => {
            @Aspect()
            class ParameterAspectA {
                @After(on.parameter.withAnnotations(AParameter), { priority: 10 })
                afterA(ctxt: AfterContext<any, AnnotationType.PARAMETER>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class ParameterAspectB {
                @After(on.parameter.withAnnotations(BParameter), { priority: 9 })
                afterB(ctxt: AfterContext<any, AnnotationType.PARAMETER>): void {
                    afterBAdvice(ctxt);
                }
            }
            parameterAspectB = ParameterAspectB;
            weaver.enable(new ParameterAspectA(), new ParameterAspectB());
        });
        describe('attribute "ctxt.data"', () => {
            let data: any;

            function pushData(ctxt: AdviceContext<any, any>, message: string) {
                data = ctxt.data;
                ctxt.data.advices = ctxt.data.advices ?? [];
                ctxt.data.advices.push(message);
            }

            beforeEach(() => {
                data = null;

                afterAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterA'));
                afterBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterB'));
            });
            it('should be shared across two @After advices on the same parameter', () => {
                class Test {
                    someMethod(@AParameter() @BParameter() param: any): any {}
                }

                new Test().someMethod('');

                expect(data.advices).toEqual(['afterA', 'afterB']);
            });

            it('should not shared across two @After advices on different parameters', () => {
                class Test {
                    someMethod(@AParameter() paramA: any, @BParameter() paramB: any): any {}
                }
                new Test().someMethod('', '');

                expect(data.advices).toEqual(['afterA']);
            });
        });
    });
});
