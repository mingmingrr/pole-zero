import { closeto } from './util';
import * as S from './state';

export class Complex {
	constructor(
		public real: number,
		public imag: number
	) {}
	toString() {
		if(this.real === 0 && this.imag === 0) return '0';
		if(this.imag === 0) return this.real.toFixed(S.option.precision);
		if(this.real === 0) this.imag.toFixed(S.option.precision) + 'j';
		return `${this.real.toFixed(S.option.precision)}` +
			`${this.imag>0 ? '+' : '-'}${Math.abs(this.imag).toFixed(S.option.precision)}j`;
	}
}

export class Polar {
	constructor(
		public mod: number,
		public arg: number
	) {}
	toString() {
		if(this.mod === 0) return '0';
		if(Math.abs(this.mod - 1) < 1e-9) return `e^(${this.arg.toFixed(S.option.precision)}j)`;
		if(this.arg === 0) return this.mod.toFixed(S.option.precision);
		return `${this.mod.toFixed(S.option.precision)}e^(${this.arg.toFixed(S.option.precision)}j)`;
	}
}

export function conjugates(x:Complex) : Array<Complex> {
	return Math.abs(x.imag) < 1e-9 ? [x] : [x, conj(x)];
}

export function cartesian(x:Polar) : Complex {
	return new Complex(x.mod * Math.cos(x.arg), x.mod * Math.sin(x.arg));
}

export function polar(x:Complex) : Polar {
	return new Polar(Math.hypot(x.real, x.imag), Math.atan2(x.imag, x.real));
}

export function abs(x:Complex) : Complex {
	return new Complex(Math.hypot(x.real, x.imag), 0);
}

export function angle(x:Complex) : Complex {
	return new Complex(Math.atan2(x.imag, x.real), 0);
}

export function conj(x:Complex) : Complex {
	return new Complex(x.real, -x.imag);
}

export function real(x:Complex) : Complex {
	return new Complex(x.real, 0);
}

export function imag(x:Complex) : Complex {
	return new Complex(x.imag, 0);
}

export function negate(x:Complex) : Complex {
	return new Complex(-x.real, -x.imag);
}

export function add(x:Complex, y:Complex) : Complex {
	return new Complex(x.real + y.real, x.imag + y.imag);
}

export function sub(x:Complex, y:Complex) : Complex {
	return new Complex(x.real - y.real, x.imag - y.imag);
}

export function mul(x:Complex, y:Complex) : Complex {
	return new Complex(
		x.real * y.real - x.imag * y.imag,
		x.real * y.imag + x.imag * y.real);
}

export function div(x:Complex, y:Complex) : Complex {
	let d = y.real * y.real + y.imag * y.imag;
	return new Complex(
		(x.real * y.real + x.imag * y.imag) / d,
		(x.imag * y.real - x.real * y.imag) / d);
}

export function mod(x:Complex, y:Complex) : Complex {
	let m = y.real ? x.real % y.real : x.imag % y.imag;
	return new Complex(x.real - m * y.real, x.imag - m * y.imag);
}

export function pow(x:Complex, y:Complex) : Complex {
	// e^(ln(r)(c+id) + iθ(c+id))
	// e^(ln(r)c - θd + ln(r)id + θic)
	let p = polar(x);
	let a = Math.log(p.mod);
	return exp(new Complex(
		a * y.real - p.arg * y.imag,
		a * y.imag + p.arg * y.real));
}

export function sin(x:Complex) : Complex {
	return new Complex(
		Math.sin(x.real) * Math.cosh(x.imag),
		Math.cos(x.real) * Math.sinh(x.imag));
}

export function cos(x:Complex) : Complex {
	return new Complex(
		Math.cos(x.real) * Math.cosh(-x.imag),
		-Math.sin(-x.real) * Math.sinh(x.imag));
}

export function tan(x:Complex) : Complex {
	let d = Math.cos(2 * x.real) + Math.cosh(2 * x.imag);
	return new Complex(Math.sin(2 * x.real) / d, Math.sinh(2 * x.imag) / d);
}

export function asin(x:Complex) : Complex {
	// arcsin(z) = 1/i ln(iz + |1-z^2|^1/2 e^(i/2 arg(1−z^2)))
	let p = polar(sub(mul(x, x), new Complex(0, 1)));
	p = new Polar(Math.sqrt(p.mod), -p.arg / 2);
	let l = ln(add(cartesian(p), new Complex(-x.imag, x.real)));
	return new Complex(l.imag, -l.real);
}

export function acos(x:Complex) : Complex {
	// arccos(z) = 1/i ln(z + |z^2-1|^1/2 e^(i/2 arg(z^2−1))
	let p = polar(sub(mul(x, x), new Complex(0, 1)));
	p = new Polar(Math.sqrt(p.mod), p.arg / 2);
	let l = ln(add(cartesian(p), x));
	return new Complex(l.imag, -l.real);
}

export function atan(x:Complex) : Complex {
	// arctan(z) = 1/2i ln((i-z) / (i+z))
	let i = new Complex(0, 1);
	let l = ln(div(sub(i, x), add(i, x)));
	return new Complex(l.imag / 2, -l.real / 2);
}

export function ln(x:Complex) : Complex {
	let p = polar(x);
	return new Complex(Math.log(p.mod), Math.log(p.arg));
}

export function exp(x:Complex) : Complex {
	let a = Math.exp(x.real);
	return new Complex(a * Math.cos(x.imag), a * Math.sin(x.imag));
}

export function sqrt(x:Complex) : Complex {
	return pow(x, new Complex(0.5, 0))
};

