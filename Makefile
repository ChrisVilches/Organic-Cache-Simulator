all:
	tsc --out js/gui.js src/gui.ts --target es5
	tsc --out js/cache.js src/cache.ts --target es5