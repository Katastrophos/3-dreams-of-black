var DunesShaderEffectors = {
	
	position: [ new THREE.Vector3( 0, 0, -1000 ), 
  			 	new THREE.Vector3( -100, 0, -4500 ), 
				new THREE.Vector3( 100, 0, -8000 ), 
				new THREE.Vector3( 2000, 0, -2500 ) ],
	radius: [ 500, 500, 500, 500 ],
	darkness: [ 1.0, 0.5, 0.0, 0.0 ],

	positionFlat: [],
	materials: []
}


var DunesShader = {

	uniforms: {  

		"grassImage":     { type: "t", value: 0, texture: THREE.ImageUtils.loadTexture( 'files/textures/CityShader_Grass.jpg' ) },
		"surfaceImage":   { type: "t", value: 1, texture: THREE.ImageUtils.loadTexture( 'files/textures/CityShader_Clouds.jpg' ) },

		"time": { type: "f", value: 0.0 },

		"target": { type: "fv", value: [] },
		"radius": { type: "fv1", value: [] },
		"darkness": { type: "fv1", value: [] },
		
		"dunesOpacity" : { type: "f", value: 1.0 },
		"invertLightY" : { type: "f", value: 1.0 },
		
		"fogColor": { type: "c", value: new THREE.Color() },
		"fogDensity": { type: "f", value: 0 },

		"enableLighting" : 				{ type: "i", value: 1 },
		"ambientLightColor" : 			{ type: "fv", value: [] },
		"directionalLightDirection" : 	{ type: "fv", value: [] },
		"directionalLightColor" : 		{ type: "fv", value: [] },
		"pointLightColor": 				{ type: "fv", value: [] },
		"pointLightPosition": 			{ type: "fv", value: [] },
		"pointLightDistance": 			{ type: "fv1", value: [] }

	},

	vertexShader: [

		"uniform vec3  ambientLightColor;",
		"uniform vec3  directionalLightColor[ MAX_DIR_LIGHTS ];",
		"uniform vec3  directionalLightDirection[ MAX_DIR_LIGHTS ];",
		"uniform float invertLightY;",
		
		"varying vec3 vWorldPosition;",
		"varying vec3 vColor;",
		"varying vec3 vNormalsquare;",
		"varying vec3 vLightWeighting;",
		"varying vec3 vWorldVector;",

		"void main() {",

			"vec3 transformedNormal = normalize( normalMatrix * normal );",
			"vNormalsquare = transformedNormal * transformedNormal;",
			
			"vColor = color;",

			"vLightWeighting = ambientLightColor;",

			
			"vec3 lightDir = directionalLightDirection[ 0 ];",
			"lightDir.y *= invertLightY;",
			
			"vec4 lDirection = viewMatrix * vec4( lightDir, 0.0 );",
			"float directionalLightWeighting = max( dot( transformedNormal, normalize( lDirection.xyz ) ), 0.0 );",
			"vLightWeighting += directionalLightColor[ 0 ] * directionalLightWeighting;",
			
			
			"lightDir = directionalLightDirection[ 1 ];",
			"lightDir.y *= invertLightY;",

			"lDirection = viewMatrix * vec4( lightDir, 0.0 );",
			"directionalLightWeighting = max( dot( transformedNormal, normalize( lDirection.xyz ) ), 0.0 );",
			"vLightWeighting += directionalLightColor[ 1 ] * directionalLightWeighting;",
			
			
			"vWorldPosition = vec3( objectMatrix * vec4( position, 1.0 )).xyz;",
			"vWorldVector = (vWorldPosition - cameraPosition) * vec3(0.01, 0.02, 0.01);",

			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join("\n"),

	fragmentShader: [


		"const   vec3 	skyBlue = vec3( -0.37, -0.05, 0.15 );",
		"const 	 vec3 	cloudMix = vec3( 0.83 * 0.83, 0.69 * 0.69, 0.51 * 0.51 );",
		"const 	 int  	NUMTARGETS = " + DunesShaderEffectors.position.length + ";",

		"uniform vec3 	target[ NUMTARGETS ];",
		"uniform float 	radius[ NUMTARGETS ];",
		"uniform float 	darkness[ NUMTARGETS ];",

		"uniform sampler2D grassImage;",
		"uniform sampler2D surfaceImage;",

		"uniform float time;",

		"uniform float dunesOpacity;",

		"uniform vec3 fogColor;",
		"uniform float fogDensity;",

		"varying vec3 vColor;",
		"varying vec3 vLightWeighting;",
		"varying vec3 vNormalsquare;",
		"varying vec3 vWorldPosition;",
		"varying vec3 vWorldVector;",

		"void main() {",

			"float f;",
			"vec3 normal;",
			"vec3 sky_color;",
			"vec4 surface;",
			"vec4 grass;",
			

			// surface color

			"float distance = -9999999.0;",
			"float fragmentDarkness = 1.0;",
			
			"for( int i = 0; i < NUMTARGETS; i++ ) {",
				"distance = max( distance, length( vWorldPosition - target[ i ].xyz ) * -1.0 / radius[ i ] );",
				"fragmentDarkness = min( fragmentDarkness, 1.0 - darkness[ i ] );",
			"}",
			
			"vec3 worldPosition = vWorldPosition * 0.0005;",
			"grass = texture2D( grassImage, worldPosition.yz * vec2(10.0)) * vNormalsquare.x + ",
			        "texture2D( grassImage, worldPosition.xz * vec2(10.0)) * vNormalsquare.y + ",
			        "texture2D( grassImage, worldPosition.xy * vec2(10.0)) * vNormalsquare.z;",

			"distance += (0.5 + grass.g) * texture2D(surfaceImage, worldPosition.zx * vec2(3.0)).g;",
			"surface = vec4( vColor, 1.0 );",

			"if(distance > 0.0)",
				"surface = vec4( grass.rgb * fragmentDarkness, grass.w );",


			// clouds

			"gl_FragColor = mix( surface * texture2D( surfaceImage, worldPosition.zx * vec2( 0.4 ) + vec2(time)), surface, vec4( cloudMix, 0.1 ));",
	

			// lights
			
			"gl_FragColor = gl_FragColor * vec4( vLightWeighting, 1.0 );",


			// fog
			
			"const float LOG2 = 1.442695;",
			"float depth = ( gl_FragCoord.z / gl_FragCoord.w ) * 50.0;",
			"float fogFactor = exp2( -fogDensity * fogDensity * depth * depth * LOG2 );",
			"fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );",


			// mix sky color and fog

			"f = max( 0.0, normalize( vWorldVector ).y + cameraPosition.y * 0.0002 - 0.255 );",
			"sky_color = mix( vec3( 1.0 ), skyBlue, f );",

			"gl_FragColor = mix( gl_FragColor, vec4( sky_color, gl_FragColor.w ), fogFactor );",
			"gl_FragColor.a = dunesOpacity;",
		"}"

	].join("\n")

};


function applyDunesShader( result, excludeMap, invertLightY ) {

	var i, name, geometry, obj, mat;

	invertLightY = invertLightY !== undefined ? invertLightY : {};
	excludeMap   = excludeMap   !== undefined ? excludeMap   : {};

	var shaderParams = {

		uniforms: DunesShader.uniforms,
		vertexShader: DunesShader.vertexShader,
		fragmentShader: DunesShader.fragmentShader,

		shading: THREE.FlatShading,
		lights: true,
		fog: true,
		vertexColors: THREE.VertexColors

	};

	shaderParams.uniforms[ 'grassImage' ].texture.wrapS = THREE.RepeatWrapping;
	shaderParams.uniforms[ 'grassImage' ].texture.wrapT = THREE.RepeatWrapping;
	shaderParams.uniforms[ 'surfaceImage' ].texture.wrapS = THREE.RepeatWrapping;
	shaderParams.uniforms[ 'surfaceImage' ].texture.wrapT = THREE.RepeatWrapping;

	function createDunesMaterial( invLight ) {

		mat = new THREE.MeshShaderMaterial( shaderParams );

		mat.uniforms = THREE.UniformsUtils.clone( shaderParams.uniforms );

		mat.uniforms.target.value = DunesShaderEffectors.positionFlat;
		mat.uniforms.radius.value = DunesShaderEffectors.radius;
		mat.uniforms.darkness.value = DunesShaderEffectors.darkness;
		mat.uniforms.grassImage.texture   = shaderParams.uniforms.grassImage.texture;
		mat.uniforms.surfaceImage.texture = shaderParams.uniforms.surfaceImage.texture;
		mat.uniforms.invertLightY.value = invLight;
		
		var opacity = 1.0;
		
		if( obj.materials[ 0 ] !== undefined && !( obj.materials[ 0 ] instanceof THREE.MeshFaceMaterial )) {
			
			opacity = obj.materials[ 0 ].opacity;
			
		} else if( obj.geometry.materials && obj.geometry.materials[ 0 ] && obj.geometry.materials[ 0 ][ 0 ] ) {
			
			opacity = obj.geometry.materials[ 0 ][ 0 ].opacity;
		}
		
		mat.uniforms.dunesOpacity.value = opacity;

		obj.materials[ 0 ] = mat;
		DunesShaderEffectors.materials.push( mat );

	}


	// set materials

	var invertLightYOnThisObject = 1.0;

	for( name in result.objects ) {

		if( excludeMap[ name ] ) continue;

		obj = result.objects[ name ];
		
		if( invertLightY[ name ] ) {
			
			invertLightYOnThisObject = invertLightY[ name ];
			
		} else {
			
			invertLightYOnThisObject = 1.0;	
		}

		if( obj.geometry && obj.geometry.morphTargets.length === 0 ) {

			createDunesMaterial( invertLightYOnThisObject );

		}

	}

};


function updateDunesShader( delta ) {

	// update effectors

	var effector, e, el = DunesShaderEffectors.position.length;
	var p, pos = DunesShaderEffectors.positionFlat;
	
	for( p = 0, e = 0; e < el; e++ ) {
		
		effector = DunesShaderEffectors.position[ e ];
		
		pos[ p++ ] = effector.x;
		pos[ p++ ] = effector.y;
		pos[ p++ ] = effector.z;
	}


	// update time

	var time = DunesShader.uniforms.time.value += delta * 0.00005;
	
	for( e = 0, el = DunesShaderEffectors.materials.length; e < el; e++ ) {
		
		DunesShaderEffectors.materials[ e ].uniforms.time.value = time;
	}
	

};
