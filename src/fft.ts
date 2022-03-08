import { Complex } from "./complex";
import * as C from "./complex";

class ArrayView<a> {
	constructor(
		readonly array:Array<a>,
		readonly start:number,
		readonly step:number,
	) {}
	get(n:number) : a
		{ return this.array[this.start + n * this.step]; }
	set(n:number, x:a) : a
		{ this.array[this.start + n * this.step] = x; return x; }
	slice(start:number, step:number) : ArrayView<a>
		{ return new ArrayView(this.array,
			this.start + start * this.step,
			this.step * step); }
}

export const sin = new Float64Array(8192);
for(let i = 0; i < 8192; ++i)
	sin[i] = Math.sin(Math.PI * (i / 4096));

export function reverse16(x:number) : number {
	x = (x & 0x55555555) << 1 | (x & 0xAAAAAAAA) >> 1;
	x = (x & 0x33333333) << 2 | (x & 0xCCCCCCCC) >> 2;
	x = (x & 0x0F0F0F0F) << 4 | (x & 0xF0F0F0F0) >> 4;
	x = (x & 0x00FF00FF) << 8 | (x & 0xFF00FF00) >> 8;
	return x;
}

export function polynomial(roots:Array<Complex>)
: {real:Float64Array, imag:Float64Array} {
	let real = new Float64Array(roots.length + 1);
	let imag = new Float64Array(roots.length + 1);
	real[0] = 1;
	for(let i = 0; i < roots.length; ++i)
		for(let j = i + 1; j > 0; --j) {
			real[j] += roots[i].real * real[j-1] - roots[i].imag * imag[j-1];
			imag[j] += roots[i].real * imag[j-1] + roots[i].imag * real[j-1];
		}
	return {real, imag};
}

// (mostly) in-place dif
export function fft(size:number,
	real:Array<number>, imag:Array<number>,
) : Float64Array {
	let realN = new Float64Array(size);
	let imagN = new Float64Array(size);
	realN.set(real);
	imagN.set(imag);
	fftN(size,
		new ArrayView((realN as any), 0, 1),
		new ArrayView((imagN as any), 0, 1),
		new ArrayView((sin as any), 0, 8192 / size),
		new ArrayView((sin as any), 2048, 8192 / size));
	let bits = 16 - Math.round(Math.log2(size));
	size = (size >> 1) + 1;
	let out = new Float64Array(size);
	for(let i = 0; i < size; ++i) {
		let j = reverse16(i) >>> bits;
		out[i] = Math.hypot(realN[j], imagN[j]);
	}
	return out;
}

export function fft4(real:ArrayView<number>, imag:ArrayView<number>) : void {
	let ns = [
		real.get(0) + real.get(2), imag.get(0) + imag.get(2),
		real.get(1) + real.get(3), imag.get(1) + imag.get(3),
		real.get(0) - real.get(2), imag.get(0) - imag.get(2),
		imag.get(3) - imag.get(1), real.get(1) - real.get(3)];
	real.set(0, ns[0] + ns[2]); imag.set(0, ns[1] + ns[3]);
	real.set(1, ns[0] - ns[2]); imag.set(1, ns[1] - ns[3]);
	real.set(2, ns[4] + ns[6]); imag.set(2, ns[5] + ns[7]);
	real.set(3, ns[4] - ns[6]); imag.set(3, ns[5] - ns[7]);
}

export function fftN(size:number,
	real:ArrayView<number>, imag:ArrayView<number>,
	sin:ArrayView<number>, cos:ArrayView<number>,
) : void {
	if(size == 4) return fft4(real, imag);
	size >>= 1;
	let real0 = real.slice(0, 1);
	let imag0 = imag.slice(0, 1);
	let real1 = real.slice(size, 1);
	let imag1 = imag.slice(size, 1);
	for(let i = 0; i < size; ++i) {
		let nr = real0.get(i) - real1.get(i);
		let ni = imag0.get(i) - imag1.get(i);
		real0.set(i, real0.get(i) + real1.get(i));
		imag0.set(i, imag0.get(i) + imag1.get(i));
		real1.set(i, nr * cos.get(i) - ni * sin.get(i));
		imag1.set(i, nr * sin.get(i) + ni * cos.get(i));
	}
	fftN(size, real0, imag0, sin.slice(0, 2), cos.slice(0, 2));
	fftN(size, real1, imag1, sin.slice(0, 2), cos.slice(0, 2));
}

