import { MemoFrame } from '../../drivers';
import { MarshallingContext, UnmarshallingContext } from '../marshalling-context';

/**
 * @public
 */
export type MarshalFn<T = any, M = T> = (value: M) => MemoFrame<T>;

/**
 * @public
 */
export type UnmarshalFn<T = any, M = T> = (value: M) => MemoFrame<T>;

/**
 * @public
 */
export abstract class MemoMarshaller<T = any, M = T> {
    abstract readonly types: string | string[];
    abstract marshal(frame: MemoFrame<T>, context?: MarshallingContext, marshalFn?: MarshalFn<T, M>): MemoFrame<M>;
    abstract unmarshal(
        frame: MemoFrame<M>,
        context: UnmarshallingContext,
        defaultUnmarshallingFn: UnmarshalFn<M, T>,
    ): T;
}
