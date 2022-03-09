class Thunk<a,b> {
	constructor(
		readonly func: (x:a) => b,
	) {}
}

function thunk<a,b>(func:(x:a)=>b) : Thunk<a,b> {
	return new Thunk(func);
}

function getter<a,b>(obj:a, key:keyof a, func:(obj:a)=>b) : (()=>b) {
	return function() {
		let x = func.call(obj, obj);
		Object.defineProperty(obj, key, { value: x });
		return x;
	};
}

export function rec<a,b>(func:(thunk:(func:(x:a)=>b)=>Thunk<a,b>)=>a) : a {
	let obj = func.call(thunk, thunk);
	for(let [key, value] of Object.entries(obj))
		if(value instanceof Thunk)
			Object.defineProperty(obj, key,
				{ get: getter<a,b>(obj, (key as keyof a), value.func) });
	return obj;
}

