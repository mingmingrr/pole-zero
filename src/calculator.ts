import { Complex } from "./complex";
import * as C from "./complex";
import { Parser } from "./parser";
import * as P from "./parser";

const string = (s:string) : Parser<string> => P.lexeme(P.string(s));

const constants : Map<string, Complex> = new Map(Object.entries({
	i: new Complex(0, 1),
	j: new Complex(0, 1),
	e: new Complex(Math.E, 0),
	pi: new Complex(Math.PI, 0),
}));

const function1 : Map<string, (x:Complex)=>Complex> = new Map(Object.entries({
	'+':  (x) => x,
	'-':  C.negate,
	abs:  C.abs,
	conj: C.conjugate,
	sin:  C.sin,
	cos:  C.cos,
	tan:  C.tan,
	asin: C.asin,
	acos: C.acos,
	atan: C.atan,
	ln:   C.ln,
	exp:  C.exp,
	sqrt: C.sqrt,
	real: (x) => new Complex(x.real, 0),
	imag: (x) => new Complex(x.imag, 0),
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
	P.map(P.sequence([P.lexeme(P.filter(P.identifier, (n) => function1.has(n))),
		string('('), P.forward(expression), string(')')]),
		(xs) => function1.get(xs[0])(xs[2])),
	// 2-arg function
	P.map(P.sequence([P.lexeme(P.filter(P.identifier, (n) => function2.has(n))),
		string('('), P.forward(expression), string(','), P.forward(expression), string(')')]),
		(xs) => function2.get(xs[0])(xs[2], xs[4])),
	// parenthesis
	P.nth([string('('), P.lexeme(P.forward(expression)), string(')')], 1),
]);

const operators : Array<(p:Parser<Complex>)=>Parser<Complex>> = [
	// implicit multiplication (e.g. "2 pi i")
	(term) => P.postfix(term,
		P.map(term, (x) => (y) => C.mul(x, y))),
	// sign prefix
	(term) => P.prefix(term,
		P.map(P.regex(/([+-])/y), (r) => function1.get(r[1]))),
	// power
	(term) => P.infixl(term,
		P.map(P.regex(/(\^)\s*/y), (r) => function2.get(r[1]))),
	// explicit multiplication + multiplicitive terms
	(term) => P.infixl(term,
		P.map(P.regex(/([%*\/])\s*/y), (r) => function2.get(r[1]))),
	// additive terms
	(term) => P.infixl(term,
		P.map(P.regex(/([+\-])\s*/y), (r) => function2.get(r[1])))
];

const termtop : Parser<Complex> = operators.reduce((x, f) => f(x), term);

function expression() : Parser<Complex> { return termtop; }

export const calculate : (x:string) => Complex =
	(x) => P.first(expression(), P.eof)(x, 0).value;

