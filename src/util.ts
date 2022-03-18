export class Indexed<a> {
	constructor(
		public index: number,
		public value: a,
	) {}
};

export function makeIndexed<a>(value:a, index:number) : Indexed<a> {
	return new Indexed(index, value);
}

export function closeto(x:number, y:number, eps:number=1e-9) {
	return Math.abs(x - y) < eps;
}

export function compare(x:number, y:number, eps:number=1e-9) {
	if(closeto(x, y, eps)) return 0;
	return x > y ? 1 : -1;
}

