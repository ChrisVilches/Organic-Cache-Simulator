		var blocksize;
		var nblocks;
		var nvias;
		var algoritmo;
		var tipoAsociatividad;
		
		function numeroCorrecto(num){
			if(!Number.isInteger(num)){
				return false;
			}
			
			// DEBE SER POTENCIA DE DOS
			
			return true;
		}
		
		function mostrarError(text){
			$("#span_error").text(text);
		}
		
		function procesarDirecciones(){
			var direcciones;
			
			if(!validarConfiguracion()){
				return;
			}
			
			direcciones = crearArregloDirecciones();
			
		}
		
		function crearArregloDirecciones(){
			
			// ESTO NO FUNCIONA 100% COMO ESPERADO
			return $("#textarea_direcciones").val().split(/[^1-9]+/g);
		}
		
		
		function validarConfiguracion(){
			
			// Obtiene los datos desde GUI una vez mas (para estar seguros)
			actualizarConfigInfo();
			
			if(!numeroCorrecto(blocksize)){
				mostrarError("Tamaño de bloque no es correcto. Debe ser numero entero, potencia de 2.");
				return false;
			}
			if(!numeroCorrecto(nblocks)){
				mostrarError("Numero de bloques no es correcto. Debe ser numero entero, potencia de 2.");
				return false;
			}
			if(!numeroCorrecto(nvias) && tipoAsociatividad == "sa"){
				mostrarError("Numero de vias no es correcto. Debe ser numero entero, potencia de 2.");
				return false;
			}
			
			if(!(tipoAsociatividad == "md" || "sa" || "fa")){
				mostrarError("Asociatividad incorrecta");
				return false;
			}
			
			if(!(algoritmo == "lru" || "mru" || "random")){
				mostrarError("Asociatividad incorrecta");
				return false;
			}
			
			mostrarError("");
			
			return true;			
		}
		

		function actualizarConfigInfo(){
			
			// Obtener datos desde la GUI
			
			blocksize = Number($("#config_blocksize").val());
			nblocks = Number($("#config_nblocks").val());
			nvias = Number($("#config_nvias").val());	
			tipoAsociatividad = $("#config_tipoasociatividad").val();
			algoritmo = $("#config_algoritmo").val();	
			
		
			// habilitar/deshabilitar los inputs relacionados con asociatividad	
			// y mostrar informacion sobre cache
			
			if(tipoAsociatividad == "md"){
				$("#config_nvias").prop('disabled', true);
				$("#config_setsize").prop('disabled', true);
				$("#config_algoritmo").prop('disabled', true);
				$("#info_nsets").text(nblocks);
				
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
			
			// Cache size (total)			
			$("#info_cachesize").text((nblocks * blocksize * 4) + " bytes");						
		}
		

		$(document).ready(function(){
			
			// Configuracion inicial
			
			$("#config_blocksize").val((4).toString());
			$("#config_nblocks").val((16).toString());
			$("#config_nvias").val((4).toString());	
			
			// Actualiza la asociatividad (valor inicial)
			// y encuentra la informacion del cache
			actualizarConfigInfo();	
			
			
			$("#btn_procesar").click(function(){	
				procesarDirecciones();			
			});
			
					
		});