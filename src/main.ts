import * as d3 from 'd3';

import { Complex } from './complex';
import * as C from './complex';
import { fft } from './fft';
import * as F from './fft';
// import * as P from './calculator';

// console.log('fft');
// (window as any).parse = P.calculate;
// (window as any).F = F;
// (window as any).C = C;

class StringValue {
	constructor(
		readonly repr:string,
		readonly value:string,
	) {}
}

type Selection<a> = d3.Selection<a, any, HTMLElement, any>;

const state = {
	poles: [] as Array<StringValue>,
	zeros: [] as Array<StringValue>,
	floaty: {
		position: { x: 0, y: 0 },
		size: { x: 300, y: 300 },
		slide: 0,
	},
	frequency: StringValue,
	resolution: 256,
	gain: 1,
	axis: 'Linear',
	graph: {
		polezero: {
			margin: { top: 0, right: 0, bottom: 0, left: 0 },
			size: { width: 500, height: 300 },
			scale: {
				x: d3.scaleLinear().range([0, 300]).domain([-1.2, 1.2]),
				y: d3.scaleLinear().range([0, 300]).domain([-1.2, 1.2]),
			},
			svg: d3.select('#freq-response').append('svg')
				.attr('width', 570).attr('height', 350),
			graph: null as Selection<SVGGElement>,
			axis: {
				x: null as d3.Selection<SVGGElement, any, HTMLElement, any>,
				y: null as d3.Selection<SVGGElement, any, HTMLElement, any>,
			},
		},
		response: {
			margin: { top: 20, right: 20, bottom: 30, left: 50 },
			size: { width: 500, height: 300 },
			scale: {
				x: d3.scaleLinear().range([0, 500]).domain([0, 256]),
				y: d3.scaleLinear().range([300, 0]).domain([0, 4]),
			},
			svg: d3.select('#freq-response').append('svg')
				.attr('width', 570).attr('height', 350),
			graph: null as d3.Selection<SVGGElement, any, HTMLElement, any>,
			axis: {
				x: null as d3.Selection<SVGGElement, any, HTMLElement, any>,
				y: null as d3.Selection<SVGGElement, any, HTMLElement, any>,
			},
			line: null as d3.Line<number>,
			path: null as Selection<SVGPathElement>,
		},
	},
};

state.graph.response.graph = state.graph.response.svg.append('g')
	.classed('graph', true)
	.attr('transform', `translate(30, 20)`);

state.graph.response.axis.x = state.graph.response.graph.append('g')
	.classed('x-axis', true)
	.attr('transform', `translate(0, 300)`)
	.call(d3.axisBottom(state.graph.response.scale.x.copy().domain([0, 1])));

state.graph.response.axis.y = state.graph.response.graph.append('g')
	.classed('y-axis', true)
	.call(d3.axisLeft(state.graph.response.scale.y));

state.graph.response.line = d3.line<number>()
	.x((n, i) => state.graph.response.scale.x(i))
	.y((n) => state.graph.response.scale.y(n));

state.graph.response.path = state.graph.response.graph.append('path')
	.datum(data)
	.attr('fill', 'none')
	.attr('stroke', 'steelblue')
	.attr('stroke-width', 1.5)
	.attr('d', line);


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

drag(document.getElementById('floaty-bar'), state.floaty.position, function(event, x, y) {
	let elem = document.getElementById('floaty');
	elem.style.left = x + 'px';
	elem.style.top = y + 'px';
}, function(event, posn) {});

drag(document.getElementById('floaty-corner'), state.floaty.size, function(event, x, y) {
	let elem = document.getElementById('floaty');
	elem.style.width = x + 'px';
	elem.style.height = y + 'px';
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
	const slides = Array.from(document.getElementById('floaty-slides')
		.children) as Array<HTMLElement>;
	slides[state.floaty.slide].style.display = '';
	state.floaty.slide = (n + slides.length) % slides.length;
	slides[state.floaty.slide].style.display = 'unset';
	document.getElementById('floaty-title').textContent =
		slideTitle[slides[state.floaty.slide].id];
};

slideSwitch(0);
for(let icon of [{name:'floaty-left', move:-1}, {name:'floaty-right', move:1}]) {
	document.getElementById(icon.name).addEventListener('click', function(event) {
		event.preventDefault();
		slideSwitch(state.floaty.slide + icon.move);
	});
}

let xs = Array(256).fill(0);
xs[0] = xs[2] = 1;
xs[1] = -Math.sqrt(2);
let data = F.fft(256, xs, Array(256).fill(0));

function trace(...xs:any) {
	console.log(...xs);
	return xs[xs.length - 1];
}

