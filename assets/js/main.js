import { Pattern } from './pattern.js'

document.addEventListener('DOMContentLoaded', function() {
	'use strict';
	/*
	# El Juego de la Vida (Game of Life - Conwell)
	# Código hecho por Elwin Roman - Universidad Nacional del Altiplano Puno
	# Interfaz inspirada en https://bitstorm.org/gameoflife/
	# 2020
	*/

	// Selectores
	var patronSelect = document.getElementById("select");
	var clearButton = document.getElementById("clear-button");
	var nextButton = document.getElementById("next-button");
	var startButton = document.getElementById("start-button");	//start-stop button
	var speedInput = document.getElementById("speed-range");
	var zoomInput = document.getElementById("zoom-range");
	var numGeneracionMsg = document.getElementById("num-generacion");
	var containerCanvas = document.getElementById('container-canvas');
	var canvas = document.getElementById('myCanvas');


	// Estilos del "<div class='container-canvas'></div>"
	var style = window.getComputedStyle(containerCanvas, null);
	var paddingStringC = {
		left: style.getPropertyValue('padding-left'),
		right: style.getPropertyValue('padding-right'),
		top: style.getPropertyValue('padding-top'),
		bottom: style.getPropertyValue('padding-bottom')
	};
	var paddingC = {
		left: parseInt(paddingStringC.left.slice(0,-2)),
		right: parseInt(paddingStringC.right.slice(0,-2)),
		top: parseInt(paddingStringC.top.slice(0,-2)),
		bottom: parseInt(paddingStringC.bottom.slice(0,-2))	
	};

	// Funciones principales del juego
	var gameGridArea = GameGridArea();	// área de dibujo
	var gamePanel = GameControlPanel();	// panel de control (funcionalidades)
	var automata = AutomataCelular();	// autómata celular (Juego de la Vida - Conwell)

	gameGridArea.drawGrid();
	gameGridArea.clickEvent();

	gamePanel.selectControl();
	gamePanel.clearControl();
	gamePanel.nextControl();
	gamePanel.startControl();
	gamePanel.speedControl();
	gamePanel.zoomControl();

	// Actualiza el tamaño del canvas según el tamaño de la ventana del browser
	window.addEventListener('resize', function() {
		canvas.getAttributeNode('width').value = containerCanvas.clientWidth-(paddingC.right+paddingC.left);
		canvas.getAttributeNode('height').value = containerCanvas.clientHeight-(paddingC.bottom+paddingC.top);

		gameGridArea.recalcularWidthHeight();
		gameGridArea.centrar();
		gameGridArea.actualizarCeldCoords();

		automata.setDistanciaMatriz(gameGridArea.getCentroGrid());

		gameGridArea.limpiarLienzo();
		gameGridArea.drawGrid();	//re-draw grid
		gameGridArea.pintarCeldillasActivadasAll();
	}, false);

	/* Main function for the game area*/
	function GameGridArea() {
		(function __init__() {
			// Establece el tamaño del grid-area
			canvas.getAttributeNode('width').value = containerCanvas.clientWidth-(paddingC.right+paddingC.left);
			canvas.getAttributeNode('height').value = containerCanvas.clientHeight-(paddingC.bottom+paddingC.top);
		})();
		var ctx = canvas.getContext('2d');
		// #-#-#-#-#-#-#-#-#-# ATRIBUTOS #-#-#-#-#-#-#-#-# 
		var cWidth = canvas.width;	 			// width del contenedor canvas general
		var cHeight = canvas.height; 			// height del contenedor canvas general
		var p = 1;								// padding
		var sizeC = parseInt(zoomInput.value); 	// tamaño de las celdillas (ZOOM SIZE)

		var gWidth = cWidth-(2*p);					// width del grid-area sin el padding
		var gHeight = cHeight-(2*p);				// height del grid-area sin el padding
		var nLinesColumn = Math.ceil(gWidth/sizeC);	// número de lineas en la columna
		var nLinesRow = Math.ceil(gHeight/sizeC);	// número de lineas en la fila
		var celdCoords = [];						/* almacena en un array la ubicación de las celdillas activadas... 
													   ...la fila y la columna como una especie de matriz */

		var colorLineGrid = "#2b485d";				// color de las lineas del grid
		var colorCeldilla = "yellow";				// color de las celdillas
		var colorBackgroundCanvas = "#0d2e46";	// color del grid-area
		
		var distanciaZoom = { x: 0, y: 0 };		/* distancia de traslación de celdillas (no pixeles) ...
												   ...para centrar los grids al hacer zoom */
		var centroGrid = {						
			x: Math.floor(nLinesColumn/2),
			y: Math.floor(nLinesRow/2)
		};
		var old = {			// Valores anteriores 
			sizeC: sizeC,
			centroGrid: {centroGrid}
		};
		var patronName = patronSelect.value;
		// #-#-#-#-#-#-#-#-# END ATRIBUTOS #-#-#-#-#-#-#-#-# 
		(function __init__2__() {
			// Dibuja el patron "selected" del select
			celdCoords = Pattern(patronName, centroGrid);
			pintarCeldillasActivadasAll();
		})();

		/* Dibuja las celdillas (grid) */
		function drawGrid() {
			ctx.beginPath();
			ctx.strokeStyle = colorLineGrid;

			// Dibujar lineas verticales (Columnas)
			for(var i=0,j=0; j<nLinesColumn; i+=sizeC,j++) {
				ctx.moveTo(0.5+i+p, p);
				ctx.lineTo(0.5+i+p, cHeight-p);
			}
			// Dibuja lineas horizontales (Filas)
			for(var i=0,j=0; j<nLinesRow; i+=sizeC,j++) {
				ctx.moveTo(p, 0.5+i+p);
				ctx.lineTo(cWidth-p, 0.5+i+p);
			}
			ctx.stroke();
		}
		/*
		* [Tarea 1] Activa o desactiva una celdilla pintandola o despintadola al hacer click en una celdilla.
		* [Tarea 2] Guarda en la matriz la celdilla activada (celula viva)
		* [Tarea 3] Almacena información de la célula activada (row and column) en la matriz del autómata
		*/
		function clickEvent() {
			canvas.addEventListener('click', function(evt) {
				var mousePos = getMousePos(evt);	
				var column = Math.floor((mousePos.x-p)/sizeC);
				var row = Math.floor((mousePos.y-p)/sizeC);
				// console.log(column + "," + row);

				// Almacena información de la posición de las celdillas activadas
				var celdPosition = { x: column, y: row };
				var index = buscarCoordenadaCeldilla(celdCoords, celdPosition)
				
				// Si ya existe la coordenada, lo quitamos del array, despintamos la celdilla, desactivamos en la matriz del autómata
				if( index > -1 ) {
					celdCoords.splice(index, 1);
					ctx.fillStyle = colorBackgroundCanvas;
					ctx.fillRect(column*sizeC+p+1, row*sizeC+p+1, sizeC-1, sizeC-1);
					automata.setCelulaMuerta(celdPosition);
				} 
				// caso contrario, agregamos la coordenada, pintamos la celdilla, activamos en la matriz del automáta
				else {
					celdCoords.push(celdPosition);
					ctx.fillStyle = colorCeldilla;
					ctx.fillRect(column*sizeC+p+1, row*sizeC+p+1, sizeC-1, sizeC-1);
					automata.setCelulaViva(celdPosition);
				}
			}, false);
		}
		/* 
		* Recalcula y actualiza el tamaño del contenedor canvas y del grid area 
		* al reducir la ventana. 
		*/
		function recalcularWidthHeight() {
			cWidth = canvas.width;
			cHeight = canvas.height;

			gWidth = cWidth-2*p;
			gHeight = cHeight-2*p;
		}
		/* Calcula la distancia de traslación para centrar lo máximo posible las celdillas activadas 
		   ...cada vez que se haga zoom o se cambie el tamaño de la pantalla */
		function centrar() {
			nLinesColumn = Math.ceil(gWidth/sizeC);
			nLinesRow = Math.ceil(gHeight/sizeC);
			old.centroGrid = Object.assign({},centroGrid);	//copiar objeto
			centroGrid.x =  Math.floor(nLinesColumn/2);
			centroGrid.y = Math.floor(nLinesRow/2);
			distanciaZoom.x = centroGrid.x - old.centroGrid.x;
			distanciaZoom.y = centroGrid.y - old.centroGrid.y;
		}
		/* 
		* Rellena las celdillas previamente activadas
		* al reducir el tamaño de la ventana o al hacer ZOOM
		*/
		function pintarCeldillasActivadasAll() {
			ctx.fillStyle = colorCeldilla;
			for(var i=0; i<celdCoords.length; i++)
				ctx.fillRect(celdCoords[i].x*sizeC+p+1, celdCoords[i].y*sizeC+p+1, sizeC-1, sizeC-1);
		}
		/*
		* Obtiene las coordenadas X e Y de canvas.
		* @param[event] evt: Manejador de eventos
		* @return{int} Las correspondientes coordenadas. 
		*/
		function getMousePos(evt) {
			var rect = canvas.getBoundingClientRect();
			return {
				x: evt.clientX - rect.left,
				y: evt.clientY - rect.top
			}
		}
		/* 
		* Busca un elemento de un array y devuelve su posición, 
		* y si no lo encuentra devuelve cualquier número negativo.
		* @param[ArrayObjects] array: Arreglo de elementos que contiene objetos, coordenadass de celdillas activadas
		* @param[Object] elemento: Coordenada que se quiere encontrar en el array 
		* @return{pos} Retorna la posición de la coordenada en el array. 
		*/
		function buscarCoordenadaCeldilla(array, elemento) {
			var pos = 0;
			for(var item of array) {
				if(item.x == elemento.x && item.y == elemento.y)
					return pos;
				pos++; 
			}
			return -3; // no se encontró el elemento (la coordenada)
		}
		return {
			clickEvent: function() {
				clickEvent();
			},
			actualizarCeldCoords: function() {
				for(var item of celdCoords) {
					item.x += distanciaZoom.x;
					item.y += distanciaZoom.y;
				}
			},
			recalcularWidthHeight: function() { 
				recalcularWidthHeight(); 
			},
			resetCeldCoords: function() {
				celdCoords.length = 0;
			},
			centrar: function() {
				centrar();
			},
			limpiarLienzo: function() {
				ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height);
			},
			drawGrid: function(){
				drawGrid();
			},
			pintarCeldillasActivadasAll: function() {
				pintarCeldillasActivadasAll();
			},
			// Setters and Getters
			setZoomSize: function(zoomSize) {
				old.sizeC = sizeC;
				sizeC = zoomSize;
			},
			setCeldCoords: function(newCeldCoords) {
				celdCoords.length = 0;
				celdCoords = newCeldCoords;
			},
			getCentroGrid: function() {
				return centroGrid;
			},
			/*new code*/
			setPatron: function(newPatronName) {
				patronName = newPatronName;
			},
			getPatron: function() {
				return patronName;
			},
			drawPatron: function() {
				celdCoords = Pattern(patronName, centroGrid);
				automata.setCelulasVivasAll(celdCoords);
				pintarCeldillasActivadasAll();
			}
			/* end of new code*/
		}
	}
	/*
	* OBJECTO función que controla el panel de control del juego.
	*/
	function GameControlPanel() {
		// #-#-#-#-#-#-#-#-#-# ATRIBUTOS #-#-#-#-#-#-#-#-# 
		const ACTIVO = 1;
		const INACTIVO = 0;
		var minZoomSize = parseInt(buscarAtributo(zoomInput, "min"));// atributo 'min' del <input type="range" class="zoomInput"> (sirve para crear la matriz)
		var ID = undefined;								// intervalo de ejecución
		var estado = INACTIVO;							// variable que ayuda a simular un 'Toggle' ##### 1 = start Y 0 = stop
		var speed = -parseInt(speedInput.value);		// velocidad de ejecución para setInterval, expresada en milisegundos
		// var speed = 30;
		// #-#-#-#-#-#-#-#-# END ATRIBUTOS #-#-#-#-#-#-#-#-#

		/* Lista de patrones de células */
		function selectControl() {
			patronSelect.addEventListener('change', function() {
				var patronName = this.value;
				reiniciarJuego();
				gameGridArea.setPatron(patronName);
				gameGridArea.drawPatron();
			}, false);
		} 
		/* Boton que ejecuta una vez el algoritmo y muestra la siguiente generación */
		function nextControl() {
			nextButton.addEventListener('click', function() {
				iniciarJuego();
			}, false);
		}
		/* Boton que inicia el juego y se ejecuta indefinidamente hasta que se haga click en 'Stop' */
		function startControl() {
			startButton.addEventListener('click', function() {
				estado = 1-estado;
				if(estado === ACTIVO) {
					startButton.innerHTML = "Stop";
					ID = setInterval(iniciarJuego, speed);
					// Cambiar el color del boton
					this.classList.remove("btn-green");
					this.classList.add("btn-red");
				} else if(estado === INACTIVO) {
					startButton.innerHTML = "Start";
					clearInterval(ID);
					// Cambiar el color del boton
					this.classList.remove("btn-red");
					this.classList.add("btn-green");
				}
			}, false);
		}
		/* Controla el zoom del juego (tamaño de las celdillas o celdillas) */
		function zoomControl() {
			zoomInput.addEventListener('change',function() {
				var newZoomSize = parseInt(this.value);

				gameGridArea.setZoomSize(newZoomSize);
				gameGridArea.centrar();
				gameGridArea.actualizarCeldCoords();

				automata.setDistanciaMatriz(gameGridArea.getCentroGrid());

				gameGridArea.limpiarLienzo();
				gameGridArea.drawGrid();	//re-draw grid
				gameGridArea.pintarCeldillasActivadasAll();
			}, false);
		}
		function speedControl() {
			speedInput.addEventListener('change', function() {
				speed = -parseInt(this.value);
				if(estado === ACTIVO) {
					clearInterval(ID);
					ID = setInterval(iniciarJuego, speed);
				}
			}, false);
		}
		/* Limpia el área-grid y reinicia todo */
		function reiniciarJuego() {
			gameGridArea.resetCeldCoords();
			automata.resetMatriz();
			gameGridArea.limpiarLienzo();
			gameGridArea.drawGrid(); //re-draw grid
			automata.resetNumGeneraciones();
		}
		function iniciarJuego() {
			automata.analizarEstadoCelulas();
			var celdCoordsNextGeneracion = automata.returnCeldCoordsNextGeneration(); 
			
			gameGridArea.setCeldCoords(celdCoordsNextGeneracion);
			automata.actualizarMatrizPresentGeneration();
			automata.resetMatrizNextGeneracion();

			gameGridArea.limpiarLienzo();
			gameGridArea.drawGrid();
			gameGridArea.pintarCeldillasActivadasAll();	

			numGeneracionMsg.innerHTML = automata.getNumGeneraciones();	
		}
		/*
		* Busca un atributo en un elemento del DOM
		* @param[DOM Object] elementoDOM: Elemento del DOM
		* @param[string] 			attr: Nombre del atributo
		* @return{string}				  Retorna el valor del atributo, si no se encuentra retorna "not-found"
		*/
		function buscarAtributo(elementoDOM, attr) {
			for(var x=0; x<elementoDOM.attributes.length; x++) {
				var nombreAtributo = elementoDOM.attributes[x].name;
				var valorAtributo = elementoDOM.attributes[x].value;
				if(nombreAtributo === attr)
					return valorAtributo;
			}
			// Nota: No debería ejecutarse esta parte de código
			alert("El atributo " + attr + " no ha sido encontrado.");
			return "volvé a mirar el código gil";
		}
		return {
			zoomControl: function() {
				zoomControl();
			},
			clearControl: function() {
				clearButton.addEventListener('click', function() {
					reiniciarJuego();
				}, false);
			},
			nextControl: function() {
				nextControl();	
			},
			startControl: function() {
				startControl();
			},
			speedControl: function() {
				speedControl();
			},
			selectControl: function() {
				selectControl();
			},
			// Setters and Getters
			getMinZoomSize: function() {
				return minZoomSize;
			}
		}
	}

	function AutomataCelular() {

		// #-#-#-#-#-#-#-#-#-# ATRIBUTOS #-#-#-#-#-#-#-#-# 
		var matrizPresentGeneration = [];	// matriz contenedora de la generación actual
		var matrizNextGeneration = [];		// matriz de la siguiente generación
		const CELULA_VIVA = 1;				// celdilla activada (coloreada) representada por el 1
		const CELULA_MUERTA = 0;			// celdilla no coloreada representada por el 0
		var numGeneraciones = 0;			// contador de generaciones

		var sizeM = gamePanel.getMinZoomSize();			// tamaño de las celdillas solo para efectos de dibujo 
		var screenWidth = window.screen.width;			// largo absoluto de la pantalla del usuario
		var screenHeight = window.screen.height;		// ancho absoluto de la pantalla del usuario 
		var columnas = Math.floor(screenWidth/sizeM);	// número de columnas, similar a nLinesColumn-1 (ceil)
		var filas = Math.floor(screenHeight/sizeM);		// número de filas, similar a nLinesRow-1 (ceil)
		var centroMatriz = {							// centro de la matriz
			x: Math.floor(columnas/2),
			y: Math.floor(filas/2)
		};
		var centroGrid = Object.assign({},gameGridArea.getCentroGrid());	//centro del zoom actual del grid-area
		var distanciaMatriz = {		// distancia entre las celdillas de la matriz y el actual zoom del grid
			x: centroMatriz.x - centroGrid.x,
			y: centroMatriz.y - centroGrid.y
		};
		// #-#-#-#-#-#-#-#-# END ATRIBUTOS #-#-#-#-#-#-#-#-#
		(function __init__() {
			// Generando las matrices de la actual y siguiente generación.
			create2DArrays();
			// Patron inicial seleccionado
			var initCoords = Pattern(gameGridArea.getPatron(), centroGrid);
			setCelulasVivasAll(initCoords);
		})();
		/*
		* Crea arrays bidimensionales, posteriormente asigna a todas las casillas el valor de 0...
		* ...que representa células muertas.
		*/
		function create2DArrays() {
			matrizPresentGeneration = new Array(filas);
			matrizNextGeneration = new Array(filas);
			for(var i=0; i<filas; i++) {
				matrizPresentGeneration[i] = new Array(columnas);
				matrizNextGeneration[i] = new Array(columnas);
			}
			setCelulasMuertasAll(matrizPresentGeneration);
			setCelulasMuertasAll(matrizNextGeneration);
		}
		/* 
		* Llena la matriz con células muertas, en otras palabras, resetea la matriz pasada como parámetro 
		* @param[array] matriz: Matriz bidimensional
		*/
		function setCelulasMuertasAll(matriz) {
			for(var i=0; i<filas; i++) {
				for(var j=0; j<columnas; j++)
					matriz[i][j] = CELULA_MUERTA;
			}
		}
		/* 
		* Almacena en la generación actual la celula activada en el grid-area. 
		* @param[object] celdPosition: posición en (x,y) de la celdilla pintada.  
		*/
		function setCelulaViva(celdPosition) {
			matrizPresentGeneration[celdPosition.y+distanciaMatriz.y][celdPosition.x+distanciaMatriz.x] = CELULA_VIVA;
		}
		/* 
		* Desactiva en la generación actual la celula previamente activada en el grid-area. 
		* @param[object] celdPosition: posición en (x,y) de la celdilla pintada. 
		*/
		function setCelulaMuerta(celdPosition) {
			matrizPresentGeneration[celdPosition.y+distanciaMatriz.y][celdPosition.x+distanciaMatriz.x] = CELULA_MUERTA;
		}
		/* Algoritmo principal del autómata */
		function analizarEstadoCelulas() {
			//analizar cada celdilla de la matriz EXCEPTO los bordes que rodean de la matriz
			for(var i=1; i<filas-1; i++) {
				for(var j=1; j<columnas-1; j++) {
					var vecinosVivos = calcularVecinosVivos(i,j);

					// si existen 2 vecinos vivos la celdilla no sufre cambios, ya sea que esté viva o muerta
					if( vecinosVivos != 2 )
						matrizNextGeneration[i][j] = aplicarRegla(vecinosVivos);
					else
						matrizNextGeneration[i][j] = matrizPresentGeneration[i][j];
				}
			}
			numGeneraciones++;
		}
		/*
		* Calcula los celdillas adyacentes a la celdilla analizada llamadas "vecinos"
		* estos "vecinos" cubren completamente a la celdilla analizada y son en total 8 celdillas
		+	    	 _ _ _
		+ 			|_|_|_|
		+			|_|§|_|
		+			|_|_|_|
		+
		* @param[int] i: Posición en la fila
		* @param[int] j: Posición en la columna
		* @return{int} numVecinos: Número de celulas vivas vecinas encontrados
		*/
		function calcularVecinosVivos(i,j) {
			var numVecinos = 0;
			// Para los vecinos de arriba (3)
			for(var cont=0; cont<3; cont++) {
				if(matrizPresentGeneration[i-1][j-1+cont] === CELULA_VIVA)
					numVecinos++;
			}
			// Para los vecinos del lado derecho e izquierdo (2)
			if(matrizPresentGeneration[i][j-1] === CELULA_VIVA) // Izquierda
				numVecinos++;
			if(matrizPresentGeneration[i][j+1] === CELULA_VIVA) // Derecha
				numVecinos++;
			// Para los vecinos de abajo (3)
			for(var cont=0; cont<3; cont++) {
				if(matrizPresentGeneration[i+1][j-1+cont] === CELULA_VIVA)
					numVecinos++;
			}
			return numVecinos;
		}
		function aplicarRegla(vecinosVivos) {
			// La celdilla revisada -MUERE por despoblación
			if( vecinosVivos < 2 )
				return CELULA_MUERTA;
			// La celdilla revisada da a lugar a una celula nueva-VIVA 
			if( vecinosVivos === 3 )
				return CELULA_VIVA;
			// La celdilla revisada -MUERE por sobrepoblación
			if( vecinosVivos > 3 )
				return CELULA_MUERTA;
		}
		/* Una vez terminado el ciclo, la siguiente generación pasa a convertirse en la actual generación */
		/* Actualiza la matriz generación actual */
		function actualizarMatrizPresentGeneration() {
			for(var i=0; i<filas; i++) {
				for(var j=0; j<columnas; j++)
					matrizPresentGeneration[i][j] = matrizNextGeneration[i][j];
			}
		}
		/* 
		* Activa celulas vivas según que celdillas estén activadas (pintadas) en el grid-area
		* @param[array] celdCoords: Contiene las coordenas de todas las celdillas pintadas
		*/
		function setCelulasVivasAll(celdCoords) {
			for(var i=0; i<celdCoords.length; i++) {
				var celdPosition = celdCoords[i];
				matrizPresentGeneration[celdPosition.y+distanciaMatriz.y][celdPosition.x+distanciaMatriz.x] = CELULA_VIVA;
			}
		}
		return {
			resetMatrizNextGeneracion: function() {
				setCelulasMuertasAll(matrizNextGeneration);
			},	
			resetMatriz: function() {
				setCelulasMuertasAll(matrizPresentGeneration);
			},
			resetNumGeneraciones: function() {
				numGeneraciones = 0;
				numGeneracionMsg.innerHTML = 0;
			},
			actualizarMatrizPresentGeneration: function() {
				actualizarMatrizPresentGeneration();
			},
			analizarEstadoCelulas: function() {
				analizarEstadoCelulas();
			},
			setCelulasVivasAll: function(celdCoords) {
				setCelulasVivasAll(celdCoords);
			},
			returnCeldCoordsNextGeneration: function() {
				var celdCoords = [];
				for(var i=0; i<filas; i++) {
					for(var j=0; j<columnas; j++) {
						// Si hay una celdilla activada, se convierte su coordenada para pintarla
						if(matrizNextGeneration[i][j] === CELULA_VIVA) {
							var coord = {
								x: j-distanciaMatriz.x,
								y: i-distanciaMatriz.y
							};
							celdCoords.push(coord);
						}
					}
				}
				return celdCoords;
			},
			// SETTERS AND GETTERS
			setCelulaViva: function(coord) {
				setCelulaViva(coord);
			},
			setCelulaMuerta: function(coord) {
				setCelulaMuerta(coord);
			},
			setDistanciaMatriz: function(centroGrid) {
				distanciaMatriz.x = centroMatriz.x - centroGrid.x;
				distanciaMatriz.y = centroMatriz.y - centroGrid.y;
			},
			getNumGeneraciones: function() {
				return numGeneraciones;
			}
		}
	}
});