import type { Attachment } from "svelte/attachments";

export type Sign = 1 | -1;

export function hadamardSign(row: number, column: number): Sign {
	let shared = row & column;
	let odd = false;
	while (shared !== 0) {
		odd = !odd;
		shared &= shared - 1;
	}
	return odd ? -1 : 1;
}

const white = 255;
const black = 0;

export function hadamardTile(level: number): Attachment<HTMLCanvasElement> {
	return (canvas) => {
		const order = 2 ** level;
		canvas.width = order;
		canvas.height = order;
		const context = canvas.getContext("2d");
		if (!context) return;
		const image = context.createImageData(order, order);
		for (let row = 0; row < order; row++) {
			for (let column = 0; column < order; column++) {
				const shade = hadamardSign(row, column) === 1 ? white : black;
				image.data.set([shade, shade, shade, 255], 4 * (row * order + column));
			}
		}
		context.putImageData(image, 0, 0);
	};
}
