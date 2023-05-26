import * as O from "fp-ts/lib/Option";

/**
 * @dev Extracts `opt` value in a safe way.
 * @notice `unfun` is a shorthand for "nonfunctional".
 */
export const unfun = <T,>(opt: O.Option<T>): T | undefined => {
    if (O.isSome(opt)) return opt.value
    else return undefined
};
