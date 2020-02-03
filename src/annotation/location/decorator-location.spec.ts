import { AnnotationFactory } from '../factory/factory';
import { AnnotationLocation } from './location';

describe('AnnotationLocation', () => {
    class Decorated {
        value: any;

        getAnnotations(): string {
            return undefined;
        }
    }
    const factory = new AnnotationFactory('test');

    const APropertyAnnotation = factory.create(function APropertyAnnotation() {
        // (target: Object, propertyKey: string | symbol) => void;
        return (target: Record<string, any>, propertyKey: string | symbol) => {};
    });

    describe('of()', () => {
        describe('given an object that is not a class instance', () => {
            it('should throw an error', () => {
                const x = {
                    value: 'value',
                    method() {},
                };

                expect(() => AnnotationLocation.of(x)).toThrow(
                    new Error('given object is neither a constructor nor a class instance'),
                );
            });
        });

        describe('given an class constructor', () => {
            it('should get the same location as if given the class constructor', () => {
                const x = {
                    value: 'value',
                    method() {},
                };

                expect(() => AnnotationLocation.of(x)).toThrow(
                    new Error('given object is neither a constructor nor a class instance'),
                );
            });
        });

        describe('given a class instance', () => {
            describe('that do not use decorators', () => {
                let a: Decorated;
                beforeEach(() => {
                    class AClass extends Decorated {
                        constructor(public value: any) {
                            super();
                        }
                    }

                    a = new AClass('value');
                });

                it('should return an empty location', () => {
                    const loc = AnnotationLocation.of(a);

                    expect(Object.values(loc).length).toEqual(0);
                });
            });

            it('should get the same location as if given the class constructor', () => {
                class AClass extends Decorated {
                    constructor(public value: any) {
                        super();
                    }
                }

                const a = new AClass('value');

                const loc = AnnotationLocation.of(a);
                expect(loc).toBe(AnnotationLocation.of(new AClass(null)));
            });
            describe('that uses decorators on properties', () => {
                let a: Decorated;
                beforeEach(() => {
                    class AClass extends Decorated {
                        @APropertyAnnotation()
                        value: any;

                        constructor(value: any) {
                            super();
                        }
                    }

                    a = new AClass('value');
                });

                it('should return an empty location', () => {
                    const loc = AnnotationLocation.of(a);

                    expect(loc.value).toBeDefined();
                });
            });
        });
    });
});