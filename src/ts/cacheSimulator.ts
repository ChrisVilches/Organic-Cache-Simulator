/// <reference path="jquery.d.ts"/>
"use strict";

enum algoritmoReemplazo{
		LRU,
		MRU,
		RANDOM
}

enum tipoDireccion{
	BYTE,
	WORD
}

enum cacheEstado{
	HIT,
	MISS
}

// Cannot use "Cache" because it already exists.
class CacheSimulator{	

	private _blockSize : number;
	private _nBlocks : number;	
	private _setSize : number;
	
	private _algoritmoReemplazo : algoritmoReemplazo;
	private _tipoDireccion : tipoDireccion;
	
	private _cacheHitCuenta : number;
	private _cacheMissCuenta : number;
	
	
	constructor(){
		

	}
	
	get hitCount() : number{
		return this._cacheHitCuenta;
	}
	
	get missCount() : number{
		return this._cacheMissCuenta;
	}

	get hitRate() : number{
		var total : number;
		var hitPorcentaje : number;
		total = this.hitCount + this.missCount;
		hitPorcentaje = this.hitCount/total;
		return Math.round(hitPorcentaje*10000)/100;
	}
	
	
	get numSets() : number{
		return this._nBlocks/this._setSize;
	}
	
	// No entrega el numbero de bits que tiene el offset, si no
	// el numero por el cual el numero debe ser dividido, para encontrar
	// tag + indice (eliminar el offset)
	get offsetTotal() : number{
		if(this._tipoDireccion == tipoDireccion.BYTE){
			return this._blockSize * 4;
		}
		return this._blockSize;
	}
	
	
	// Numero de bits del offset
	get bitsOffset() : number{
		// Es necesario restarle 1 porque, por ejemplo si hay 4 palabras por bloque
		// el numero binario es 100, es decir 4. Pero se pueden hacer cuatro combinaciones
		// con solo 2 bits, 00 01 10 11, por lo tanto no es necesario 3 bits, si no 2.
		return this.offsetTotal.toString(2).length - 1;
	}
		
