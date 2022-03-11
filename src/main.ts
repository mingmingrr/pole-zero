import * as d3 from 'd3';

import { drag } from './drag';
import * as S from './state';
import { Roots } from './state';
import * as C from './complex';
import { Complex } from './complex';
import { polynomial, fft } from './fft';
import { rec } from './rec';
import { calculate } from './calculator';
import { ReprValue } from './util';
import * as R from './response';
import * as P from './polezero';

S.calculate(S.poles);
S.calculate(S.zeros);

R.plotSize();
R.plotAxisY();
R.plotAxisX();
R.plotLine();

P.plotSize();
P.plotAxisR();
P.plotAxisT();
P.plotPoles();
P.plotZeros();

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

function trace(...xs:any) {
	console.log(...xs);
	return xs[xs.length - 1];
}

