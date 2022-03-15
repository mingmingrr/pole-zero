export function drag(elem:HTMLElement,
	posn:{x:number,y:number},
	update:(event:MouseEvent,x:number,y:number)=>void,
	start:(event:MouseEvent,posn:{x:number,y:number})=>void=(e,p)=>{},
	end:(event:MouseEvent,posn:{x:number,y:number})=>void=(e,p)=>{},
	click:(event:MouseEvent,posn:{x:number,y:number})=>void=(e,p)=>{},
) : void {
	let listener = {
		move: null as (event:MouseEvent)=>void,
		up: null as (event:MouseEvent)=>void};
	elem.addEventListener('mousedown', (event:MouseEvent) => {
		if(listener.move !== null) return;
		event.preventDefault();
		event.stopImmediatePropagation();
		start(event, posn);
		posn.x -= event.clientX;
		posn.y -= event.clientY;
		let moved = false;
		window.addEventListener('mouseup', listener.up = (event:MouseEvent) => {
			if(listener === null) return;
			event.preventDefault();
			posn.x += event.clientX;
			posn.y += event.clientY;
			if(moved) {
				update(event, posn.x, posn.y);
				end(event, posn);
			} else
				click(event, posn);
			window.removeEventListener('mousemove', listener.move);
			window.removeEventListener('mouseup', listener.up);
			listener = { move: null, up: null };
		});
		window.addEventListener('mousemove', listener.move = (event:MouseEvent) => {
			event.preventDefault();
			update(event, posn.x + event.clientX, posn.y + event.clientY);
			moved = true;
		});
	});
}

