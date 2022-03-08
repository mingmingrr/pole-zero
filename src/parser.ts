export class ParseError {
	constructor(
		readonly index:number,
		readonly expected:Array<string>,
	) {}
}

export class ParseResult<a> {
	constructor(
		readonly index:number,
		readonly value:a,
	) {}
}

export type Parser<a> = (str:string, idx:number) => ParseResult<a>;

// <?>
export function label<a>(name:string, p:Parser<a>) : Parser<a> {
	return recover(p, (err) => (str, idx) => {
		throw new ParseError(err.index, [name]);
	});
}

// withRecovery
export function recover<a>(p:Parser<a>, f:(e:ParseError)=>Parser<a>) : Parser<a> {
	return function(str, idx) {
		try {
			return p(str, idx);
		} catch(err) {
			if(!(err instanceof ParseError)) throw err;
			return f(err)(str, idx);
		}
	};
}

// notFollowedBy
export function not<a>(p:Parser<a>) : Parser<null> {
	return function(str, idx) {
		try {
			p(str, idx);
		} catch(err) {
			if(!(err instanceof ParseError)) throw err;
			return new ParseResult(idx, null);
		}
		throw new ParseError(idx, []);
	};
}

// optional
export function optional<a>(p:Parser<a>) : Parser<a|null> {
	return recover(p, (err) => (str, idx) => new ParseResult(idx, null));
}

// anySingle
export function single(str:string, idx:number) : ParseResult<string> {
	if(idx >= str.length) throw new ParseError(idx, ['any token']);
	return new ParseResult(idx + 1, str[idx]);
}

// mfilter
export function filter<a>(p:Parser<a>, f:(x:a)=>boolean) : Parser<a> {
	return function(str, idx) {
		let r = p(str, idx);
		if(!f(r.value)) throw new ParseError(idx, []);
		return r;
	}
}

// sepby1
export function sepby<a,b>(p:Parser<a>, s:Parser<b>)
		: Parser<{term:a, tail:Array<{sep:b, term:a}>}> {
	return bind(p, (x) => map(many(map(then(s, p),
		(r) => ({sep:r.x, term:r.y}))),
		(y) => ({term:x, tail:y})));
}

// satisfy
export function satisfy<a>(f:(x:string)=>boolean) : Parser<string> {
	return function(str, idx) {
		if(!f(str[idx])) throw new ParseError(idx, []);
		return new ParseResult(idx + 1, str[idx]);
	}
}

// chunk
export function string<a>(s:string) : Parser<string> {
	return function(str, idx) {
		if(str.slice(idx, idx + s.length) != s)
			throw new ParseError(idx, [JSON.stringify(s)]);
		return new ParseResult(idx + s.length, s);
	}
}

// sequence
export function sequence(ps:Array<Parser<any>>) : Parser<Array<any>> {
	return function(str, idx) {
		let rs = ps.map((p) => {
			let r = p(str, idx);
			idx = r.index;
			return r.value
		});
		return new ParseResult(idx, rs);
	}
}

// flip ((!!) . sequence)
export function nth(ps:Array<Parser<any>>, n:number) : Parser<any> {
	return map(sequence(ps), (xs) => xs[n]);
}

////////////////////////////////////////////////////////////////////////////////
// monadic interface
////////////////////////////////////////////////////////////////////////////////

// <|>
export function or<a>(x:Parser<a>, y:Parser<a>) : Parser<a> {
	return recover(x, (err1) => recover(y, (err2) => {
		if(err1.index > err2.index) throw err1;
		if(err1.index < err2.index) throw err2;
		throw new ParseError(err1.index,
			[].concat.call(err1.expected, err2.expected));
	}));
}

// choice
export function choice<a>(ps:Array<Parser<a>>) : Parser<a> {
	return ps.reduce(or);
}

// <$>
export function map<a,b>(p:Parser<a>, f:(x:a)=>b) : Parser<b> {
	return function(str, idx) {
		let {index, value} = p(str, idx);
		return new ParseResult(index, f(value));
	};
}

// liftM2 (,)
export function then<a,b>(x:Parser<a>, y:Parser<b>) : Parser<{x:a, y:b}> {
	return function(str, idx) {
		let res1 = x(str, idx);
		let res2 = y(str, res1.index);
		return new ParseResult(res2.index, {x:res1.value, y:res2.value});
	};
}

// <<
export function first<a,b>(x:Parser<a>, y:Parser<b>) : Parser<a> {
	return map(then(x, y), (r) => r.x);
}

// >>
export function second<a,b>(x:Parser<a>, y:Parser<b>) : Parser<b> {
	return map(then(x, y), (r) => r.y);
}

// >>=
export function bind<a,b>(p:Parser<a>, f:(x:a)=>Parser<b>) : Parser<b> {
	return function(str, idx) {
		let r = p(str, idx);
		return f(r.value)(str, r.index);
	};
}

// many
export function many<a>(p:Parser<a>) : Parser<Array<a>> {
	p = optional(p);
	return function(str, idx) {
		let xs = [];
		while(true) {
			let r = p(str, idx);
			if(r.value == null)
				return new ParseResult(idx, xs);
			idx = r.index;
			xs.push(r.value);
		}
	};
}

////////////////////////////////////////////////////////////////////////////////
// expr parser
////////////////////////////////////////////////////////////////////////////////

export function prefix<a>(term:Parser<a>, op:Parser<(x:a)=>a>) : Parser<a> {
	return map(then(many(op), term),
		(r) => r.x.reverse().reduce((x, f) => f(x), r.y));
}

export function postfix<a>(term:Parser<a>, op:Parser<(x:a)=>a>) : Parser<a> {
	return map(then(term, many(op)),
		(r) => r.y.reduce((x, f) => f(x), r.x));
}

export function infixn<a>(term:Parser<a>, op:Parser<(x:a,y:a)=>a>) : Parser<a> {
	return bind(term, (x) => map(optional(then(op, term)),
		(r) => r == null ? x : r.x(x, r.y)));
}

export function infixl<a>(term:Parser<a>, op:Parser<(x:a,y:a)=>a>) : Parser<a> {
	return bind(term, (x) => map(many(then(op, term)),
		(rs) => rs.reduce((a, b) => b.x(a, b.y), x) ));
}

////////////////////////////////////////////////////////////////////////////////
// common parsers
////////////////////////////////////////////////////////////////////////////////

export function eof(str:string, idx:number) : ParseResult<null> {
	if(idx < str.length) throw new ParseError(idx, ['EOF']);
	return new ParseResult(idx, null);
}

export function forward<a>(p:()=>Parser<a>) : Parser<a> {
	let cache : Parser<a>|null = null;
	return function(str, idx) {
		if(cache == null) cache = p();
		return cache(str, idx);
	}
}

export function regex(regex:RegExp) : Parser<RegExpExecArray> {
	return function(str:string, idx:number) {
		regex.lastIndex = idx;
		let match = regex.exec(str);
		if(!match) throw new ParseError(idx, [regex.toString()]);
		return new ParseResult(idx + match[0].length, match);
	}
}

export const number : Parser<number> = label('number',
	map(regex(/\d+(\.\d*)?(e[+-]?\d+)?/y), (x) => parseFloat(x[0])));

export const identifier : Parser<string> = label('identifier',
	map(regex(/\w+/y), (x) => x[0]));

export function lexeme<a>(p:Parser<a>) : Parser<a> {
	return first(p, regex(/\s*/y));
}

