import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import * as TO from 'fp-ts/TaskOption'
import { pipe } from "fp-ts/lib/function";

/**
 * @dev This function will unwrap a `TO.TaskOption` and try to run
 * some asynchronous computation over it.
 * @return The partially applied function that gets the
 * `TO.TaskOption` to computate over.
 */
export function flatTry <X,Z>(f: (b: X) => Promise<Z>): 
    (x: TO.TaskOption<X>) => TO.TaskOption<Z> 
{
    return TO.chain(x => TO.tryCatch(() => f(x)))
}

/**
 * @dev Extracts `opt` value in a safe way.
 * @notice `unfun` is a shorthand for "nonfunctional".
 */
export function unfun <T>(opt: O.Option<T> | T): T | undefined {
    return pipe(
        E.tryCatch(() => {
            const opT = opt as O.Option<T>
            if (O.isSome(opT)) return opT.value
            return undefined
        }, () => {}),
        E.getOrElse(() => opt as T | undefined)
    )
};

export const unf = unfun

/**
 * @dev Transforms a `T => O.Option<U>` function into a 
 * `T => U | undefined` one.
 */
export function unfunf <T,U>(
    f: ((t: T) => O.Option<U> | U)
): (t2: T) => (U | undefined) {
    return (t: T) => unfun(f(t))
}


/**
 * @returns A new object map where all `O.Option<U>` is transformed
 * into `U | undefined`
 */
export type UnOptionMap<T> = {
  [K in keyof T]: 
    T[K] extends O.Option<infer U> ? U | undefined :
    T[K] extends (() => O.Option<infer U>) ? () => U | undefined :
    T[K];
};

export const TO2 = {
    flatTry
};

export const UnsafeFun = {
    unfun, unfunf, unf
};


