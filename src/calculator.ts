import { Complex } from './complex';
import * as C from './complex';
import { Parser } from './parser';
import * as P from './parser';
import { Root } from './root';
import { findRoots } from './polynomial';

export const complex : Parser<Complex> = P.forward(expression);

function expression() : Parser<Complex> { return termtop; }

const string = (s:string) : Parser<string> => P.lexeme(P.string(s));

const constants : Map<string, Complex> = new Map(Object.entries({
	i: new Complex(0, 1),
	j: new Complex(0, 1),
	e: new Complex(Math.E, 0),
	pi: new Complex(Math.PI, 0),
}));

const function1 : Map<string, (x:Complex)=>Complex> = new Map(Object.entries({
	'+':   (x) => x,
	'-':   C.negate,
	abs:   C.abs,
	angle: C.angle,
	conj:  C.conj,
	real:  C.real,
	imag:  C.imag,
	sin:   C.sin,
	cos:   C.cos,
	tan:   C.tan,
	asin:  C.asin,
	acos:  C.acos,
	atan:  C.atan,
	ln:    C.ln,
	exp:   C.exp,
	sqrt:  C.sqrt,
}));

const function2 : Map<string, (x:Complex,y:Complex)=>Complex> = new Map(Object.entries({
	'+': C.add,
	add: C.add,
	'-': C.sub,
	sub: C.sub,
	'':  C.mul,
	'*': C.mul,
	mul: C.mul,
	'/': C.div,
	div: C.div,
	'%': C.mod,
	mod: C.mod,
	'^': C.pow,
	pow: C.pow,
}));

const term : Parser<Complex> = P.choice([
	// number
	P.map(P.lexeme(P.number), (n) => new Complex(n, 0)),
	// constant
	P.map(P.filter(P.lexeme(P.identifier),
		(n) => constants.has(n)), (n) => constants.get(n)),
	// 1-arg function
	P.label('function', P.map(P.sequence(
		P.lexeme(P.filter(P.identifier, (n) => function1.has(n))),
		string('('), complex, string(')')),
		(xs) => function1.get(xs[0])(xs[2]))),
	// 2-arg function
	P.label('function', P.map(P.sequence(
		P.lexeme(P.filter(P.identifier, (n) => function2.has(n))),
		string('('), complex, string(','), complex, string(')')),
		(xs) => function2.get(xs[0])(xs[2], xs[4]))),
	// parenthesis
	P.map(P.sequence(string('('), P.lexeme(complex), string(')')), (xs) => xs[1]),
]);

const operators : Array<(p:Parser<Complex>)=>Parser<Complex>> = [
	// implicit multiplication (e.g. "2 pi i")
	(term) => P.postfix(term,
		P.map(term, (x) => (y) => C.mul(x, y))),
	// sign prefix
	(term) => P.prefix(term,
		P.map(P.label(['"+"', '"-"'], P.regex(/([+-])/y)), (r) => function1.get(r[1]))),
	// power
	(term) => P.infixl(term,
		P.map(P.label('"^"', P.regex(/(\^)\s*/y)), (r) => function2.get(r[1]))),
	// explicit multiplication + multiplicitive terms
	(term) => P.infixl(term,
		P.map(P.label(['"*"', '"/"', '"%"'], P.regex(/([%*\/])\s*/y)), (r) => function2.get(r[1]))),
	// additive terms
	(term) => P.infixl(term,
		P.map(P.label(['"+"', '"-"'], P.regex(/([+\-])\s*/y)), (r) => function2.get(r[1])))
];

const termtop : Parser<Complex> = operators.reduce((x, f) => f(x), term);

export const root : Parser<Root> = P.map(P.observe(complex),
	(x) => new Root(x.input, x.value));

export const importExprs : Parser<Record<string,Array<Root>>> = P.forward(() => {
	let name : Parser<string> = P.map(P.regex(/pole|zero|B|A/y), (x) => x[0]);
	let header : Parser<RegExpExecArray> = P.label('"= ["', P.regex(/\s*=\s*\[\s*/y));
	let exprs : Parser<Array<Root>> = P.sepby$(root, P.lexeme(P.string(',')), false, true);
	let footer : Parser<RegExpExecArray> =
		P.label('"]"', P.regex(/\][ \t]*/y));
	let parser : Parser<Array<{name:string,value:Array<Root>}>> = P.sepby$(
		P.map(P.sequence(name, header, exprs, footer), (xs) => ({ name: xs[0], value: xs[2] })),
		P.label(['newline', '";"'], P.regex(/[\n;]+\s*/y)), false, true);
	function collate(results:Array<{name:string,value:Array<Root>}>) {
		let result : Record<string,Array<Root>> =
			{ poles: null, zeros: null };
		for(let {name, value} of results) {
			if(name === 'A' || name === 'B') {
				name = name === 'A' ? 'poles' : 'zeros';
				value = findRoots(value.map((x) => x.value))
					.map((x) => new Root(x.toString(), x, null));
			}
			let roots = [] as Array<Root>;
			for(let i = 0; i < value.length; ++i) {
				if(i < value.length - 1) {
					roots.push(value[i]);
					if(C.equal(value[i].value, C.conj(value[i+1].value), 1e-6))
						++i;
				} else
					roots.push(value[i]);
			}
			result[name] = roots;
		}
		return result;
	}
	return P.map(parser, collate);
});

