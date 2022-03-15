import { Complex, polar } from './complex';
import { calculate } from './calculator';

export class Root {
	constructor(
		public repr: string,
		public value: Complex,
		public error: null|string = null,
	) {}
	toString() {
		if(this.error !== null)
			return this.error;
		if(this.repr.includes('e'))
			return C.polar(this.value).toString()
		return this.value.toString()
	}
}

export function create(root:Root, node:HTMLElement,
		onchange:(event:InputEvent, root:Root, node:HTMLElement) => void) {
	let repr = node.querySelector('input') as HTMLInputElement;
	if(repr === null) {
		repr = document.createElement('input');
		node.appendChild(repr);
	};
	if(node.querySelector('br') === null)
		node.appendChild(document.createElement('br'));
	if(node.querySelector('span') === null)
		node.appendChild(document.createElement('span'));
	repr.addEventListener('change', function(event:InputEvent) {
		event.preventDefault();
		try {
			let root = new Root(repr.value, calculate(repr.value), null);
			node.querySelector('span').textContent = root.toString();
			return onchange(event, root, node);
		} catch(err) {
			if (!(err instanceof ParseError)) throw err;
			let message = `ParseError: expected ${err.message()} at index ${err.last().index}`;
			node.querySelector('span').textContent = message;
			return onchange(event, new Root(repr.value, new Complex(0, 0), message), node);
		}
	});
	render(root, node);
}

export function render(root:Root, node:HTMLElement) {
	let repr = node.querySelector("input");
	let text = node.querySelector("span");
	repr.value = root.repr;
	text.style.display = root.repr === '' ? 'none' : "";
	text.classList.toggle('error', root.error !== null);
	text.classList.toggle('value', root.error === null);
	text.textContent = root.toString();
}

