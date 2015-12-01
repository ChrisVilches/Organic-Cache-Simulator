/// <reference path="jquery.d.ts"/>

enum algoritmoReemplazo{
		LRU,
		MRU,
		RANDOM
};

enum tipoDireccion{
	BYTE,
	WORD
};


class Cache{
	
	// Los numeros permitidos tienen un valor maximo de
	// 2 elevado a este numero
	POTENCIA : number = 20;
	
	_blockSize : number;
	_nBlocks : number;
	
	_setSize : number;
	
	_algoritmoReemplazo : algoritmoReemplazo;
	_tipoDireccion : tipoDireccion;
	
	_cacheHitCuenta : number;
	_cacheMissCuenta : number;
	
	constructor(){
		this._blockSize = 4;
		this._nBlocks = 8;
		this._setSize = 2;
		
		this._tipoDireccion = tipoDireccion.WORD;
		this._algoritmoReemplazo = algoritmoReemplazo.LRU;

	}
	
	numeroCorrecto(valor : number) : Boolean{
		var i : number;
		for(i=0; i<this.POTENCIA; i++){
			if(Math.pow(2, i) == valor){
				return true;
			}
		}		
		console.log("Numero incorrecto");
		return false;
	}
	
	
	// En bytes
	getCacheSize() : number{		
		return this._blockSize * this._nBlocks * 4;		
	}
	
	getNumSets() : number{
		return this._nBlocks/this._setSize;	
	}
	
	
	setFullAsociativo() : void{
		// Full asociativo tiene un solo set
		// que contiene todos los bloques
		this._setSize = this._nBlocks;
	}
	
	setMapeoDirecto() : void{
		// Cada set tiene solo un bloque
		this._setSize = 1;
	}
	
