import { Aspect, Compile } from '@aspectjs/core/annotations';
import { AdviceType, CompileContext, on } from '@aspectjs/core/commons';
import { assert, getOrComputeMetadata, isObject } from '@aspectjs/core/utils';
import { Memo } from '../memo.annotation';

import { Cacheable, CacheableOptions } from './cacheable.annotation';

/**
 * @public
 */
export type Prototype = {
    constructor: Function;
};

/**
 * Store the signature of an object annotated wuth @Cacheable in order
 * to be able to cache it with the @Memo annotation
 *
 * @public
 */
export interface CacheableAspect {
    readonly cacheTypeStore: CacheTypeStore;
}

/**
 * @public
 */
export interface CacheTypeStore {
    getPrototype(key: string): Prototype;
    getVersion(key: string): any;
    getTypeKey<T extends Prototype>(proto: T): string;

    addPrototype<T extends Prototype>(proto: T, key: string, version?: any): void;
}

/**
 * Assign a key to the prototype of a class into a CacheTypeStore,
 * so that Memo drivers can inflate memoized objects with proper types.
 *
 * @public
 */
@Aspect('@aspectjs/cacheable')
export class DefaultCacheableAspect implements CacheableAspect {
    constructor(public readonly cacheTypeStore: CacheTypeStore = new _CacheTypeStoreImpl()) {}
    @Compile(on.class.withAnnotations(Cacheable))
    registerCacheKey(ctxt: CompileContext<any, AdviceType.CLASS>) {
        let options = ctxt.annotations.onSelf(Cacheable)[0].args[0] as CacheableOptions;
        if (!isObject(options)) {
            options = {
                typeId: options,
            };
        }
        const typeId = options.typeId ?? _generateTypeId(ctxt.target.proto);

        this.cacheTypeStore.addPrototype(ctxt.target.proto, typeId, options.version);
    }
}

/**
 * Store class prototypes along with a defined key.
 * @internal
 */
export class _CacheTypeStoreImpl implements CacheTypeStore {
    private readonly _prototypes: Record<string, Prototype> = {};
    private readonly _versions: Record<string, string> = {};

    getPrototype(key: string): Prototype {
        assert(!!key, 'key must be defined');
        const proto = this._prototypes[key];
        if (!proto) {
            throw new Error(`no prototype found for key ${key}`);
        }
        return proto;
    }

    getTypeKey<T extends Prototype>(prototype: T): string {
        return Reflect.getOwnMetadata('@aspectjs/cacheable:typekey', prototype);
    }

    addPrototype<T extends Prototype>(proto: Prototype, typeId: string, version?: string): void {
        if (this._prototypes[typeId] && this._prototypes[typeId] !== proto) {
            throw new Error(
                `Cannot call @Cacheable({typeId = ${typeId}}) on ${proto?.constructor?.name}: typeId is already assigned to ${this._prototypes[typeId]?.constructor?.name}`,
            );
        }

        this._versions[typeId] = version;
        this._prototypes[typeId] = proto;
    }

    getVersion<T extends Prototype>(key: string): string {
        return this._versions[key];
    }
}

let globalId = 0;
function _generateTypeId(proto: any): string {
    return getOrComputeMetadata('@aspectjs/cacheable:typekey', proto, () => {
        return `${proto.constructor.name}#${globalId++}`;
    });
}
