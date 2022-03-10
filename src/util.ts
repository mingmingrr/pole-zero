export class ReprValue<a> {
	constructor(
		readonly repr:string,
		readonly value:a,
	) {}
}

export function closeto(x:number, y:number) : boolean {
	return Math.abs(x - y) < 1e-9;
}

