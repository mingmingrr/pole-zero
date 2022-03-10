import * as d3 from 'd3';

import * as S from './state';
import { Roots } from './state';
import * as C from './complex';
import { Complex } from './complex';
import { polynomial, fft } from './fft';
import { rec } from './rec';
import { calculate } from './calculator';
import { ReprValue } from './util';
import * as R from './response';

S.calculate(S.poles);
S.calculate(S.zeros);

R.plotSize();
R.plotAxisY();
R.plotAxisX();
R.plotLine();

function drag(elem:HTMLElement,
	posn:{x:number,y:number},
	func:(event:MouseEvent,x:number,y:number)=>void,
	end:(event:MouseEvent,posn:{x:number,y:number})=>void,
) : void {
	let listener = {
		move: null as (event:MouseEvent)=>void,
		up: null as (event:MouseEvent)=>void};
	elem.addEventListener('mousedown', function(event:MouseEvent) {
		if(listener.move !== null) return;
		event.preventDefault();
		posn.x -= event.clientX;
		posn.y -= event.clientY;
		window.addEventListener('mouseup', listener.up = function(event:MouseEvent) {
			if(listener === null) return;
			event.preventDefault();
			posn.x += event.clientX;
			posn.y += event.clientY;
			end(event, posn);
			window.removeEventListener('mousemove', listener.move);
			window.removeEventListener('mouseup', listener.up);
			listener = { move: null, up: null };
		});
		window.addEventListener('mousemove', listener.move = function(event) {
			event.preventDefault();
			func(event, posn.x + event.clientX, posn.y + event.clientY);
		});
	});
}

drag(document.getElementById('floaty-bar'), S.floaty.position, function(event, x, y) {
	let elem = document.getElementById('floaty');
	elem.style.left = x + 'px';
	elem.style.top = y + 'px';
}, function(event, posn) {});

drag(document.getElementById('floaty-corner'), S.floaty.size, function(event, x, y) {
	let elem = document.getElementById('floaty');
	elem.style.width = x + 'px';
	elem.style.height = y + 'px';
	// state.graph.polezero.plot.size();
	// state.graph.polezero.plot.axis.r();
	// state.graph.polezero.plot.axis.t();
	// state.graph.polezero.plot.plot.poles();
	// state.graph.polezero.plot.plot.zeros();
}, function(event, posn) {
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
	document.getElementById(icon.name).addEventListener('click', function(event) {
		event.preventDefault();
		slideSwitch(S.floaty.slide + icon.move);
	});
}

function trace(...xs:any) {
	console.log(...xs);
	return xs[xs.length - 1];
}

