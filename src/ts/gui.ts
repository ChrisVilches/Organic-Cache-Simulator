		/// <reference path="jquery.d.ts"/>
		/// <reference path="cacheSimulator.ts"/>
        /// <reference path="transpiladorMips.ts"/>

		var blocksize : number;
		var nblocks : number;
		var nvias : number;
		
		var algoritmo : string;
		var tipoAsociatividad : string;
		var addressing : string;
		
		var cache : CacheSimulator;
		
		
		/*
		*
		*	Se ejecuta al cargar la pagina
		*
		*/
		
		$(document).ready(function(){
			// Configuracion inicial
			
			$("#config_blocksize").val((4).toString());
			$("#config_nblocks").val((16).toString());
			$("#config_nvias").val((4).toString());	
			validarConfiguracion();	
			
			cache = new CacheSimulator();	
			
			
			// Evento mouse
			
			$("#btn_procesar").click(procesarDirecciones);
			$("#btn_random").click(setRandomExample);

			setRandomExample();
		});
		
		
		// Agrega un ejemplo aleatorio (lo ingresa en el textarea, y lo ejecuta).
		function setRandomExample() {
			const rand = () => {
				return Math.ceil(Math.random() * 100);
			}

			var values = Array(30);
			for(var i=0; i<values.length; i++){
				values[i] = rand();
			}

			$("#textarea_direcciones").val(values.join(', '));

			procesarDirecciones();
		}
		
		function isPowerOfTwo(x : number) : Boolean{
			while (((x % 2) == 0) && x > 1)
				x /= 2;
			return (x == 1);
		}
		
		
		function numeroCorrecto(num : number) : Boolean{
			if(isPowerOfTwo(num))
				return true;
		}		
		
		
		function mostrarError(text : string) : void{
			$("#span_error").text(text);
		}		
		
		
		function procesarDirecciones() : void{
			var direcciones : number[];
			var tablaResultado : string;
						
			// Primero realizar las validaciones de la configuracion de cache
			if(!validarConfiguracion()){
				return;
			}
			
			// Validar direcciones
			direcciones = crearArregloDirecciones();			
			if(direcciones == null){
				mostrarError("Enter addresses correctly.");
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

			var iconHtml = "<i class='fa fa-angle-right result-item-icon'></i>";
			
			// Mostrar cuenta hit y miss
			$("#hitMissRate").html("<p>"+iconHtml+"Hits: <b>"+cache.hitCount+"</b></p><p>"+iconHtml+"Miss: <b>"+cache.missCount+"</b></p><p>"+iconHtml+"Hit rate: <b>"+cache.hitRate+"%</b></p>");
			
			// Muestra cuantos bits necesita el indice y offset.
			$("#bitsDireccion").html("<p>"+iconHtml+"Index bits: <b>"+cache.bitsIndice+"</b></p><p>"+iconHtml+"Offset bits: <b>"+cache.bitsOffset+"</b></p>");
			
			// Desocultar resultados
			$("#todosResultados").show();
		}
		
		
		
		function crearArregloDirecciones() : number[]{	
			// Todo lo que no es numero, transformarlo a espacio
			var arregloDirecciones : number[];
			var arregloSplit : string[];
			var i : number;
			var textoProcesado : string = $("#textarea_direcciones").val().toString().replace(/[^0-9]+/g, " ");
			
			// Eliminar los espacios de sobra
			textoProcesado = textoProcesado.trim();
			
			// Si no hay texto, retornar null
			if(textoProcesado.length == 0){
				return null;
			}
			
			arregloSplit = textoProcesado.split(" ");
			
			// Crear arreglo numerico
			arregloDirecciones = new Array<number>(arregloSplit.length);
			
			// Convertir a numeros
			for(i=0; i<arregloSplit.length; i++){
				arregloDirecciones[i] = Number(arregloSplit[i]);
			}
			
			// Si hay texto, retornar el arreglo de numeros
			return arregloDirecciones
		}
		
		
		function validarConfiguracion() : Boolean{			
						
			// Obtener los datos de la GUI
			
			var input_blocksize : number = Number($("#config_blocksize").val());
			var input_nblocks : number = Number($("#config_nblocks").val());
			var input_nvias : number = Number($("#config_nvias").val());	
					
			var input_asociatividad : string = $("#config_tipoasociatividad").val().toString();
			var input_algoritmo : string = $("#config_algoritmo").val().toString();
			var input_addressing : string = $("#config_addressing").val().toString();
			
			// No puede haber mas bloques que vias, se cambia
			if(input_nvias > input_nblocks){
				$("#config_nvias").val(input_nblocks.toString());
				input_nvias = input_nblocks;
			}
			
			
			// Validar cada uno
		
			if(!numeroCorrecto(input_blocksize)){
				mostrarError("Block size is incorrect. It must be a power of 2 integer.");
				return false;
			}
			if(!numeroCorrecto(input_nblocks)){
				mostrarError("Number of blocks is incorrect. It must be a power of 2 integer.");
				return false;
			}
			if(tipoAsociatividad == "sa" && !numeroCorrecto(input_nvias)){
				mostrarError("Number of ways is incorrect. It must be a power of 2 integer.");
				return false;
			}
			
			if(!(input_asociatividad == "md" || input_asociatividad == "sa" || input_asociatividad == "fa")){
				mostrarError("Incorrect associativity.");
				return false;
			}
			
			if(!(input_algoritmo == "lru" || input_algoritmo == "mru" || input_algoritmo == "random")){
				mostrarError("Incorrect algorithm.");
				return false;
			}
			
			if(!(input_addressing == "w" || input_addressing == "b")){
				mostrarError("Incorrect addressing type.");
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
			
			if(tipoAsociatividad == "md"){
				$("#config_nvias").prop('disabled', true);
				$("#config_algoritmo").prop('disabled', true);
				// Actualizar automaticamente el numero de vias
				nvias = 1;
				
			} else if(tipoAsociatividad == "sa"){
				$("#config_nvias").prop('disabled', false);
				$("#config_algoritmo").prop('disabled', false);
				// se deja lo que ingreso el usuario
				// nvias = input_nvias;
				
			} else if(tipoAsociatividad == "fa"){
				$("#config_nvias").prop('disabled', true);
				$("#config_algoritmo").prop('disabled', false);
				// Actualizar automaticamente el numero de vias
				nvias = nblocks;
			}
			
			// Cambiar el input de forma automatica
			$("#config_nvias").val(nvias.toString());
			
			// Mostrar informacion (no input de texto)
			$("#info_nsets").text((nblocks / nvias).toString());							
			$("#info_cachesize").text((nblocks * blocksize * 4) + " bytes ("+(nblocks * blocksize)+" words)");
			
			mostrarError("");
			
			return true;			
		}		