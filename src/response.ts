import * as d3 from 'd3';

import * as S from './state';

export const size = { width: 500, height: 300 };

export const margin = { top: 20, right: 20, bottom: 30, left: 50 };

export const scale = {
	x: d3.scaleLinear().range([0, 500]).domain([0, 128]),
	y: d3.scaleLinear().range([300, 0]).domain([0, 4]),
};

export const svg = d3.select('#freq-response').append('svg');
export const graph = svg.append('g').classed('graph', true)
	.attr('transform', `translate(30, 20)`);

export const axis = {
	x: graph.append('g').classed('x-axis', true),
	y: graph.append('g').classed('y-axis', true),
};

export const line = d3.line<number>()
	.x((n, i) => scale.x(i))
	.y((n) => scale.y(n));

export const path = graph.append('path')
	.datum(S.response.abs);

export function plotSize() {
	let width = window.innerWidth;
	let height = window.innerHeight
	size.width = width - margin.left - margin.right;
	size.height = height - margin.top - margin.bottom;
	svg.attr('width', width).attr('height', height);
}

export function plotAxisX() {
	scale.x.range([0, size.width])
		.domain([0, S.option.resolution >> 1]);
	let scalex = scale.x.copy()
		.domain([0, S.option.frequency.value.real]);
	axis.x.call(d3.axisBottom(scalex)
		.tickSizeInner(-size.height).tickSizeOuter(0));
	axis.x.attr('transform', `translate(0, ${size.height})`);
}

export function plotAxisY() {
	let max = [].reduce.call(S.response.abs,
		(x:number, y:number) => Math.max(x, y));
	scale.y.range([size.height, 0]).domain([0, max]);
	axis.y.call(d3.axisLeft(scale.y.nice())
		.tickSizeInner(-size.width).tickSizeOuter(0));
}

export function plotLine() {
	path.attr('d', (d) => line(d));
}

S.recalculate.push((roots) => plotAxisY());
S.recalculate.push((roots) => plotLine());

