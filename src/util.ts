export class Indexed<a> {
	constructor(
		public index: number,
		public value: a,
	) {}
};

export function makeIndexed<a>(value:a, index:number) : Indexed<a> {
	return new Indexed(index, value);
}



