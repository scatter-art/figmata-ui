import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import * as TO from 'fp-ts/TaskOption'
import * as TE from 'fp-ts/TaskEither'
import { identity, pipe } from "fp-ts/lib/function";

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

export function flatTryE <X,Z,E>(f: (b: X) => Promise<Z>): 
    (x: TE.TaskEither<E,X>) => TE.TaskEither<unknown,Z> 
{
    return TE.chain(x => TE.tryCatch(() => f(x), identity))
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

// TODO This function is not pure, so it should be decoupled out of
// this `pure.tsx`.
export const formattedTimeLeft = (unixTimestamp: number): O.Option<string> => {
    const diffInSeconds = Math.floor(unixTimestamp - Date.now() / 1000)
    if (diffInSeconds < 0) return O.none

    const hours = Math.floor(diffInSeconds / 3600)
    const mins = Math.floor((diffInSeconds % 3600) / 60)
    const secs = diffInSeconds % 60
    
    const fmins = mins < 10 ? `0${mins.toString()}` : mins.toString()
    const fsecs = secs < 10 ? `0${secs.toString()}` : secs.toString()

    return O.of(`${hours}:${fmins}:${fsecs}`)
};


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

export const TE2 = {
    flatTryE
};

export const UnsafeFun = {
    unfun, unfunf, unf
};


