/// <reference path="jquery.d.ts"/>
"use strict";
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
var cacheEstado;
(function (cacheEstado) {
    cacheEstado[cacheEstado["HIT"] = 0] = "HIT";
    cacheEstado[cacheEstado["MISS"] = 1] = "MISS";
})(cacheEstado || (cacheEstado = {}));
;
var Cache = (function () {
    function Cache() {
    }
    Object.defineProperty(Cache.prototype, "hitCount", {
        get: function () {
            return this._cacheHitCuenta;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Cache.prototype, "missCount", {
        get: function () {
            return this._cacheMissCuenta;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Cache.prototype, "hitRate", {
        get: function () {
            var total;
            var hitPorcentaje;
            total = this.hitCount + this.missCount;
            hitPorcentaje = this.hitCount / total;
            return Math.round(hitPorcentaje * 10000) / 100;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Cache.prototype, "numSets", {
        get: function () {
            return this._nBlocks / this._setSize;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Cache.prototype, "offsetTotal", {
        // No entrega el numbero de bits que tiene el offset, si no
        // el numero por el cual el numero debe ser dividido, para encontrar
        // tag + indice (eliminar el offset)
        get: function () {
            if (this._tipoDireccion == tipoDireccion.BYTE) {
                return this._blockSize * 4;
            }
            return this._blockSize;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Cache.prototype, "bitsOffset", {
        // Numero de bits del offset
        get: function () {
            // Es necesario restarle 1 porque, por ejemplo si hay 4 palabras por bloque
            // el numero binario es 100, es decir 4. Pero se pueden hacer cuatro combinaciones
            // con solo 2 bits, 00 01 10 11, por lo tanto no es necesario 3 bits, si no 2.
            return this.offsetTotal.toString(2).length - 1;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Cache.prototype, "bitsIndice", {
        // Obtiene la cantidad de bits necesarias para el indice
        get: function () {
            return this.numSets.toString(2).length - 1;
        },
        enumerable: true,
        configurable: true
    });
    // Interfaz con la GUI, recibe la configuracion
    Cache.prototype.configurar = function (blocksize, nblocks, nvias, algoritmo, tipoAsociatividad, addressing) {
        this._blockSize = blocksize;
        this._nBlocks = nblocks;
        // Algoritmo
        if (algoritmo == "lru")
            this._algoritmoReemplazo = algoritmoReemplazo.LRU;
        else if (algoritmo == "mru")
            this._algoritmoReemplazo = algoritmoReemplazo.MRU;
        else if (algoritmo == "random")
            this._algoritmoReemplazo = algoritmoReemplazo.RANDOM;
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
        // Numero de bits necesarios para poder mostrar por pantalla
        // la direccion mas larga del conjunto
        var bitsNecesarios = this.encontrarCantidadDeBitsNecesarias(direcciones);
        // Numero de bloque de la direccion leida
        var numBloque;
        // Hacia donde mapea el bloque leido
        var mapea;
        // Aca se almacena la tabla
        var sets;
        // Obtener la palabra leida (si es por WORD, es la misma direccion)
        // si es por BYTE hay que cambiarlo
        var palabra;
        // El estado del cache, hit o miss?
        var estadohitmiss;
        // Reiniciar el cache
        this._cacheHitCuenta = 0;
        this._cacheMissCuenta = 0;
        // Crear sets
        sets = new Array(this.numSets);
        // Cada set tiene SET SIZE bloques
        for (i = 0; i < this.numSets; i++) {
            sets[i] = new Array(this._setSize);
        }
        // Hacer que sean todos -1
        for (i = 0; i < this.numSets; i++) {
            for (j = 0; j < this._setSize; j++) {
                sets[i][j] = -1;
            }
        }
        resultado = "<table class=\"tablaCacheHitMiss\">";
        // Crear las cabeceras de la tabla
        resultado += "<tr>";
        resultado += "<th class=\"noset\"> </th>";
        resultado += "<th class=\"noset\">#</th>";
        resultado += "<th class=\"noset\">direccion</th>";
        resultado += "<th class=\"noset\">binario <small>(tag indice offset)</small</th>";
        resultado += "<th class=\"noset\">bloque #</th>";
        for (i = 0; i < this.numSets; i++) {
            resultado += "<th>set " + i + "</th>";
        }
        resultado += "</tr>";
        // Leer todas las direcciones
        for (i = 0; i < direcciones.length; i++) {
            palabra = direcciones[i];
            // La palabra se encuentra en el bloque
            numBloque = Math.floor(palabra / this.offsetTotal);
            // El bloque mapea a
            mapea = numBloque % this.numSets;
            // Ver si el bloque ya esta en cache
            if (this.bloqueEstaEnSet(sets[mapea], numBloque)) {
                // Esta en cache
                // Hay que reordenar
                this.correrBloqueHastaMasReciente(sets[mapea], numBloque);
                this._cacheHitCuenta++;
                estadohitmiss = cacheEstado.HIT;
            }
            else {
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
    };
    // Dada un arreglo de direcciones, encuentra el numero de bits necesarios
    // para poder representar en binario, la direccion mas larga del arreglo
    Cache.prototype.encontrarCantidadDeBitsNecesarias = function (dir) {
        var max = 0;
        var i;
        for (i = 0; i < dir.length; i++) {
            if (dir[i] > max) {
                max = dir[i];
            }
        }
        return max.toString(2).length;
    };
    // Dado una direccion numerica, la convierte en binario, y ademas
    // separa la string (usando espacios) en tag, indice y offset
    Cache.prototype.rellenarBinCeros = function (num, max) {
        var resultado = num.toString(2);
        var tag = "";
        var indice = "";
        var offset = "";
        var i;
        var cont;
        while (resultado.length < max) {
            resultado = "0" + resultado;
        }
        i = resultado.length - 1;
        cont = 0;
        for (cont = 0; cont < this.bitsOffset; cont++) {
            offset = resultado[i] + offset;
            i--;
        }
        cont = 0;
        for (cont = 0; cont < this.bitsIndice; cont++) {
            indice = resultado[i] + indice;
            i--;
        }
        for (; i > -1; i--) {
            tag = resultado[i] + tag;
        }
        return tag + "&nbsp;" + indice + "&nbsp;" + offset;
    };
    // Entrega el estado de cache en un determinado momento
    Cache.prototype.obtenerFilaCacheActual = function (sets, estadohitmiss, direccion, numBloque, numeroAcceso, bitsNecesarios) {
        var i;
        var j;
        var cacheFila;
        // Agregar el estado (hit/miss)			
        if (estadohitmiss == cacheEstado.HIT) {
            cacheFila = "<tr class=\"hit\"><td>H</td>";
        }
        else {
            cacheFila = "<tr class=\"miss\"><td>M</td>";
        }
        // Numero de acceso
        cacheFila += "<td>" + (numeroAcceso + 1) + "</td>";
        // Colocar la direccion (decimal)
        cacheFila += "<td>" + direccion + "</td>";
        // Direccion (binario)
        cacheFila += "<td>" + this.rellenarBinCeros(direccion, bitsNecesarios) + "</td>";
        // A que bloque pertenece
        cacheFila += "<td>" + numBloque + "</td>";
        // set[num set][num bloque]
        for (i = 0; i < this.numSets; i++) {
            cacheFila += "<td>";
            for (j = 0; j < this._setSize; j++) {
                if (sets[i][j] != -1) {
                    cacheFila += sets[i][j] + " ";
                }
            }
            cacheFila += "</td>";
        }
        cacheFila += "</tr>";
        return cacheFila;
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
/*
*
*	Se ejecuta al cargar la pagina
*
*/
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
    // Configurar cache
    cache.configurar(blocksize, nblocks, nvias, algoritmo, tipoAsociatividad, addressing);
    // Obtener tabla cronologica de resultados
    tablaResultado = cache.procesarDirecciones(direcciones);
    // Obtener codigo mars			
    $("#textarea_codigomars").html(transpiladorMips.obtenerCodigoMips(direcciones, addressing));
    // Mostrar tabla
    $("#tablaCacheResultado").html(tablaResultado);
    // Mostrar cuenta hit y miss
    $("#hitMissRate").html("<p>Hits: <b>" + cache.hitCount + "</b></p><p>Miss: <b>" + cache.missCount + "</b></p><p>Hit rate: <b>" + cache.hitRate + "%</b></p>");
    // Muestra cuantos bits necesita el indice y offset.
    $("#bitsDireccion").html("<p>Bits indice: <b>" + cache.bitsIndice + "</b></p><p>Bits offset: <b>" + cache.bitsOffset + "</b></p>");
    // Desocultar resultados
    $("#todosResultados").show();
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
    // No puede haber mas bloques que vias, se cambia
    if (input_nvias > input_nblocks) {
        $("#config_nvias").val(input_nblocks.toString());
        input_nvias = input_nblocks;
    }
    // Validar cada uno
    if (!numeroCorrecto(input_blocksize)) {
        mostrarError("Tamaño de bloque no es correcto. Debe ser numero entero, potencia de 2.");
        return false;
    }
    if (!numeroCorrecto(input_nblocks)) {
        mostrarError("Numero de bloques no es correcto. Debe ser numero entero, potencia de 2.");
        return false;
    }
    if (tipoAsociatividad == "sa" && !numeroCorrecto(input_nvias)) {
        mostrarError("Numero de vias no es correcto. Debe ser numero entero, potencia de 2.");
        return false;
    }
    if (!(input_asociatividad == "md" || input_asociatividad == "sa" || input_asociatividad == "fa")) {
        mostrarError("Asociatividad incorrecta.");
        return false;
    }
    if (!(input_algoritmo == "lru" || input_algoritmo == "mru" || input_algoritmo == "random")) {
        mostrarError("Algoritmo incorrecto.");
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
        $("#config_algoritmo").prop('disabled', true);
        // Actualizar automaticamente el numero de vias
        nvias = 1;
    }
    else if (tipoAsociatividad == "sa") {
        $("#config_nvias").prop('disabled', false);
        $("#config_algoritmo").prop('disabled', false);
    }
    else if (tipoAsociatividad == "fa") {
        $("#config_nvias").prop('disabled', true);
        $("#config_algoritmo").prop('disabled', false);
        // Actualizar automaticamente el numero de vias
        nvias = nblocks;
    }
    // Cambiar el input de forma automatica
    $("#config_nvias").val(nvias.toString());
    // Mostrar informacion (no input de texto)
    $("#info_nsets").text((nblocks / nvias).toString());
    $("#info_cachesize").text((nblocks * blocksize * 4) + " bytes (" + (nblocks * blocksize) + " palabras)");
    mostrarError("");
    return true;
}
var transpiladorMips;
(function (transpiladorMips) {
    function hexEncode(num) {
        return "0x" + num.toString(16);
    }
    transpiladorMips.hexEncode = hexEncode;
    // A partir de direcciones de memoria, genera un codigo MIPS
    function obtenerCodigoMips(direcciones, tipoDireccionamiento) {
        var i;
        var base = 0x10040000;
        var resultado = "";
        if (tipoDireccionamiento == "b") {
            for (i = 0; i < direcciones.length; i++)
                resultado += "lb $t0, " + hexEncode(base + direcciones[i]) + "\n";
        }
        else {
            for (i = 0; i < direcciones.length; i++)
                resultado += "lw $t0, " + hexEncode(base + (direcciones[i] * 4)) + "\n";
        }
        $("#tablaCacheResultado").html(resultado);
        return resultado;
    }
    transpiladorMips.obtenerCodigoMips = obtenerCodigoMips;
})(transpiladorMips || (transpiladorMips = {}));
//# sourceMappingURL=main.js.map