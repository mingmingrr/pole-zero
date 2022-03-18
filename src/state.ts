import * as d3 from 'd3';

import * as C from './complex';
import { Complex } from './complex';
import { fft } from './fft';
import { fromRoots } from './polynomial';
import { Root } from './root';

export type Roots = {
	name:  string,
	roots: Array<Root>,
	real:  Float64Array,
	imag:  Float64Array,
};

export const option = {
	frequency: new Root('pi', new Complex(Math.PI, 0)),
	gain: new Root('1', C.one()),
	resolution: 1024,
	scale: {
		axis: d3.scaleLinear().clamp(true),
		data: (x:number) => x,
		extent: ([min, max]:Array<number>, gain:number) =>
			[0, Math.min(max + 1e-6 * gain, 1e6 * gain)],
	},
	snap: { axis: true, unit: true },
};

export const floaty = {
	position: { x: 0, y: 0 },
	size: { x: 400, y: 400 },
	slide: 0,
};

export const poles : Roots = {
	name: 'poles',
	roots: [ new Root('', C.zero()) ],
	real: new Float64Array(1024),
	imag: new Float64Array(1024),
};

export const zeros : Roots = {
	name: 'zeros',
	roots: [ new Root('', C.zero()) ],
	real: new Float64Array(1024),
	imag: new Float64Array(1024),
};

export let response = {
	abs: new Float64Array(513),
	scaled: new Float64Array(513),
};

export function calculate(values:Roots) : void {
	values.real.fill(0);
	values.imag.fill(0);
	let poly = fromRoots(values.roots.map(
		(x) => C.conjugates(x.value)).flat());
	for(let i = 0; i < poly.length; ++i) {
		values.real[i] = poly[i].real;
		values.imag[i] = poly[i].imag;
	}
	fft(option.resolution,
		values.real, values.imag);
	for(let i = option.resolution >> 1; i >= 0; --i) {
		response.abs[i] = C.abs(
			C.mul(option.gain.value, C.div(
				new Complex(zeros.real[i], zeros.imag[i]),
				new Complex(poles.real[i], poles.imag[i])) )).real;
		response.scaled[i] = option.scale.data(response.abs[i]);
	}
};

export const recalculate : Array<(r:Roots)=>void> = [ calculate ];
