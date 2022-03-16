import * as d3 from 'd3';

import * as S from './state';
import * as C from './complex';

export const size = { width: 500, height: 300 };

export const margin = { top: 20, right: 20, bottom: 30, left: 45 };

export const scale = {
	x: d3.scaleLinear().range([0, 500]).domain([0, 128]),
	y: d3.scaleLinear().range([300, 0]).domain([0, 4]).clamp(true),
};

export const svg = d3.select('#freq-response').append('svg');
export const graph = svg.append('g').classed('graph', true)
	.attr('transform', `translate(${margin.left}, ${margin.top})`);

export const axis = {
	x: graph.append('g').classed('x-axis', true),
	y: graph.append('g').classed('y-axis', true),
};

export const line = d3.line<number>()
	.x((n, i) => scale.x(i))
	.y((n) => scale.y(n));

export const path = graph.append('path');

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
	let max = d3.extent(S.response.scaled);
	scale.y = S.option.scale.axis;
	scale.y.range([size.height, 0])
		.domain(S.option.scale.extent(
			d3.extent(S.response.scaled),
			S.option.scale.data(C.abs(S.option.gain.value).real)));
	axis.y.call(d3.axisLeft(scale.y.nice())
		.tickSizeInner(-size.width).tickSizeOuter(0));
}

export function plotLine() {
	path.attr('d', line(S.response.scaled));
}

S.recalculate.push((roots) => plotAxisY());
S.recalculate.push((roots) => plotLine());

