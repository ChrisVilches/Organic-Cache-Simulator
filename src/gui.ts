		/// <reference path="jquery.d.ts"/>
		/// <reference path="cache.ts"/>
		
		var blocksize : number;
		var nblocks : number;
		var nvias : number;
		
		var algoritmo : string;
		var tipoAsociatividad : string;
		var addressing : string;
		
		var cache : Cache;
		
		
		/*
		*
		*	Se ejecuta al cargar la pagina
		*
		*/
		
		$(document).ready(function(){
			
			document.title = "Organic Cache Simulator";

			// Configuracion inicial
			
			$("#config_blocksize").val((4).toString());
			$("#config_nblocks").val((16).toString());
			$("#config_nvias").val((4).toString());	
			validarConfiguracion();	
			
			cache = new Cache();	
			
			
			// Evento mouse
			
			$("#btn_procesar").click(function(){	
				procesarDirecciones();			
			});
			
					
		});
		
		
		
		
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
				mostrarError("Ingresar direcciones correctamente");
				return;
			}
			
			// Configurar cache
			cache.configurar(blocksize, nblocks, nvias, algoritmo, tipoAsociatividad, addressing);			
			
			// Obtener tabla cronologica de resultados
			tablaResultado = cache.procesarDirecciones(direcciones);
			
			// Obtener codigo mars
			$("#textarea_codigomars").show();
			$("#textarea_codigomars").html(transpiladorMips.obtenerCodigoMips(direcciones, addressing));
			
			$("#tablaCacheResultado").html(tablaResultado);
			
			$("#hitMissRate").html("<p>Hits: <b>"+cache.hitCount+"</b></p><p>Miss: <b>"+cache.missCount+"</b></p><p>Hit rate: <b>"+cache.hitRate+"%</b></p>");
			
		}
		
		
		
		function crearArregloDirecciones() : number[]{	
			// Todo lo que no es numero, transformarlo a espacio
			var arregloDirecciones : number[];
			var arregloSplit : string[];
			var i : number;
			var textoProcesado : string = $("#textarea_direcciones").val().replace(/[^0-9]+/g, " ");
			
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
					
			var input_asociatividad : string = $("#config_tipoasociatividad").val();
			var input_algoritmo : string = $("#config_algoritmo").val();
			var input_addressing : string = $("#config_addressing").val();
			
			// No puede haber mas bloques que vias, se cambia
			if(input_nvias > input_nblocks){
				$("#config_nvias").val(input_nblocks.toString());
				input_nvias = input_nblocks;
			}
			
			
			// Validar cada uno
		
			if(!numeroCorrecto(input_blocksize)){
				mostrarError("Tamaño de bloque no es correcto. Debe ser numero entero, potencia de 2.");
				return false;
			}
			if(!numeroCorrecto(input_nblocks)){
				mostrarError("Numero de bloques no es correcto. Debe ser numero entero, potencia de 2.");
				return false;
			}
			if(tipoAsociatividad == "sa" && !numeroCorrecto(input_nvias)){
				mostrarError("Numero de vias no es correcto. Debe ser numero entero, potencia de 2.");
				return false;
			}
			
			if(!(input_asociatividad == "md" || input_asociatividad == "sa" || input_asociatividad == "fa")){
				mostrarError("Asociatividad incorrecta.");
				return false;
			}
			
			if(!(input_algoritmo == "lru" || input_algoritmo == "mru" || input_algoritmo == "random")){
				mostrarError("Algoritmo incorrecto.");
				return false;
			}
			
			if(!(input_addressing == "w" || input_addressing == "b")){
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
			
			if(tipoAsociatividad == "md"){
				$("#config_nvias").prop('disabled', true);
				$("#config_setsize").prop('disabled', true);
				$("#config_algoritmo").prop('disabled', true);
				$("#info_nsets").text(nblocks.toString());
				
			} else if(tipoAsociatividad == "sa"){
				$("#config_nvias").prop('disabled', false);
				$("#config_setsize").prop('disabled', false);
				$("#info_nsets").text((nblocks / nvias).toString());
				$("#config_algoritmo").prop('disabled', false);
				
			} else if(tipoAsociatividad == "fa"){
				$("#config_nvias").prop('disabled', true);
				$("#config_setsize").prop('disabled', true);
				$("#info_nsets").text((1).toString());
				$("#config_algoritmo").prop('disabled', false);
			}
			
						
			$("#info_cachesize").text((nblocks * blocksize * 4) + " bytes ("+(nblocks * blocksize)+" palabras)");
			
			mostrarError("");
			
			return true;			
		}		