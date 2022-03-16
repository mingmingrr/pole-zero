import * as d3 from 'd3';

import { Roots } from './state';
import * as S from './state';
import { Indexed, makeIndexed } from './util';
import { Complex } from './complex';
import * as C from './complex';
import { drag } from './drag';
import * as R from './response';
import { Root } from './root';

export const size = { width: 500, height: 300, diameter: 300 };
export const margin = { top: 0, right: 0, bottom: 0, left: 0 };

export const scale = {
	r: d3.scaleLinear().range([0, 300]).domain([0, 1.2]),
	t: d3.scaleLinear().range([0, 360]).domain([0, 360]),
};

export const svg = d3.select('#pole-zero').append('svg');
export const graph = svg.append('g').classed('graph', true);

export const axis = {
	r: graph.append('g').classed('r-axis', true),
	t: graph.append('g').classed('t-axis', true),
};

export const poles = graph.append('g').classed('poles', true);

export const zeros = graph.append('g').classed('zeros', true);

export function plotSize() {
	let slides = document.getElementById('floaty-slides');
	let width = slides.clientWidth;
	let height = slides.clientHeight
	size.width = width - margin.left - margin.right;
	size.height = height - margin.top - margin.bottom;
	size.diameter = Math.min(size.width, size.height);
	svg.attr('width', width).attr('height', height);
	graph.attr('transform', `translate(${width/2}, ${height/2})`);
}

export function plotAxisR() {
	scale.r.range([0, size.diameter / 2]);
	function style(tick:d3.Selection<SVGGElement, number, SVGGElement, any>) {
		tick.select('circle').attr('r', scale.r);
		tick.select('text')
			.attr('y', (n) => -scale.r(n))
			.attr('transform', 'rotate(-25)')
			.text((n) => n);
		return tick.classed('unit', (x) => x == 1);
	}
	axis.r.selectAll('.tick')
		.data(scale.r.ticks(6))
		.join((enter:d3.Selection<d3.EnterElement, number, SVGGElement, any>) => {
			let tick = enter.append('g').classed('tick', true);
			tick.append('circle');
			tick.append('text');
			return style(tick);
		}, style);
}

export function plotAxisT() {
	function style(tick:d3.Selection<SVGGElement, number, SVGGElement, any>) {
		return tick.select('line').attr('x2', size.diameter / 2);
	};
	let ticks = axis.t.selectAll('g')
		.data(d3.range(0, 360, 30))
		.join((enter:d3.Selection<d3.EnterElement, number, SVGGElement, any>) => {
			let tick = enter.append('g').classed('tick', true)
				.attr('transform', (d) => `rotate(${-d})`);
			tick.append('line').attr('x1', 8);
			return style(tick);
		}, style);
}

function stylePoint(point:d3.Selection<SVGGElement, Indexed<Root>, SVGGElement, any>) {
	return point.attr('transform', ({value:{value}}) =>
		`translate(${scale.r(value.real)}, ${-scale.r(value.imag)})`)
}

let moving = false;

function dragUpdate(point:d3.Selection<SVGGElement,Indexed<Root>,any,any>,
		roots:Roots, x:number, y:number, conj:number) {
	let { index, value: root } = point.datum();
	// snap
	if(S.option.snap.axis && Math.abs(y) < 5) y = 0;
	let abs = scale.r.invert(Math.hypot(x, y));
	if(S.option.snap.unit && scale.r(Math.abs(abs - 1)) < 5)
		[x, y] = [x, y].map((n) => n / abs);
	// move
	let moved = new Root(root.repr, new Complex(
		scale.r.invert(x), conj * scale.r.invert(y)));
	roots.roots[index] = new Root(moved.toString(), moved.value);
	S.recalculate.forEach((f) => f(roots));
}

function dragStart(point:d3.Selection<SVGGElement,Indexed<Root>,any,any>,
		roots:Roots, posn:{x:number,y:number}, conj:number) {
	let index = point.datum().index;
	posn.x = scale.r(roots.roots[index].value.real);
	posn.y = conj * scale.r(roots.roots[index].value.imag);
	moving = true;
}

