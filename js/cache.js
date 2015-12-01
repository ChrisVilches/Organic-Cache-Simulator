/// <reference path="jquery.d.ts"/>
var algoritmoReemplazo;
(function (algoritmoReemplazo) {
    algoritmoReemplazo[algoritmoReemplazo["LRU"] = 0] = "LRU";
    algoritmoReemplazo[algoritmoReemplazo["MRU"] = 1] = "MRU";
    algoritmoReemplazo[algoritmoReemplazo["RANDOM"] = 2] = "RANDOM";
})(algoritmoReemplazo || (algoritmoReemplazo = {}));
;
var tipoDireccion;
(function (tipoDireccion) {
    tipoDireccion[tipoDireccion["BYTE"] = 0] = "BYTE";
    tipoDireccion[tipoDireccion["WORD"] = 1] = "WORD";
})(tipoDireccion || (tipoDireccion = {}));
;
var Cache = (function () {
    function Cache() {
        // Los numeros permitidos tienen un valor maximo de
        // 2 elevado a este numero
        this.POTENCIA = 20;
        this._blockSize = 4;
        this._nBlocks = 8;
        this._setSize = 2;
        this._tipoDireccion = tipoDireccion.WORD;
        this._algoritmoReemplazo = algoritmoReemplazo.LRU;
    }
    Cache.prototype.numeroCorrecto = function (valor) {
        var i;
        for (i = 0; i < this.POTENCIA; i++) {
            if (Math.pow(2, i) == valor) {
                return true;
            }
        }
        console.log("Numero incorrecto");
        return false;
    };
    // En bytes
    Cache.prototype.getCacheSize = function () {
        return this._blockSize * this._nBlocks * 4;
    };
    Cache.prototype.getNumSets = function () {
        return this._nBlocks / this._setSize;
    };
    Cache.prototype.setFullAsociativo = function () {
        // Full asociativo tiene un solo set
        // que contiene todos los bloques
        this._setSize = this._nBlocks;
    };
    Cache.prototype.setMapeoDirecto = function () {
        // Cada set tiene solo un bloque
        this._setSize = 1;
    };
    Cache.prototype.setNVias = function (vias) {
        this._setSize = vias;
    };
    // Interfaz con la GUI, recibe la configuracion
    Cache.prototype.configurar = function (blocksize, nblocks, nvias, algoritmo, tipoAsociatividad, addressing) {
        this._blockSize = blocksize;
        this._nBlocks = nblocks;
        // Algoritmo
        if (algoritmo == "lru")
            this._algoritmoReemplazo == algoritmoReemplazo.LRU;
        else if (algoritmo == "mru")
            this._algoritmoReemplazo == algoritmoReemplazo.MRU;
        else if (algoritmo == "random")
            this._algoritmoReemplazo == algoritmoReemplazo.RANDOM;
        // Addressing
        if (addressing == "b")
            this._tipoDireccion = tipoDireccion.BYTE;
        else
            this._tipoDireccion = tipoDireccion.WORD;
        // Mapeo directo
        if (tipoAsociatividad == "md") {
            this._setSize = 1;
        }
        else if (tipoAsociatividad == "sa") {
            this._setSize = nvias;
        }
        else if (tipoAsociatividad == "fa") {
            this._setSize = this._nBlocks;
        }
    };
    Cache.prototype.procesarDirecciones = function (direcciones) {
        var i;
        var j;
        // Reiniciar el cache
        this._cacheHitCuenta = 0;
        this._cacheMissCuenta = 0;
        // Numero de bloque de la direccion leida
        var numBloque;
        // Hacia donde mapea el bloque leido
        var mapea;
        // Aca se almacena la tabla
        var sets;
        // Crear sets
        sets = new Array(this.getNumSets());
        // Cada set tiene SET SIZE bloques
        for (i = 0; i < this.getNumSets(); i++) {
            sets[i] = new Array(this._setSize);
        }
        // Hacer que sean todos -1
        for (i = 0; i < this.getNumSets(); i++) {
            for (j = 0; j < this._setSize; j++) {
                sets[i][j] = -1;
            }
        }
        this.mostrarMatriz(sets, this.getNumSets(), this._setSize);
        // Leer todas las direcciones
        for (i = 0; i < direcciones.length; i++) {
            // Obtener la palabra
            var palabra;
            if (this._tipoDireccion == tipoDireccion.BYTE) {
                // Si es por byte, hay que obtener a que palabra
                // pertenece ese byte
                palabra = Math.floor(direcciones[i] / 4); // 4 bytes por palabra
            }
            else {
                // Se usa la palabra tal cual
                palabra = direcciones[i];
            }
            // La palabra se encuentra en el bloque
            numBloque = Math.floor(palabra / this._blockSize);
            // El bloque mapea a
            mapea = Math.floor(numBloque / this._setSize) % this.getNumSets();
            // Ver si el bloque ya esta en cache
            if (this.bloqueEstaEnSet(sets[mapea], numBloque)) {
                // Esta en cache
                console.log("cache hit");
                // Hay que reordenar
                this.correrBloqueHastaMasReciente(sets[mapea], numBloque);
                this._cacheHitCuenta++;
            }
            else {
                // No esta en cache
                console.log("cache miss");
                // Lo agrega siempre al final
                this.agregarBloqueASet(sets[mapea], numBloque);
                this._cacheMissCuenta++;
            }
        }
        console.log("Hit: " + this._cacheHitCuenta + ", miss: " + this._cacheMissCuenta);
    };
    Cache.prototype.correrBloqueHastaMasReciente = function (set, bloque) {
        var i;
        var cuantosBloquesTieneSet = this.cuantosBloquesTieneSet(set);
        i = 0;
        while (true) {
            if (set[i] == bloque)
                break;
            i++;
        }
        for (; i < cuantosBloquesTieneSet - 1; i++) {
            set[i] = set[i + 1];
        }
        // Agregar bloque nuevo
        set[cuantosBloquesTieneSet - 1] = bloque;
    };
    Cache.prototype.cuantosBloquesTieneSet = function (set) {
        var resultado;
        var i;
        resultado = 0;
        for (i = 0; i < this._setSize; i++) {
            if (set[i] == -1) {
                break;
            }
            else {
                resultado++;
            }
        }
        return resultado;
    };
    // Lo agrega segun algoritmo
    Cache.prototype.agregarBloqueASet = function (set, bloque) {
        var cuantosBloquesTieneSet = this.cuantosBloquesTieneSet(set);
        // Si no esta lleno el set, simplemente se agrega al final
        if (cuantosBloquesTieneSet < this._setSize) {
            set[cuantosBloquesTieneSet] = bloque;
            return;
        }
        // Esta lleno
        switch (this._algoritmoReemplazo) {
            case algoritmoReemplazo.LRU:
                // El primero es el mas antiguo
                var i;
                for (i = 0; i < this._setSize - 1; i++) {
                    set[i] = set[i + 1];
                }
                // Agregar bloque nuevo al final
                set[this._setSize - 1] = bloque;
                break;
            case algoritmoReemplazo.MRU:
                // El ultimo es el mas reciente
                set[this._setSize - 1] = bloque;
                break;
            case algoritmoReemplazo.RANDOM:
                var rand = Math.floor(Math.random() * this._setSize);
                set[rand] = bloque;
                break;
        }
    };
    Cache.prototype.bloqueEstaEnSet = function (set, bloque) {
        var i;
        for (i = 0; i < this._setSize; i++) {
            if (set[i] == bloque) {
                return true;
            }
        }
        return false;
    };
    Cache.prototype.mostrarSet = function (set) {
        var i;
        var resultado = "";
        for (i = 0; i < this._setSize; i++) {
            resultado += set[i] + " ";
        }
        return resultado;
    };
    Cache.prototype.mostrarMatriz = function (matriz, n, m) {
        var i;
        var j;
        var linea = "";
        for (i = 0; i < n; i++) {
            for (j = 0; j < m; j++) {
                linea += "set " + i + ": " + matriz[i][j] + " ";
            }
            console.log(linea);
            linea = "";
        }
        console.log();
    };
    return Cache;
})();
