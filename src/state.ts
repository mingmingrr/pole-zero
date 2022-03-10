import * as C from './complex';
import { Complex } from './complex';
import { fft, polynomial } from './fft';
import { ReprValue } from './util';

export type Roots = {
	roots:Array<ReprValue<Complex>>,
	real:Float64Array,
	imag:Float64Array,
};

export const option = {
	frequency: new ReprValue('pi', new Complex(Math.PI, 0)),
	gain: new ReprValue('pi', new Complex(Math.PI, 0)),
	resolution: 256,
	axis: 'Linear',
};

export const floaty = {
	position: { x: 0, y: 0 },
	size: { x: 400, y: 400 },
	slide: 0,
};

export const poles : Roots = {
	roots: [] as Array<ReprValue<Complex>>,
	real: new Float64Array(256),
	imag: new Float64Array(256),
};

export const zeros : Roots = {
	roots: [
		new ReprValue('e^(pi*i/4)', new Complex(Math.SQRT1_2, Math.SQRT1_2)),
	] as Array<ReprValue<Complex>>,
	real: new Float64Array(256),
	imag: new Float64Array(256),
};

zeros.real[0] = 1;
zeros.real[0] = 0;
poles.real[0] = 1;
poles.real[0] = 0;

export let response = {
	real: new Float64Array(256),
	imag: new Float64Array(256),
	abs: new Float64Array(256),
};

export function calculate(values:Roots) : void {
	values.real.fill(0);
	values.imag.fill(0);
	polynomial(values.roots.map((x) => C.conjugates(x.value)).flat(),
		values.real, values.imag);
	fft(option.resolution,
		values.real, values.imag);
	for(let i = option.resolution - 1; i >= 0; --i) {
		let x = C.mul(option.gain.value, C.mul(
			new Complex(zeros.real[i], zeros.imag[i]),
			new Complex(poles.real[i], poles.imag[i])));
		response.abs[i] = Math.hypot(
			response.real[i] = x.real, response.imag[i] = x.imag);
	}
	console.log('calc', response.abs);
};