function dragEnd(point:d3.Selection<SVGGElement,Indexed<Root>,any,any>,
		roots:Roots, posn:{x:number,y:number}) {
	if(Math.abs(posn.x) < size.width / 2 &&
		Math.abs(posn.y) < size.height / 2) return;
	roots.roots.splice(point.datum().index, 1);
	S.recalculate.forEach((f) => f(roots));
	moving = false;
}

function dragClick(point:d3.Selection<SVGGElement,Indexed<Root>,any,any>,
		roots:Roots) {
	let roots$ = ({ poles: S.zeros, zeros: S.poles } as
		Record<string,Roots>)[roots.name];
	let { index, value: root } = point.datum();
	roots$.roots.splice(-1, 0, root);
	roots.roots.splice(index, 1);
	S.recalculate.forEach((f) => f(S.zeros));
	S.recalculate.forEach((f) => f(S.poles));
	moving = false;
}

function dragPoint(roots:S.Roots, conj:number) {
	conj = conj ? 1 : -1;
	let point = d3.select<SVGGElement,Indexed<Root>>(this);
	drag(this as unknown as HTMLElement, { x: 0, y: 0 },
		(event, x, y) => dragUpdate(point, roots, x, y, conj),
		(event, posn) => dragStart(point, roots, posn, conj),
		(event, posn) => dragEnd(point, roots, posn),
		(event, posn) => dragClick(point, roots))
}

svg.on("click", function(event) {
	if(!moving) {
		let rect = this.getBoundingClientRect();
		let posn = new Complex(
			scale.r.invert(event.clientX - rect.left - size.width / 2),
			-scale.r.invert(event.clientY - rect.top - size.height / 2));
		S.zeros.roots.splice(-1, 0, new Root(posn.toString(), posn, null));
		S.recalculate.forEach((f) => f(S.zeros));
		event.preventDefault();
	}
	moving = false;
});

function styleGroup(
	roots:S.Roots,
	create:(point:d3.Selection<d3.EnterElement, Indexed<Root>, SVGGElement, any>) =>
		d3.Selection<SVGGElement, Indexed<Root>, SVGGElement, any>,
	group:d3.Selection<SVGGElement, Indexed<Root>, SVGGElement, any>,
) {
	group.selectAll('.point')
		.data((d) => C.conjugates(d.value.value).map((x) =>
			new Indexed(d.index, new Root(d.value.repr, x, null))))
		.join<SVGGElement, Indexed<Root>>(
			(enter) => stylePoint(create(enter).classed('point', true)
				.each(function(datum, conj) { dragPoint.call(this, roots, conj); })),
			stylePoint, (exit) => exit.remove())
	return group;
}

export function plotRoots(
	roots:S.Roots,
	group:d3.Selection<SVGGElement, any, HTMLElement, any>,
	create:(point:d3.Selection<d3.EnterElement, Indexed<Root>, SVGGElement, any>) =>
		d3.Selection<SVGGElement, Indexed<Root>, SVGGElement, any>
) {
	return group.selectAll(".pair")
		.data(roots.roots.map(makeIndexed)
			.filter((root) => root.value.repr !== '' && root.value.error === null))
		.join<SVGGElement, Indexed<Root>>(
			(enter) => styleGroup(roots, create, enter.append('g').classed('pair', true)),
			(update) => styleGroup(roots, create, update as any), (exit) => exit.remove());
}

export function plotPoles() {
	plotRoots(S.poles, poles, (point) => point.append('polygon')
		.attr('points', '0 2.8,3 5,5 3,2.8 0,5 -3,3 -5,0 -2.8,-3 -5,-5 -3,-2.8 0,-5 3,-3 5'));
}

export function plotZeros() {
	plotRoots(S.zeros, zeros, (point) => point.append('circle').attr('r', 5));
}

S.recalculate.push((roots) => ({poles: plotPoles, zeros: plotZeros} as
	Record<string,()=>void>)[roots.name]());