	// Obtiene la cantidad de bits necesarias para el indice
	get bitsIndice() : number{
		return this.numSets.toString(2).length - 1;
	}
	
	
	// Interfaz con la GUI, recibe la configuracion
	public configurar(blocksize : number, nblocks : number, nvias : number, algoritmo : string, tipoAsociatividad : string, addressing : string) : void{
		this._blockSize = blocksize;
		this._nBlocks = nblocks;
		
		// Algoritmo
		if(algoritmo == "lru") this._algoritmoReemplazo = algoritmoReemplazo.LRU;
		else if(algoritmo == "mru") this._algoritmoReemplazo = algoritmoReemplazo.MRU;
		else if(algoritmo == "random") this._algoritmoReemplazo = algoritmoReemplazo.RANDOM;
		
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
	
	
	public procesarDirecciones(direcciones : number[]) : string{
		var i : number;
		var j : number;
		var resultado : string = "";
		
		// Numero de bits necesarios para poder mostrar por pantalla
		// la direccion mas larga del conjunto
		var bitsNecesarios : number = this.encontrarCantidadDeBitsNecesarias(direcciones);	
				
		// Numero de bloque de la direccion leida
		var numBloque : number;
		
		// Hacia donde mapea el bloque leido
		var mapea : number;
		
		// Aca se almacena la tabla
		var sets;
		
		// Obtener la palabra leida (si es por WORD, es la misma direccion)
		// si es por BYTE hay que cambiarlo
		var palabra : number;
		
		// El estado del cache, hit o miss?
		var estadohitmiss : cacheEstado;
		
		// Reiniciar el cache
		this._cacheHitCuenta = 0;
		this._cacheMissCuenta = 0;
		

		// Crear sets
		
		sets = new Array(this.numSets);
		
		// Cada set tiene SET SIZE bloques
		
		for (i=0; i<this.numSets; i++){
			sets[i] = new Array(this._setSize);
		}		
		
		// Hacer que sean todos -1
		
		for(i=0; i<this.numSets; i++){
			for(j=0; j<this._setSize; j++){
				sets[i][j] = -1;			
			}
		}

			
		resultado = "<table class=\"tablaCacheHitMiss\">";
		
		// Crear las cabeceras de la tabla
		
		resultado += "<tr>";
		resultado += "<th class=\"noset\"> </th>";
		resultado += "<th class=\"noset\">#</th>";
		resultado += "<th class=\"noset\">address</th>";
		resultado += "<th class=\"noset\">binary<br/><small>(tag index offset)</small</th>";
		resultado += "<th class=\"noset\">block #</th>";				
		
		for(i=0; i<this.numSets; i++){
			resultado += "<th>set "+i+"</th>";
		}
		resultado += "</tr>";	
		
			
		// Leer todas las direcciones
		
		for(i=0; i<direcciones.length; i++){		
			
			palabra = direcciones[i];
			
			// La palabra se encuentra en el bloque
			numBloque = Math.floor(palabra/this.offsetTotal);
			
			// El bloque mapea a
			mapea = numBloque % this.numSets;

			// Ver si el bloque ya esta en cache
			if(this.bloqueEstaEnSet(sets[mapea], numBloque)){
				// Esta en cache
				// Hay que reordenar
				this.correrBloqueHastaMasReciente(sets[mapea], numBloque);
				this._cacheHitCuenta++;
				estadohitmiss = cacheEstado.HIT;
			} else {
				// No esta en cache
				// Lo agrega siempre al final
				this.agregarBloqueASet(sets[mapea], numBloque);
				this._cacheMissCuenta++;
				estadohitmiss = cacheEstado.MISS;
			}			
			
			resultado += this.obtenerFilaCacheActual(sets, estadohitmiss, direcciones[i], numBloque, i, bitsNecesarios);
		}		
		
		resultado += "</table>";
		
		return resultado;
	}
	
	
	// Dada un arreglo de direcciones, encuentra el numero de bits necesarios
	// para poder representar en binario, la direccion mas larga del arreglo
	private encontrarCantidadDeBitsNecesarias(dir : number[]) : number{
		var max : number = 0;
		var i : number;
		
		for(i=0; i<dir.length; i++){
			if(dir[i] > max){
				max = dir[i];
			}
		}
		
		return max.toString(2).length;
		
	}
	
	// Dado una direccion numerica, la convierte en binario, y ademas
	// separa la string (usando espacios) en tag, indice y offset
	private rellenarBinCerosYDividir(num : number, max : number) : string{
		var resultado : string = num.toString(2);
		var tag : string = "";
		var indice : string = "";
		var offset : string = "";
		var i : number;
		var cont : number;
		
		// Agregar ceros hasta que se complete el tamano esperado
		while(resultado.length < max){
			resultado = "0"+resultado;
		}
		
		// Ir agregando los digitos. En algunos casos podria ser que la
		// string mas larga, tiene menos digitos que los digitos del
		// offset e indice, en ese caso serian puros undefined,
		// por eso en caso que sea undefined, le agrego un 0.		
		
		// Obtener el offset
		for(cont=0, i=resultado.length-1; cont < this.bitsOffset; cont++, i--){
			if(resultado[i] == undefined){
				offset = "0" + offset;
			} else {
				offset = resultado[i] + offset;
			}			
		}
		
		// Obtener el indice
		for(cont=0; cont < this.bitsIndice; cont++, i--){
			if(resultado[i] == undefined){
				indice = "0" + indice;
			} else {
				indice = resultado[i] + indice;
			}			
		}
		
		// Obtener el tag
		for(; i > -1; i--){
			if(resultado[i] == undefined){
				tag = "0" + tag;
			} else {
				tag = resultado[i] + tag;
			}	
		}
		
		// Si el tag no tiene digitos, entonces colocarle algunos ceros
		if(tag.length == 0) {
			tag = "0000";
		}
		
		return tag + "&nbsp;" + indice + "&nbsp;" + offset;	
	}
	
	
	// Entrega el estado de cache en un determinado momento
	private obtenerFilaCacheActual(sets, estadohitmiss : cacheEstado, direccion : number, numBloque : number, numeroAcceso : number, bitsNecesarios : number) : string{
		var i:number;
		var j:number;
		var cacheFila:string;		
		
		// Agregar el estado (hit/miss)			
		if(estadohitmiss == cacheEstado.HIT){
			cacheFila = "<tr class=\"hit\"><td>H</td>";
		} else {
			cacheFila = "<tr class=\"miss\"><td>M</td>";
		}
			
		// Numero de acceso
		cacheFila += "<td>"+(numeroAcceso+1)+"</td>";
			
		// Colocar la direccion (decimal)
		cacheFila += "<td>"+direccion+"</td>";
		
		// Direccion (binario)
		cacheFila += "<td>"+this.rellenarBinCerosYDividir(direccion, bitsNecesarios)+"</td>";
		
		// A que bloque pertenece
		cacheFila += "<td>"+numBloque+"</td>";
		
		// set[num set][num bloque]
		
		for(i=0; i<this.numSets; i++){
			cacheFila += "<td>";
			for(j=0; j<this._setSize; j++){
				if(sets[i][j] != -1){
					cacheFila += sets[i][j]+" ";
				}				
			}
			cacheFila += "</td>";
		}
		
		cacheFila += "</tr>";
		
		return cacheFila;
	}
	

	
	private correrBloqueHastaMasReciente(set, bloque : number) : void{
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
	
	
	private cuantosBloquesTieneSet(set):number{
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
	private agregarBloqueASet(set, bloque : number) : void{
		
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
	
	
	private bloqueEstaEnSet(set, bloque : number):Boolean{
		var i : number;
		for(i=0; i<this._setSize; i++){
			if(set[i] == bloque){
				return true;
			}
		}
		return false;
	}
	
}