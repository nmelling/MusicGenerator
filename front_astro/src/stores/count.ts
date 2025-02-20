import { atom } from 'nanostores';

export const $count = atom(0)

export function incrementCount () {
	$count.set($count.get() + 1)
}
