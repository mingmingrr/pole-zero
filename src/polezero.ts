/*
margin: { top: 0, right: 0, bottom: 0, left: 0 },
size: { width: 500, height: 300, diameter: 300 },
scale: {
	r: d3.scaleLinear().range([0, 300]).domain([0, 1.2]),
	t: d3.scaleLinear().range([0, 360]).domain([0, 360]),
},
svg: d3.select('#pole-zero').append('svg')
	.attr('width', 570).attr('height', 350),
graph: pz$((pz$$:any) => pz$$.svg.append('g').classed('graph', true)
	.attr('transform', `translate(30, 20)`)),
axis: pz$((pz$$:any) => ({
	r: pz$$.graph.append('g').classed('r-axis', true),
	t: pz$$.graph.append('g').classed('t-axis', true),
})),
poles: pz$((pz$$:any) => pz$$.graph.append('g').classed('poles', true)),
zeros: pz$((pz$$:any) => pz$$.graph.append('g').classed('zeros', true)),
plot: pz$((pz$$:any) => ({
	size: function() {
		let slides = document.getElementById('floaty-slides');
		let width = slides.clientWidth;
		let height = slides.clientHeight
		pz$$.size.width = width - pz$$.margin.left - pz$$.margin.right;
		pz$$.size.height = height - pz$$.margin.top - pz$$.margin.bottom;
		pz$$.size.diameter = Math.min(pz$$.size.width, pz$$.size.height);
		pz$$.svg.attr('width', width).attr('height', height);
		pz$$.graph.attr('transform', `translate(${width/2}, ${height/2})`);
	},
	axis: {
		r: function() {
			pz$$.scale.r.range([0, pz$$.size.diameter / 2]);
			function update(tick:any) {
				tick.classed('unit', (x:number) => x == 1);
				tick.select('circle').attr('r', pz$$.scale.r);
				tick.select('text')
					.attr('y', (n:number) => -pz$$.scale.r(n))
					.attr('transform', 'rotate(-15)')
					.text((n:number) => n);
			};
			pz$$.axis.r.selectAll('.tick')
				.data(pz$$.scale.r.ticks(6))
				.join((enter:any) => {
					let tick = enter.append('g').classed('tick', true);
					tick.append('circle');
					tick.append('text');
					update(tick);
				}, update, (exit:any) => exit.remove());
		},
		t: function() {
			function update(tick:any) {
				tick.select('line').attr('x2', pz$$.size.diameter / 2);
			};
			let ticks = pz$$.axis.t.selectAll('g')
				.data(d3.range(0, 360, 30)).join((enter:any) => {
					let tick = enter.append('g').classed('tick', true)
						.attr('transform', (d:number) => `rotate(${-d})`);
					tick.append('line').attr('x1', 8);
					update(tick);
				}, update, (exit:any) => exit.remove());
		}
	},
	plot: {
		run: function(roots:Array<ReprValue<Complex>>, group:any, create:any) {
			function update(group:any) {
				function update(point:any) {
					trace('point', point).attr('transform', (d:Complex) =>
						`translate(${pz$$.scale.r(d.real)}, ${-pz$$.scale.r(d.imag)})`);
				}
				group.selectAll('g').data((d:ReprValue<Complex>) => conjugates([d]))
					.join((enter:any) => {
						create(enter);
						update(enter);
					}, update, (exit:any) => exit.remove());
			}
			group.selectAll('.root')
				.data(roots)
				.join((enter:any) => {
					let group = enter.append('g').classed('point', true);
					update(group);
				}, update, (exit:any) => exit.remove());
		},
		poles: () => pz$$.plot.plot.run(state.poles, pz$$.poles,
			(point:any) => point.append('circle').attr('r', 5)),
		zeros: () => pz$$.plot.plot.run(state.zeros, pz$$.zeros,
			(point:any) => point.append('circle').attr('r', 5)),
	},
})),
*/
