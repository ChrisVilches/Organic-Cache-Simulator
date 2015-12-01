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
        var resultado = "";
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
        resultado = "** esto es una tabla que retorna la funcion de cache **";
        this.mostrarMatriz(sets, this.getNumSets(), this._setSize);
        console.log("Hit: " + this._cacheHitCuenta + ", miss: " + this._cacheMissCuenta);
        return resultado;
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
            linea += "set " + i + ": ";
            for (j = 0; j < m; j++) {
                if (matriz[i][j] == -1) {
                    linea += "- ";
                }
                else {
                    linea += matriz[i][j] + " ";
                }
            }
            console.log(linea);
            linea = "";
        }
        console.log();
    };
    return Cache;
})();
/// <reference path="jquery.d.ts"/>
/// <reference path="cache.ts"/>
var blocksize;
var nblocks;
var nvias;
var algoritmo;
var tipoAsociatividad;
var addressing;
var cache;
function isPowerOfTwo(x) {
    while (((x % 2) == 0) && x > 1)
        x /= 2;
    return (x == 1);
}
function numeroCorrecto(num) {
    if (isPowerOfTwo(num))
        return true;
}
function mostrarError(text) {
    $("#span_error").text(text);
}
function procesarDirecciones() {
    var direcciones;
    var tablaResultado;
    // Primero realizar las validaciones de la configuracion de cache
    if (!validarConfiguracion()) {
        return;
    }
    // Validar direcciones
    direcciones = crearArregloDirecciones();
    if (direcciones == null) {
        mostrarError("Ingresar direcciones correctamente");
        return;
    }
    cache.configurar(blocksize, nblocks, nvias, algoritmo, tipoAsociatividad, addressing);
    tablaResultado = cache.procesarDirecciones(direcciones);
    $("#tablaCacheResultado").html(tablaResultado);
}
function crearArregloDirecciones() {
    // Todo lo que no es numero, transformarlo a espacio
    var arregloDirecciones;
    var arregloSplit;
    var i;
    var textoProcesado = $("#textarea_direcciones").val().replace(/[^0-9]+/g, " ");
    // Eliminar los espacios de sobra
    textoProcesado = textoProcesado.trim();
    // Si no hay texto, retornar null
    if (textoProcesado.length == 0) {
        return null;
    }
    arregloSplit = textoProcesado.split(" ");
    // Crear arreglo numerico
    arregloDirecciones = new Array(arregloSplit.length);
    // Convertir a numeros
    for (i = 0; i < arregloSplit.length; i++) {
        arregloDirecciones[i] = Number(arregloSplit[i]);
    }
    // Si hay texto, retornar el arreglo de numeros
    return arregloDirecciones;
}
function validarConfiguracion() {
    // Obtener los datos de la GUI
    var input_blocksize = Number($("#config_blocksize").val());
    var input_nblocks = Number($("#config_nblocks").val());
    var input_nvias = Number($("#config_nvias").val());
    var input_asociatividad = $("#config_tipoasociatividad").val();
    var input_algoritmo = $("#config_algoritmo").val();
    var input_addressing = $("#config_addressing").val();
    // Validar cada uno
    if (!numeroCorrecto(input_blocksize)) {
        mostrarError("Tamaño de bloque no es correcto. Debe ser numero entero, potencia de 2.");
        return false;
    }
    if (!numeroCorrecto(input_nblocks)) {
        mostrarError("Numero de bloques no es correcto. Debe ser numero entero, potencia de 2.");
        return false;
    }
    if (!numeroCorrecto(input_nvias) && tipoAsociatividad == "sa") {
        mostrarError("Numero de vias no es correcto. Debe ser numero entero, potencia de 2.");
        return false;
    }
    if (!(input_asociatividad == "md" || input_asociatividad == "sa" || input_asociatividad == "fa")) {
        mostrarError("Asociatividad incorrecta.");
        return false;
    }
    if (!(input_algoritmo == "lru" || input_algoritmo == "mru" || input_algoritmo == "random")) {
        mostrarError("Asociatividad incorrecta.");
        return false;
    }
    if (!(input_addressing == "w" || input_addressing == "b")) {
        mostrarError("Tipo de addressing incorrecto.");
        return false;
    }
    // Si los datos de la GUI son correctos, se asignan a las variables del programa
    blocksize = input_blocksize;
    nblocks = input_nblocks;
    nvias = input_nvias;
    tipoAsociatividad = input_asociatividad;
    algoritmo = input_algoritmo;
    addressing = input_addressing;
    // Para asociatividades distintas, se habilitan o deshabilitan algunos campos
    if (tipoAsociatividad == "md") {
        $("#config_nvias").prop('disabled', true);
        $("#config_setsize").prop('disabled', true);
        $("#config_algoritmo").prop('disabled', true);
        $("#info_nsets").text(nblocks.toString());
    }
    else if (tipoAsociatividad == "sa") {
        $("#config_nvias").prop('disabled', false);
        $("#config_setsize").prop('disabled', false);
        $("#info_nsets").text((nblocks / nvias).toString());
        $("#config_algoritmo").prop('disabled', false);
    }
    else if (tipoAsociatividad == "fa") {
        $("#config_nvias").prop('disabled', true);
        $("#config_setsize").prop('disabled', true);
        $("#info_nsets").text((1).toString());
        $("#config_algoritmo").prop('disabled', false);
    }
    $("#info_cachesize").text((nblocks * blocksize * 4) + " bytes");
    mostrarError("");
    return true;
}
$(document).ready(function () {
    document.title = "Organic Cache Simulator";
    // Configuracion inicial
    $("#config_blocksize").val((4).toString());
    $("#config_nblocks").val((16).toString());
    $("#config_nvias").val((4).toString());
    validarConfiguracion();
    cache = new Cache();
    // Evento mouse
    $("#btn_procesar").click(function () {
        procesarDirecciones();
    });
});
