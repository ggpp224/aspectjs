import { AdviceFactory } from '../advice-factory';
import { PointcutExpression, PointcutPhase } from '../pointcut';

export function AfterReturn(pointcutExp: PointcutExpression): MethodDecorator {
    return AdviceFactory.create(pointcutExp, PointcutPhase.AFTERRETURN);
}
