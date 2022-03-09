import * as d3 from 'd3';

import { Complex } from './complex';
import * as C from './complex';
import { fft } from './fft';
import * as F from './fft';
import { rec } from './rec';

// import * as P from './calculator';

// console.log('fft');
// (window as any).parse = P.calculate;
// (window as any).F = F;
// (window as any).C = C;

class ReprValue<a> {
	constructor(
		readonly repr:string,
		readonly value:a,
	) {}
}

const state = {
	poles: [] as Array<ReprValue<Complex>>,
	zeros: [
		new ReprValue('e^(pi*i/4)', new Complex(Math.SQRT1_2, Math.SQRT1_2)),
	] as Array<ReprValue<Complex>>,
	floaty: {
		position: { x: 0, y: 0 },
		size: { x: 400, y: 400 },
		slide: 0,
	},
	response: {
		poles: {
			real: new Float64Array(256),
			imag: new Float64Array(256),
			resp: new Float64Array(129),
		},
		zeros: {
			real: new Float64Array(256),
			imag: new Float64Array(256),
			resp: new Float64Array(129),
		},
		resp : new Float64Array(129),
	},
	calc: {
		poles: function () {},
		zeros: function () {},
	},
	frequency: new ReprValue('pi', new Complex(Math.PI, 0)),
	gain: new ReprValue('pi', new Complex(Math.PI, 0)),
	resolution: 256,
	axis: 'Linear',
	graph: {
		polezero: rec((rec:any) => ({
			margin: { top: 0, right: 0, bottom: 0, left: 0 },
			size: { width: 500, height: 300, diameter: 300 },
			scale: {
				r: d3.scaleLinear().range([0, 300]).domain([0, 1.2]),
				t: d3.scaleLinear().range([0, 360]).domain([0, 360]),
			},
			svg: d3.select('#pole-zero').append('svg')
				.attr('width', 570).attr('height', 350),
			graph: rec((rec:any) => rec.svg.append('g').classed('graph', true)
				.attr('transform', `translate(30, 20)`)),
			axis: rec((rec:any) => ({
				r: rec.graph.append('g').classed('r-axis', true),
				t: rec.graph.append('g').classed('t-axis', true),
			})),
			poles: rec((rec:any) => rec.graph.append('g').classed('poles', true)),
			zeros: rec((rec:any) => rec.graph.append('g').classed('zeros', true)),
			plot: rec((rec:any) => ({
				size: function() {
					let slides = document.getElementById('floaty-slides');
					let width = slides.clientWidth;
					let height = slides.clientHeight
					rec.size.width = width - rec.margin.left - rec.margin.right;
					rec.size.height = height - rec.margin.top - rec.margin.bottom;
					rec.size.diameter = Math.min(rec.size.width, rec.size.height);
					rec.svg.attr('width', width).attr('height', height);
					rec.graph.attr('transform', `translate(${width/2}, ${height/2})`);
				},
				axis: {
					r: function() {
						rec.scale.r.range([0, rec.size.diameter / 2]);
						function update(tick:any) {
							tick.classed('unit', (x:number) => x == 1);
							tick.select('circle').attr('r', rec.scale.r);
							tick.select('text')
								.attr('y', (n:number) => -rec.scale.r(n))
								.attr('transform', 'rotate(-15)')
								.text((n:number) => n);
						};
						rec.axis.r.selectAll('.tick')
							.data(rec.scale.r.ticks(6))
							.join((enter:any) => {
								let tick = enter.append('g').classed('tick', true);
								tick.append('circle');
								tick.append('text');
								update(tick);
							}, update, (exit:any) => exit.remove());
					},
					t: function() {
						function update(tick:any) {
							tick.select('line').attr('x2', rec.size.diameter / 2);
						};
						let ticks = rec.axis.t.selectAll('g')
							.data(d3.range(0, 360, 30)).join((enter:any) => {
								let tick = enter.append('g').classed('tick', true)
									.attr('transform', (d:number) => `rotate(${-d})`);
								tick.append('line').attr('x1', 8);
								update(tick);
							}, update, (exit:any) => exit.remove());
					}
				},
				plot: function() {
					// rec.path.attr('d', rec.line);
				},
			})),
		})),
		response: rec((rec:any) => ({
			margin: { top: 20, right: 20, bottom: 30, left: 50 },
			size: { width: 500, height: 300 },
			scale: {
				x: d3.scaleLinear().range([0, 500]).domain([0, 128]),
				y: d3.scaleLinear().range([300, 0]).domain([0, 4]),
			},
			svg: d3.select('#freq-response').append('svg'),
			graph: rec((rec:any) => rec.svg.append('g').classed('graph', true)
				.attr('transform', `translate(30, 20)`)),
			axis: rec((rec:any) => ({
				x: rec.graph.append('g').classed('x-axis', true),
				y: rec.graph.append('g').classed('y-axis', true),
			})),
			line: rec((rec:any) => d3.line<number>()
				.x((n, i) => rec.scale.x(i))
				.y((n) => rec.scale.y(n))),
			path: rec((rec:any) => rec.graph.append('path')
				.datum(state.response.resp)
				.attr('stroke-width', 1.5)),
			plot: rec((rec:any) => ({
				size: function() {
					let width = window.innerWidth;
					let height = window.innerHeight
					rec.size.width = width - rec.margin.left - rec.margin.right;
					rec.size.height = height - rec.margin.top - rec.margin.bottom;
					rec.svg.attr('width', width).attr('height', height);
				},
				axis: {
					x: function() {
						rec.scale.x.range([0, rec.size.width])
							.domain([0, state.resolution >> 1]);
						let scale = rec.scale.x.copy()
							.domain([0, state.frequency.value.real]);
						rec.axis.x.call(d3.axisBottom(scale)
							.tickSizeInner(-rec.size.height).tickSizeOuter(0));
						rec.axis.x.attr('transform', `translate(0, ${rec.size.height})`);
					},
					y: function() {
						let max = [].reduce.call(state.response.resp,
							(x:number, y:number) => Math.max(x, y));
						rec.scale.y.range([rec.size.height, 0]).domain([0, max]);
						rec.axis.y.call(d3.axisLeft(rec.scale.y)
							.tickSizeInner(-rec.size.width).tickSizeOuter(0));
					},
				},
				plot: function() {
					rec.path.attr('d', rec.line);
				},
			})),
		})),
	},
};


state.response.poles.real[0] = 1;
F.fft(256,
	state.response.poles.real,
	state.response.poles.imag,
	state.response.poles.resp);

state.response.zeros.real[0] = 1;
state.response.zeros.real[1] = -Math.sqrt(2);
state.response.zeros.real[2] = 1;
F.fft(256,
	state.response.zeros.real,
	state.response.zeros.imag,
	state.response.zeros.resp);

for(let i = 0; i < 129; ++i)
	state.response.resp[i] =
		state.response.zeros.resp[i] / state.response.poles.resp[i];

state.graph.polezero.plot.size();
state.graph.polezero.plot.axis.r();
state.graph.polezero.plot.axis.t();
state.graph.polezero.plot.plot();

state.graph.response.plot.size();
state.graph.response.plot.axis.x();
state.graph.response.plot.axis.y();
state.graph.response.plot.plot();

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
	state.graph.polezero.plot.size();
	state.graph.polezero.plot.axis.r();
	state.graph.polezero.plot.axis.t();
	state.graph.polezero.plot.plot();
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

function trace(...xs:any) {
	console.log(...xs);
	return xs[xs.length - 1];
}

