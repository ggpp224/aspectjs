import { AdviceLocation, AdviceTarget, ClassAdviceTarget } from '../../advice/target/advice-target';
import { assert, getOrComputeMetadata, isUndefined } from '@aspectjs/core/utils';
import { AnnotationContextSelector, AnnotationsBundle } from './bundle';
import { AnnotationContext, ClassAnnotationContext } from '../context/annotation-context';
import { Annotation, AdviceType } from '../annotation.types';
import { AnnotationLocationFactory } from '../../advice/target/annotation-target.factory';
import { locator } from '../../utils/locator';

export abstract class AnnotationBundleRegistry {
    static of<T>(target: AdviceTarget<T, any>): AnnotationsBundle<T> {
        return getOrComputeMetadata(
            'aspectjs.bundle',
            target.proto,
            () => new AnnotationsBundleImpl(target.declaringClass),
        );
    }

    static addContext<T>(target: AdviceTarget<T, any>, context: AnnotationContext<any, any>): AnnotationsBundle<T> {
        const bundle = AnnotationBundleRegistry.of(target) as AnnotationsBundleImpl<T>;
        bundle.addAnnotationContext(context);
        return bundle;
    }
}

interface AnnotationContextsHolder<T, A extends AdviceType> {
    byAnnotationName: {
        [decoratorName: string]: AnnotationContext<T, A>[];
    };
    all: AnnotationContext<T, A>[];
    byPropertyName?: {
        [propertyName: string]: AnnotationContextsHolder<T, A>;
    };
    byIndex?: {
        [argIndex: string]: AnnotationContextsHolder<T, A>;
    };
}

function _createContextsHolder<T, A extends AdviceType>(): AnnotationContextsHolder<T, A> {
    return {
        byAnnotationName: {},
        all: [],
    } as AnnotationContextsHolder<T, A>;
}

class AnnotationsBundleImpl<T> implements AnnotationsBundle<T> {
    private _target: AdviceTarget<T, AdviceType.CLASS>;

    private _contextHolders = {
        [AdviceType.PROPERTY]: _createContextsHolder<any, any>(),
        [AdviceType.CLASS]: _createContextsHolder<any, any>(),
        [AdviceType.METHOD]: _createContextsHolder<any, any>(),
        [AdviceType.PARAMETER]: _createContextsHolder<any, any>(),
    };

    private _global = _createContextsHolder<T, AdviceType>();

    constructor(target: ClassAdviceTarget<T>) {
        this._target = target;
    }

    at<A extends AdviceType>(location: AdviceLocation<T, A>): AnnotationContextSelector<T, A> {
        const target = AnnotationLocationFactory.getTarget<T, A>(location);

        return new AnnotationContextSelectorImpl<T, A>(
            target ? this._getContextHolders<A>(target, false)[0] : _createContextsHolder<T, A>(),
        );
    }

    addAnnotationContext(ctxt: AnnotationContext<T, AdviceType>): void {
        const name = ctxt.toString();

        const holders = this._getContextHolders(ctxt.target, true);

        holders.forEach((holder) => {
            AnnotationLocationFactory.create(ctxt.target);
            locator(holder.byAnnotationName)
                .at(name)
                .orElse(() => [])
                .push(ctxt);
            holder.all.push(ctxt as ClassAnnotationContext<T>);
        });

        if (ctxt.target.type === AdviceType.PARAMETER) {
            holders.forEach((h) => {
                h.all = h.all.sort((d1, d2) => d1.target.parameterIndex - d2.target.parameterIndex);
                h.byAnnotationName[name] = h.byAnnotationName[name].sort(
                    (d1, d2) => d1.target.parameterIndex - d2.target.parameterIndex,
                );
            });
        }
    }

    @Enumerable(false)
    private _getContextHolders<A extends AdviceType>(
        target: AdviceTarget<T, A>,
        save: boolean,
    ): AnnotationContextsHolder<T, AdviceType>[] {
        if (!target) {
            return [];
        }

        if (target.type === AdviceType.CLASS) {
            return [this._contextHolders[target.type], this._global];
        } else if (
            target.type === AdviceType.PARAMETER ||
            target.type === AdviceType.PROPERTY ||
            target.type === AdviceType.METHOD
        ) {
            const byAnnotation = this._contextHolders[target.type];
            byAnnotation.byPropertyName = byAnnotation.byPropertyName ?? ({} as any);

            const byPropertyName = locator(byAnnotation.byPropertyName as any)
                .at(target.propertyKey)
                .orElse(() => {
                    return { all: [], byAnnotationName: {} } as AnnotationContextsHolder<any, any>;
                }, save) as AnnotationContextsHolder<T, A>;

            if (target.type === AdviceType.PARAMETER) {
                byPropertyName.byIndex = byPropertyName.byIndex ?? {};
                const byIndex = locator(byPropertyName.byIndex)
                    .at(`${target.parameterIndex}`)
                    .orElse(_createContextsHolder, save);

                assert(!save || !isNaN(target.parameterIndex));

                const allArgsContext = locator(byPropertyName.byIndex).at(`NaN`).orElse(_createContextsHolder, save);

                return [byIndex, allArgsContext, byPropertyName, byAnnotation, this._global];
            }

            return [byPropertyName, byAnnotation, this._global];
        }

        assert(false, `unknown decorator type: ${target.type}`);
    }

    all<A extends AdviceType>(annotation?: Annotation<A>): readonly AnnotationContext<T, A>[] {
        return new AnnotationContextSelectorImpl<T, A>(this._global).all(annotation);
    }

    class<A extends AdviceType>(annotation?: Annotation<A>): readonly AnnotationContext<T, A>[] {
        return new AnnotationContextSelectorImpl<T, A>(this._contextHolders[AdviceType.CLASS]).all(annotation);
    }
    properties<A extends AdviceType>(annotation?: Annotation<A>): readonly AnnotationContext<T, A>[] {
        return new AnnotationContextSelectorImpl<T, A>(this._contextHolders[AdviceType.PROPERTY]).all(annotation);
    }
    methods<A extends AdviceType>(annotation?: Annotation<A>): readonly AnnotationContext<T, A>[] {
        return new AnnotationContextSelectorImpl<T, A>(this._contextHolders[AdviceType.METHOD]).all(annotation);
    }
    parameters<A extends AdviceType>(annotation?: Annotation<A>): readonly AnnotationContext<T, A>[] {
        return new AnnotationContextSelectorImpl<T, A>(this._contextHolders[AdviceType.PARAMETER]).all(annotation);
    }
}

class AnnotationContextSelectorImpl<T, A extends AdviceType> implements AnnotationContextSelector<T, A> {
    constructor(private _holder: AnnotationContextsHolder<T, AdviceType>) {
        assert(!!this._holder);
    }
    all(annotation?: Annotation<A>): readonly AnnotationContext<T, A>[] {
        return Object.freeze([
            ...(isUndefined(annotation)
                ? this._holder.all
                : this._holder.byAnnotationName[annotation.toString()] ?? []),
        ]) as AnnotationContext<T, A>[];
    }
}

// TODO turn into aspect
function Enumerable(value: boolean): PropertyDecorator {
    return function (target: any, propertyKey: string) {
        const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey) ?? {};
        if (descriptor.enumerable !== value) {
            descriptor.enumerable = value;
        }
    };
}
