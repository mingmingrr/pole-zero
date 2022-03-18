import { Complex } from './complex';
import * as C from './complex';

export function pretty(poly:Array<Complex>) : string {
	return poly.map((x, i) => {
		if(i == 0) return '' + x;
		if(i == 1) return x + ' x';
		return `${x} x^${i}`;
	}).reverse().join(' + ');
}

export function fromRoots(roots:Array<Complex>) : Array<Complex> {
	let poly = [ C.one() ];
	for(let root of roots) {
		if(C.isZero(root)) continue;
		poly.push(C.zero());
		for(let i = poly.length - 1; i > 0; --i)
			poly[i] = C.add(poly[i], C.mul(C.negate(root), poly[i-1]));
	}
	return poly.reverse();
}

export function divide(poly:Array<Complex>, root:Complex) : Array<Complex> {
	let rem = [ C.zero() ];
	for(let i = poly.length - 1; i > 0; --i)
		rem.push(C.add(poly[i], C.mul(rem[rem.length-1], root)));
	rem = rem.reverse();
	rem.pop();
	return rem;
}

export function halley(poly:Array<Complex>, root:Complex, eps:number=1e-10) : Complex {
	let f0 = C.zero();
	for(let i = 0, x = C.one(); i < poly.length; ++i, x = C.mul(x, root))
		f0 = C.add(f0, C.mul(poly[i], x));
	let f1 = C.zero();
	for(let i = 1, x = C.one(); i < poly.length; ++i, x = C.mul(x, root))
		f1 = C.add(f1, C.mul(C.mul(new Complex(i, 0), poly[i]), x));
	let f2 = C.zero();
	for(let i = 2, x = C.one(); i < poly.length; ++i, x = C.mul(x, root))
		f2 = C.add(f2, C.mul(C.mul(new Complex(i * i - 1, 0), poly[i]), x));
	// x{n+1} = xn - (2 f(xn) f'(xn)) / (2 f'(xn)^2 - f(xn) f''(xn))
	return C.sub(root, C.div(
		C.mul(C.mul(C.two(), f0), f1),
		C.sub(C.mul(C.mul(C.two(), f1), f1), C.mul(f0, f2))
	));
}

export function findRoot(poly:Array<Complex>, eps:number=1e-10) : Complex {
	for(let tries = 0; tries < 100; ++tries) {
		let root = new Complex(
			Math.random() * Math.pow(10, 3 * Math.random()),
			Math.random() * Math.pow(10, 3 * Math.random()));
		for(let iters = 0, diff = Infinity, ratio = 1;
				iters < 10 || ratio < 0.95; ++iters) {
			let next = halley(poly, root, eps);
			if(!Number.isFinite(root.real) || !Number.isFinite(root.imag))
				{ console.info('findRoot: non-finite', root); break; }
			let delta = C.abs(C.sub(root, next)).real;
			if(delta < eps) return next;
			[root, ratio, diff] = [next, delta / diff, delta];
		}
	}
	throw 'findRoot: too many tries';
}

export function findRoots(poly:Array<Complex>, eps:number=1e-10) : Array<Complex> {
	let roots = [];
	while(poly.length > 1) {
		let root = findRoot(poly);
		roots.push(root);
		poly = divide(poly, root);
	}
	roots.sort(C.compare);
	return roots as Array<Complex>;
}

