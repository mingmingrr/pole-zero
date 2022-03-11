export class Indexed<a> {
	constructor(
		public index: number,
		public value: a,
	) {}
};

export function makeIndexed<a>(value:a, index:number) : Indexed<a> {
	return new Indexed(index, value);
}

export class ReprValue<a> {
	constructor(
		public repr:string,
		public value:a,
	) {}
}

export function closeto(x:number, y:number) : boolean {
	return Math.abs(x - y) < 1e-9;
}

