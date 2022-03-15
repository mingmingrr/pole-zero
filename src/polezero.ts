import * as d3 from 'd3';

import * as S from './state';
import { ReprValue, Indexed, makeIndexed } from './util';
import { Complex } from './complex';
import * as C from './complex';
import { drag } from './drag';
import * as R from './response';

function trace(...xs:any) {
	console.log(...xs);
	return xs[xs.length - 1];
}

export const size = { width: 500, height: 300, diameter: 300 };
export const margin = { top: 0, right: 0, bottom: 0, left: 0 };

export const scale = {
	r: d3.scaleLinear().range([0, 300]).domain([0, 1.2]),
	t: d3.scaleLinear().range([0, 360]).domain([0, 360]),
};

export const svg = d3.select('#pole-zero').append('svg')
	.attr('width', 570).attr('height', 350);

export const graph = svg.append('g').classed('graph', true)
	.attr('transform', `translate(30, 20)`);

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

type IRComplex = Indexed<ReprValue<Complex>>;

export function plotRoots(
	roots:S.Roots,
	group:d3.Selection<SVGGElement, any, HTMLElement, any>,
	create:(point:d3.Selection<d3.EnterElement, IRComplex, SVGGElement, any>) =>
		d3.Selection<SVGGElement, IRComplex, SVGGElement, any>
) : void {
	function styleG(points:d3.Selection<d3.EnterElement, IRComplex, SVGGElement, any>) {
		function styleP(point:d3.Selection<d3.EnterElement, IRComplex, SVGGElement, any>) {
			return point.attr('transform', (d:IRComplex) =>
				`translate(${scale.r(d.value.value.real)}, ${-scale.r(d.value.value.imag)})`);
		}
		function dragP({index,value:{repr,value}}:IRComplex, conj:number) {
			conj = conj ? 1 : -1;
			drag(this as unknown as HTMLElement, { x:0, y:0 }, (event, x, y) => {
				// snap real axis
				if(Math.abs(y) < 5) y = 0;
				// snap unit circle
				let abs = scale.r.invert(Math.hypot(x, y));
				if(scale.r(Math.abs(abs - 1)) < 5)
					[x, y] = [x, y].map((n) => n / abs);
				let compl = new Complex(scale.r.invert(x), conj * scale.r.invert(y));
				let polar = C.polar(compl);
				let repr1 = repr.includes('e')
					? `${polar.mod.toFixed(4)}e^${polar.arg.toFixed(4)}i`
					: `${compl.real.toFixed(4)}+${compl.imag.toFixed(4)}i`;
				roots.roots[index] = new ReprValue(repr1, compl);
				plotRoots(roots, group, create);
				S.calculate(roots);
				R.plotAxisY();
				R.plotLine();
			}, (event, posn) => {
				posn.x = scale.r(roots.roots[index].value.real);
				posn.y = conj * scale.r(roots.roots[index].value.imag);
			});
		}
		points.selectAll('.point')
			.data(({index,value:{repr,value}}) => C.conjugates(value).map((value) =>
				new Indexed(index, new ReprValue(repr, value))))
			.join((enter:d3.Selection<d3.EnterElement, IRComplex, SVGGElement, any>) => {
				return styleP(create(enter).classed('point', true).each(dragP));
			}, styleP, (exit:any) => exit.remove());
		return points;
	}
	group.selectAll('.pair')
		.data(roots.roots.map(makeIndexed))
		.join((enter:d3.Selection<d3.EnterElement, IRComplex, SVGGElement, any>) => {
			return styleG(enter.append('g').classed('pair', true));
		}, styleG, (exit:any) => exit.remove());
}

export function plotPoles() {
	plotRoots(S.poles, poles, (point) => point.append('circle').attr('r', 5));
}

export function plotZeros() {
	plotRoots(S.zeros, zeros, (point) => point.append('circle').attr('r', 5));
}

S.recalculate.push((roots) => ({poles: plotPoles, zeros: plotZeros} as
	Record<string,()=>void>)[roots.name]());

