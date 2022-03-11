export function drag(elem:HTMLElement,
	posn:{x:number,y:number},
	update:(event:MouseEvent,x:number,y:number)=>void,
	start:(event:MouseEvent,posn:{x:number,y:number})=>void=(e,p)=>{},
	end:(event:MouseEvent,posn:{x:number,y:number})=>void=(e,p)=>{},
) : void {
	let listener = {
		move: null as (event:MouseEvent)=>void,
		up: null as (event:MouseEvent)=>void};
	elem.addEventListener('mousedown', (event:MouseEvent) => {
		if(listener.move !== null) return;
		event.preventDefault();
		start(event, posn);
		posn.x -= event.clientX;
		posn.y -= event.clientY;
		window.addEventListener('mouseup', listener.up = (event:MouseEvent) => {
			if(listener === null) return;
			event.preventDefault();
			posn.x += event.clientX;
			posn.y += event.clientY;
			update(event, posn.x, posn.y);
			end(event, posn);
			window.removeEventListener('mousemove', listener.move);
			window.removeEventListener('mouseup', listener.up);
			listener = { move: null, up: null };
		});
		window.addEventListener('mousemove', listener.move = (event:MouseEvent) => {
			event.preventDefault();
			update(event, posn.x + event.clientX, posn.y + event.clientY);
		});
	});
}