	setNVias(vias : number) : void{
		this._setSize = vias;
	}
	
	
	// Interfaz con la GUI, recibe la configuracion
	configurar(blocksize : number, nblocks : number, nvias : number, algoritmo : string, tipoAsociatividad : string, addressing : string) : void{
		this._blockSize = blocksize;
		this._nBlocks = nblocks;
		
		// Algoritmo
		if(algoritmo == "lru") this._algoritmoReemplazo == algoritmoReemplazo.LRU;
		else if(algoritmo == "mru") this._algoritmoReemplazo == algoritmoReemplazo.MRU;
		else if(algoritmo == "random") this._algoritmoReemplazo == algoritmoReemplazo.RANDOM;
		
		// Addressing
		if(addressing == "b") this._tipoDireccion = tipoDireccion.BYTE;
		else this._tipoDireccion = tipoDireccion.WORD;
		
		// Mapeo directo
		if(tipoAsociatividad == "md") {
			this._setSize = 1;
		} 
		// Set asociativo
		else if(tipoAsociatividad == "sa") {
			this._setSize = nvias;
		} 
		// Full asociativo
		else if(tipoAsociatividad == "fa") {
			this._setSize = this._nBlocks;
		}  			
	}
	
	
	procesarDirecciones(direcciones : number[]) : string{
		var i : number;
		var j : number;
		var resultado : string = "";
		
		// Reiniciar el cache
		this._cacheHitCuenta = 0;
		this._cacheMissCuenta = 0;
		
		// Numero de bloque de la direccion leida
		var numBloque : number;
		
		// Hacia donde mapea el bloque leido
		var mapea : number;
		
		// Aca se almacena la tabla
		var sets;


		// Crear sets
		
		sets = new Array(this.getNumSets());
		
		// Cada set tiene SET SIZE bloques
		
		for (i=0; i<this.getNumSets(); i++){
			sets[i] = new Array(this._setSize);
		}		
		
		// Hacer que sean todos -1
		
		for(i=0; i<this.getNumSets(); i++){
			for(j=0; j<this._setSize; j++){
				sets[i][j] = -1;			
			}
		}

			

		// Leer todas las direcciones
		
		for(i=0; i<direcciones.length; i++){
			
			// Obtener la palabra
			var palabra : number;
			
			if(this._tipoDireccion == tipoDireccion.BYTE){
				// Si es por byte, hay que obtener a que palabra
				// pertenece ese byte
				palabra = Math.floor(direcciones[i]/4);	// 4 bytes por palabra
			} else {
				// Se usa la palabra tal cual
				palabra = direcciones[i];
			} 
			
			// La palabra se encuentra en el bloque
			numBloque = Math.floor(palabra/this._blockSize);
			
			// El bloque mapea a
			mapea = Math.floor(numBloque/this._setSize) % this.getNumSets();

			// Ver si el bloque ya esta en cache
			if(this.bloqueEstaEnSet(sets[mapea], numBloque)){
				// Esta en cache
				console.log("cache hit");
				// Hay que reordenar
				this.correrBloqueHastaMasReciente(sets[mapea], numBloque);
				this._cacheHitCuenta++;
			} else {
				// No esta en cache
				console.log("cache miss");
				// Lo agrega siempre al final
				this.agregarBloqueASet(sets[mapea], numBloque);
				this._cacheMissCuenta++;
			}					
						
		}		
		
		resultado = "** esto es una tabla que retorna la funcion de cache **";
		
		this.mostrarMatriz(sets, this.getNumSets(), this._setSize);
		console.log("Hit: "+this._cacheHitCuenta+", miss: "+this._cacheMissCuenta);
		
		return resultado;
	}
	
	
	correrBloqueHastaMasReciente(set, bloque : number) : void{
		var i : number;
		var cuantosBloquesTieneSet : number = this.cuantosBloquesTieneSet(set);
		
		i = 0;
		while(true){			
			if(set[i] == bloque) break;
			i++;
		}
		
		for(; i<cuantosBloquesTieneSet-1; i++){
			set[i] = set[i+1];
		}
		// Agregar bloque nuevo
		set[cuantosBloquesTieneSet-1] = bloque;		
	}
	
	
	cuantosBloquesTieneSet(set):number{
		var resultado : number;
		var i : number;
		resultado = 0;
		
		for(i=0; i<this._setSize; i++){
			if(set[i] == -1){
				break;
			} else {
				resultado++;
			}
		}		
		
		return resultado;
	}
	
	
	// Lo agrega segun algoritmo
	agregarBloqueASet(set, bloque : number) : void{
		
		var cuantosBloquesTieneSet : number = this.cuantosBloquesTieneSet(set);
		
		// Si no esta lleno el set, simplemente se agrega al final
		
		if(cuantosBloquesTieneSet < this._setSize){
			set[cuantosBloquesTieneSet] = bloque;
			return;	
		}
		
		// Esta lleno
		
		switch(this._algoritmoReemplazo){
			case algoritmoReemplazo.LRU:
				// El primero es el mas antiguo
				var i : number;
				for(i=0; i<this._setSize-1; i++){
					set[i] = set[i+1];
				}
				// Agregar bloque nuevo al final
				set[this._setSize-1] = bloque;
			break;
			
			case algoritmoReemplazo.MRU:
				// El ultimo es el mas reciente
				set[this._setSize-1] = bloque;
			break;
			
			case algoritmoReemplazo.RANDOM:
				var rand = Math.floor(Math.random()*this._setSize);
				set[rand] = bloque;				
			break;
		}
	}
	
	
	bloqueEstaEnSet(set, bloque : number):Boolean{
		var i : number;
		for(i=0; i<this._setSize; i++){
			if(set[i] == bloque){
				return true;
			}
		}
		return false;
	}
	
	
	mostrarSet(set){
		var i;
		var resultado = "";
		for(i=0; i<this._setSize; i++){
			resultado += set[i] + " ";
		}
		return resultado;	
	}
	
	
	mostrarMatriz(matriz, n, m):void{
		var i;
		var j;
		var linea : string = "";
		for(i=0; i<n; i++){
			linea += "set "+i+": ";
			for(j=0; j<m; j++){
				if(matriz[i][j] == -1){
					linea += "- ";
				} else {
					linea += matriz[i][j] + " ";
				}				
			}
			console.log(linea);
			linea = "";
		}
		console.log();
	}	
	
}