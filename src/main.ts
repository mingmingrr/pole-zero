import * as d3 from 'd3';

import { drag } from './drag';
import * as S from './state';
import { Roots } from './state';
import { Root } from './root';
import * as C from './complex';
import { Complex } from './complex';
import { polynomial, fft } from './fft';
import { rec } from './rec';
import { calculate } from './calculator';
import { Indexed, makeIndexed } from './util';

import * as R from './response';
import * as P from './polezero';
import * as L from './list';
import * as T from './root';

(window as any).S = S;

function trace(...xs:any) {
	console.log(...xs);
	return xs[xs.length - 1];
}

drag(document.getElementById('floaty-bar'), S.floaty.position, (event, x, y) => {
	let elem = document.getElementById('floaty');
	elem.style.left = x + 'px';
	elem.style.top = y + 'px';
});

drag(document.getElementById('floaty-corner'), S.floaty.size, (event, x, y) => {
	let elem = document.getElementById('floaty');
	elem.style.width = x + 'px';
	elem.style.height = y + 'px';
	P.plotSize();
	P.plotAxisR();
	P.plotAxisT();
	P.plotPoles();
	P.plotZeros();
}, undefined, (event, posn) => {
	posn.x = Math.max(150, posn.x);
	posn.y = Math.max(150, posn.y);
});

const slideTitle : Record<string, string> = {
	'slide-plot': 'Pole/Zero Plot',
	'slide-poles': 'Poles',
	'slide-zeros': 'Zeros',
	'slide-options': 'Options',
};

function slideSwitch(n:number) {
	const container = document.getElementById('floaty-slides');
	const slides = Array.from(container.children) as Array<HTMLElement>;
	slides[S.floaty.slide].style.display = '';
	S.floaty.slide = (n + slides.length) % slides.length;
	slides[S.floaty.slide].style.display = 'unset';
	document.getElementById('floaty-title').textContent =
		slideTitle[slides[S.floaty.slide].id];
};

slideSwitch(0);
for(let icon of [{name:'floaty-left', move:-1}, {name:'floaty-right', move:1}]) {
	document.getElementById(icon.name).addEventListener('click', (event:MouseEvent) => {
		event.preventDefault();
		slideSwitch(S.floaty.slide + icon.move);
	});
}

window.addEventListener('resize', (event:UIEvent) => {
	R.plotSize();
	R.plotAxisY();
	R.plotAxisX();
	R.plotLine();
});

let forms = document.forms.namedItem('options');

(forms.elements.namedItem('resolution') as HTMLInputElement)
	.addEventListener('input', (event:InputEvent) => {
		let target = event.target as HTMLInputElement;
		let value = Math.pow(2, parseInt(target.value));
		S.option.resolution = value;
		target.nextElementSibling.textContent = value.toString();
		S.poles.real = new Float64Array(value);
		S.poles.imag = new Float64Array(value);
		S.zeros.real = new Float64Array(value);
		S.zeros.imag = new Float64Array(value);
		S.response.abs = new Float64Array(1 + (value >> 1));
		R.plotAxisX();
		S.recalculate.forEach((f) => f(S.poles));
		S.recalculate.forEach((f) => f(S.zeros));
	});

T.create(S.option.gain,
	(forms.elements.namedItem('gain') as HTMLInputElement).parentElement,
	(event, root, node) => {
		if(root.error !== null) return;
		S.option.gain = root;
		S.recalculate.forEach((f) => f(S.poles));
	});

T.create(S.option.frequency,
	(forms.elements.namedItem('frequency') as HTMLInputElement).parentElement,
	(event, root, node) => {
		if(root.error !== null) return;
		S.option.frequency = root;
		R.plotAxisX();
	});

for(let snap of (forms.elements.namedItem('snap') as unknown as Array<HTMLInputElement>))
	snap.addEventListener('change', (event:InputEvent) => {
		let target = event.target as HTMLInputElement;
		S.option.snap[snap.value as keyof typeof S.option.snap] = snap.checked;
	});

S.recalculate.push(function(roots) {
	let target = forms.elements.namedItem('export') as HTMLInputElement;
	let zs = S.zeros.roots.map((r) => C.conjugates(r.value)).flat();
	let ps = S.poles.roots.map((r) => C.conjugates(r.value)).flat();
	let Bs = [].join.call(polynomial(zs)(), ', ');
	let As = [].join.call(polynomial(ps)(), ', ');
	target.value = `B = [${Bs}]\nA = [${As}]\n` +
		`zeros = [${zs.join(', ')}]\npoles = [${ps.join(', ')}]`
});

S.recalculate.push(function(roots:Roots) {
	let list:HTMLElement = ({
		zeros: document.getElementById('slide-zeros').querySelector('ul'),
		poles: document.getElementById('slide-poles').querySelector('ul'),
	} as Record<string,HTMLElement>)[roots.name]
	function onchange(event:InputEvent, root:Root, node:HTMLElement) {
		event.preventDefault();
		let repr = node.querySelector('input');
		let index = d3.select<HTMLElement,Indexed<Root>>(node).datum().index;
		roots.roots[index] = root;
		if(roots.roots.length - 1 === index && root.repr !== '' && root.error === null)
			roots.roots.push(new Root("", new Complex(0, 0)));
		if(root.repr === '')
			roots.roots.splice(index, 1);
		S.recalculate.forEach((f) => f(roots));
		if(root.error === null)
			repr.parentElement.nextElementSibling.querySelector('input').focus()
	}
	d3.select<HTMLElement,Array<Root>>(list)
		.selectAll('li').data(roots.roots.map(makeIndexed))
		.join((enter) => enter.append('li').each(
				function(t) { T.create(t.value, this, onchange); }),
			(update) => update.each(
				function(t) { T.render(t.value, this as HTMLElement); }),
			(exit) => exit.remove())
});

R.plotSize();
R.plotAxisX();

P.plotSize();
P.plotAxisR();
P.plotAxisT();

S.recalculate.forEach((f) => f(S.poles));
S.recalculate.forEach((f) => f(S.zeros));

