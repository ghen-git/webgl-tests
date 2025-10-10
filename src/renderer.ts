import { mat4, quat, vec3, vec4 } from 'gl-matrix';
import { axisAngleToQuat, quaternionToRotationMatrix, quatMul, quatToAxisAngle, rgbToScreenSpace, toRad } from './math_ops';

interface Object {
    triangles: Triangle[],
    vertices: VertexData[],
    position: vec3,
    scale: vec3,
    rotation: quat,
    speed: number
}

interface Triangle {
    vertexIndexes: number[]
}

interface VertexData {
    vertex: vec3,
    colour: vec4,
    normal: vec3
}

const vertexShader = `#version 300 es
precision highp float;

in vec4 aVertexPosition;
in vec4 aVertexColour;
in vec4 aVertexNormal;
in float aModelViewMatrixIndex;

uniform mat4 uProjectionMatrix;
uniform sampler2D uModelViewMatricesTexture;

out highp vec4 vColour;

vec4 getValueByIndexFromTexture(sampler2D tex, int index);

void main() {
    mat4 modelViewMatrix = mat4(
        getValueByIndexFromTexture(uModelViewMatricesTexture, int(aModelViewMatrixIndex) * 4 + 0),
        getValueByIndexFromTexture(uModelViewMatricesTexture, int(aModelViewMatrixIndex) * 4 + 1),
        getValueByIndexFromTexture(uModelViewMatricesTexture, int(aModelViewMatrixIndex) * 4 + 2),
        getValueByIndexFromTexture(uModelViewMatricesTexture, int(aModelViewMatrixIndex) * 4 + 3)
    );

    gl_Position = uProjectionMatrix * modelViewMatrix * aVertexPosition;
    float depthFog = clamp(1.0 / (gl_Position.w) * 20.0, 0.0, 1.0);
    vColour = aVertexColour * vec4(depthFog, depthFog, depthFog, 1);
}

vec4 getValueByIndexFromTexture(sampler2D tex, int index) {
  int texWidth = textureSize(tex, 0).x;
  int col = index % texWidth;
  int row = index / texWidth;
  return texelFetch(tex, ivec2(col, row), 0);
}
`;

const fragmentShader = `#version 300 es
precision highp float;

in highp vec4 vColour;
out vec4 fragColor;
void main() {
    fragColor = vColour;
}
`;

const colours = {
    deep_dark_red: rgbToScreenSpace(79, 0, 11),
    dark_red: rgbToScreenSpace(114, 0, 38),
    pink: rgbToScreenSpace(206, 66, 87),
    salmon: rgbToScreenSpace(255, 127, 81),
    orange: rgbToScreenSpace(255, 155, 84)
};

const cubeVertices: VertexData[] = [
    { vertex: [-.5, -.5 + -.0, -.5], colour: colours.orange, normal: [0.0, -1.0, 0.0] }, // 
    { vertex: [.5, -.5 + -.0, -.5], colour: colours.orange, normal: [0.0, -1.0, 0.0] },
    { vertex: [-.5, -.5 + -.0, .5], colour: colours.orange, normal: [0.0, -1.0, 0.0] },
    { vertex: [.5, -.5 + -.0, .5], colour: colours.orange, normal: [0.0, -1.0, 0.0] }, // bottom face 0 - 3
    { vertex: [-.5, .5 + 0.0, -.5], colour: colours.dark_red, normal: [0.0, 1.0, 0.0] },
    { vertex: [.5, .5 + 0.0, -.5], colour: colours.dark_red, normal: [0.0, 1.0, 0.0] },
    { vertex: [-.5, .5 + 0.0, .5], colour: colours.dark_red, normal: [0.0, 1.0, 0.0] },
    { vertex: [.5, .5 + 0.0, .5], colour: colours.dark_red, normal: [0.0, 1.0, 0.0] }, // top face 4 - 7
    { vertex: [-.5, -.5, -.5 + -.0], colour: colours.orange, normal: [0.0, 0.0, 1.0] },
    { vertex: [.5, -.5, -.5 + -.0], colour: colours.orange, normal: [0.0, 0.0, 1.0] },
    { vertex: [-.5, .5, -.5 + -.0], colour: colours.orange, normal: [0.0, 0.0, 1.0] },
    { vertex: [.5, .5, -.5 + -.0], colour: colours.orange, normal: [0.0, 0.0, 1.0] }, // front face 8 - 11
    { vertex: [-.5, -.5, .5 + .0], colour: colours.pink, normal: [0.0, 0.0, -1.0] },
    { vertex: [.5, -.5, .5 + .0], colour: colours.pink, normal: [0.0, 0.0, -1.0] },
    { vertex: [-.5, .5, .5 + .0], colour: colours.pink, normal: [0.0, 0.0, -1.0] },
    { vertex: [.5, .5, .5 + .0], colour: colours.pink, normal: [0.0, 0.0, -1.0] }, // back face 12 - 15
    { vertex: [-.5 - .0, -.5, -.5], colour: colours.salmon, normal: [-1.0, 0.0, 0.0] },
    { vertex: [-.5 - .0, -.5, .5], colour: colours.salmon, normal: [-1.0, 0.0, 0.0] },
    { vertex: [-.5 - .0, .5, -.5], colour: colours.salmon, normal: [-1.0, 0.0, 0.0] },
    { vertex: [-.5 - .0, .5, .5], colour: colours.salmon, normal: [-1.0, 0.0, 0.0] }, // left face 16 - 19
    { vertex: [.5 + .0, -.5, -.5], colour: colours.salmon, normal: [1.0, 0.0, 0.0] },
    { vertex: [.5 + .0, -.5, .5], colour: colours.salmon, normal: [1.0, 0.0, 0.0] },
    { vertex: [.5 + .0, .5, -.5], colour: colours.salmon, normal: [1.0, 0.0, 0.0] },
    { vertex: [.5 + .0, .5, .5], colour: colours.salmon, normal: [1.0, 0.0, 0.0] }, // right face
];

const cubeTriangles: Triangle[] = [
    { vertexIndexes: [2, 0, 1] },
    { vertexIndexes: [1, 3, 2] }, // bottom
    { vertexIndexes: [16, 17, 18] },
    { vertexIndexes: [17, 18, 19] }, // left
    { vertexIndexes: [20, 21, 22] },
    { vertexIndexes: [21, 22, 23] }, // right
    { vertexIndexes: [6, 4, 5] },
    { vertexIndexes: [5, 7, 6] }, // top
    { vertexIndexes: [8, 9, 10] },
    { vertexIndexes: [9, 10, 11] }, // front
    { vertexIndexes: [12, 13, 14] },
    { vertexIndexes: [13, 14, 15] }, // back
];

// const cube: Object = {
//     triangles: cubeTriangles,
//     vertices: cubeVertices,
//     position: vec3.fromValues(0, 0, -4),
//     rotation: quat.create()
// }

export function init(canvas: HTMLCanvasElement, window: Window) {
    const gl = canvas.getContext('webgl2');

    if (gl == null) {
        console.error('unable to initialize WebGL');
        return;
    }

    const renderer = new Renderer(gl, canvas, window);

    renderer.start();
}

export class Renderer {
    private gl: WebGL2RenderingContext;
    private canvas: HTMLCanvasElement;
    private window: Window;
    private renderingData?: { [id: string]: any };
    private objects: Object[];

    constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, window: Window) {
        this.gl = gl;
        this.canvas = canvas;
        this.window = window;
        this.objects = [];
    }

    /**
     * starts the renderer (and the loop that re-renders the scene every frame)
     */
    start() {
        const bg = rgbToScreenSpace(17, 17, 17);
        this.gl.clearColor(bg[0], bg[1], bg[2], 1); // sets the value for the colour buffer bit
        this.gl.depthFunc(this.gl.LEQUAL); // sets the comparison to see if an object's z is closer than another to <=
        this.gl.enable(this.gl.DEPTH_TEST); // activates depth testing (closer triangles get rendered on top of further ones)


        for (let i = 0; i < 10000; i++) {
            this.objects.push({
                triangles: cubeTriangles,
                vertices: cubeVertices,
                position: vec3.fromValues(randInt(-50, 50), randInt(-50, 50), randInt(-30, -50 * 5)),
                rotation: quat.create()
            });
        }

        const program = this.createShaderProgram();

        const positionBuffer = this.gl.createBuffer();
        const colourBuffer = this.gl.createBuffer();
        const normalBuffer = this.gl.createBuffer();
        const indexBuffer = this.gl.createBuffer();
        const modelViewMatrixIndexBuffer = this.gl.createBuffer();

        const modelViewMatricesTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, modelViewMatricesTexture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);


        const projectionMatrix = this.createProjectionMatrix(70, 0.01, 100000);

        this.renderingData = {
            program: program,
            projectionMat: projectionMatrix,
            shaderAttrs: {
                vertexPosition: this.gl.getAttribLocation(program, "aVertexPosition"),
                vertexColourAttr: this.gl.getAttribLocation(program, "aVertexColour"),
                vertexNormalAttr: this.gl.getAttribLocation(program, "aVertexNormal"),
                modelViewMatrixIndexAttr: this.gl.getAttribLocation(program, "aModelViewMatrixIndex")
            },
            shaderUniforms: {
                projectionMat: this.gl.getUniformLocation(program, "uProjectionMatrix"),
                modelViewMatricesTexture: this.gl.getUniformLocation(program, "uModelViewMatricesTexture")
            },
            shaderTextures: {
                modelViewMatricesTexture: modelViewMatricesTexture
            },
            positionBuffer: positionBuffer,
            colourBuffer: colourBuffer,
            normalBuffer: normalBuffer,
            indexBuffer: indexBuffer,
            modelViewMatrixIndexBuffer: modelViewMatrixIndexBuffer
        }

        this.gl.useProgram(program);
        // needs to be called everytime the meshes change
        this.writeObjectsToVertexBuffer();

        this.gl.bindTexture(this.gl.TEXTURE_2D, modelViewMatricesTexture);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.uniform1i(this.renderingData!.shaderUniforms.modelViewMatricesTexture, 0);
        this.gl.uniformMatrix4fv(this.renderingData!.shaderUniforms.projectionMat, false, this.renderingData!.projectionMat);
        this.updateModelViewMatrices();
        this.loopOnAnimationFrame();
    }

    /**
     * initializes the shader program
     */
    createShaderProgram(): WebGLProgram {
        const program = this.gl.createProgram()!;
        const vertex = this.compileShader(this.gl.VERTEX_SHADER, vertexShader);
        if (!this.gl.getShaderParameter(vertex, this.gl.COMPILE_STATUS)) {
            console.error(this.gl.getShaderInfoLog(vertex));
        }
        const fragment = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentShader);
        if (!this.gl.getShaderParameter(fragment, this.gl.COMPILE_STATUS)) {
            console.error(this.gl.getShaderInfoLog(fragment));
        }

        this.gl.attachShader(program, vertex);
        this.gl.attachShader(program, fragment);
        this.gl.linkProgram(program);

        return program;
    }


    /** 
     * utility to compile a shader from its code as a string
     */
    compileShader(type: GLenum, code: string): WebGLShader {
        const shader = this.gl.createShader(type)!;
        this.gl.shaderSource(shader, code);
        this.gl.compileShader(shader);

        return shader;
    }

    renderFrame() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT) // clears buffers selected by a mask to a preset value

        // bare bones test for rotation with quaternions
        this.objects.forEach((obj, i) => {
            // obj.rotation = quatMul(obj.rotation, axisAngleToQuat([randInt(-1, 1), randInt(-1, 1), randInt(-1, 1), toRad(1)]));
            // if (i % 5 == 0)
            //     obj.rotation = quatMul(obj.rotation, axisAngleToQuat([1, 0, 0, toRad(1)]));
            // const dir = quatToAxisAngle(obj.rotation);

            // vec3.add(obj.position, obj.position, vec3.scale(vec3.create(), vec3.fromValues(dir[0], dir[1], dir[2]), obj.speed));
            obj.position[2] += obj.speed * 10;

            if (obj.position[2] > 20)
                obj.position[2] -= 220;
        });

        this.updateModelViewMatrices();

        // draw call
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.renderingData!.indexBuffer);
        this.gl.drawElements(this.gl.TRIANGLES, this.renderingData!.vertexIndices, this.gl.UNSIGNED_INT, 0);
    }

    updateModelViewMatrices() {
        const matricesBuffer: number[] = [];

        this.objects.forEach(obj => {
            const modelViewMat = mat4.create();

            const translationMat = mat4.fromValues(
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                obj.position[0], obj.position[1], obj.position[2], 1,
            );
            const scaleMat = mat4.fromValues(
                obj.scale[0], 0, 0, 0,
                0, obj.scale[1], 0, 0,
                0, 0, obj.scale[2], 0,
                0, 0, 0, 1,
            );

            const rotationMat = quaternionToRotationMatrix(obj.rotation);

            mat4.mul(modelViewMat, modelViewMat, translationMat);
            mat4.mul(modelViewMat, modelViewMat, rotationMat);
            mat4.mul(modelViewMat, modelViewMat, scaleMat);

            matricesBuffer.push(...modelViewMat);
        });


        this.gl.bindTexture(this.gl.TEXTURE_2D, this.renderingData!.shaderTextures.modelViewMatricesTexture);
        const width = 4096;
        const height = matricesBuffer.length / (width * 4);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA32F, width, height, 0, this.gl.RGBA, this.gl.FLOAT, new Float32Array(matricesBuffer));
    }

    writeObjectsToVertexBuffer() {
        const positions: number[] = [];
        const colours: number[] = [];
        const indices: number[] = [];
        const modelViewMatrixIndices: number[] = [];

        let triangleIndexOffset = 0;

        // translates each object into an array of vertex positions and colours
        this.objects.forEach((obj, objectIndex) => {
            const vertexes: number[] = [];

            obj.vertices.forEach(data => {
                const vert = data.vertex;
                vertexes.push(...vec4.fromValues(vert[0], vert[1], vert[2], 1));
                modelViewMatrixIndices.push(objectIndex);
                colours.push(...data.colour);
            });
            obj.triangles.forEach(tri => {
                tri.vertexIndexes.forEach(vertexIndex => {
                    indices.push(vertexIndex + triangleIndexOffset);
                });
            });

            positions.push(...vertexes);
            triangleIndexOffset += obj.vertices.length;
        })

        this.renderingData!.vertexIndices = indices.length;

        // updates the buffers and uniforms
        this.writePositionBuffer(positions);
        this.writeColourBuffer(colours);
        this.writeIndexBuffer(indices);
        this.writeModelViewMatrixIndexBuffer(modelViewMatrixIndices);
    }

    /**
     * writes a list of vertex positions that will be read by the vertexPosition attribute of the
     * vertex shader
     */
    writePositionBuffer(positions: number[]) {
        const positionBuffer = this.renderingData!.positionBuffer;
        const vertexPositionAttr = this.renderingData!.shaderAttrs.vertexPositionAttr;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(vertexPositionAttr, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vertexPositionAttr);
    }

    /**
     * writes a list of vertex colours that will be read by the vertexColour attribute of the
     * vertex shader
     */
    writeColourBuffer(colours: number[]) {
        const colourBuffer = this.renderingData!.colourBuffer;
        const vertexColourAttr = this.renderingData!.shaderAttrs.vertexColourAttr;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colourBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colours), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(vertexColourAttr, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vertexColourAttr);
    }

    /**
     * writes a list of vertex colours that will be read by the vertexColour attribute of the
     * vertex shader
     */
    writeNormalBuffer(normals: number[]) {
        const normalBuffer = this.renderingData!.normalBuffer;
        const vertexNormalAttr = this.renderingData!.shaderAttrs.vertexNormalAttr;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(normals), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(vertexNormalAttr, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vertexNormalAttr);
    }

    /**
     * writes a list of vertex indices that will be read by the vertexColour attribute of the
     * vertex shader
     */
    writeIndexBuffer(indices: number[]) {
        const indexBuffer = this.renderingData!.indexBuffer;

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), this.gl.STATIC_DRAW);
    }

    /**
     * writes a list of vertex colours that will be read by the vertexColour attribute of the
     * vertex shader
     */
    writeModelViewMatrixIndexBuffer(modelViewMatrixIndices: number[]) {

        const modelViewMatrixIndexBuffer = this.renderingData!.modelViewMatrixIndexBuffer;
        const modelViewMatrixIndexAttr = this.renderingData!.shaderAttrs.modelViewMatrixIndexAttr;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, modelViewMatrixIndexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(modelViewMatrixIndices), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(modelViewMatrixIndexAttr, 1, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(modelViewMatrixIndexAttr);
    }

    /**
     * adds a call to the renderframe function of this renderer to the animation frame
     */
    loopOnAnimationFrame() {
        this.window.requestAnimationFrame(() => {
            this.renderFrame();
            this.loopOnAnimationFrame();
        });
    }

    /**
     * calculates a projection matrix
     * @param fov the Field Of View, in degrees
     * @param near the near cutting plane
     * @param far the far cutting plane
     * @returns the world-to-camera view projection matrix
     */
    createProjectionMatrix(fov: number, near: number, far: number) {
        const aspectRatio = this.window.innerWidth / this.window.innerHeight;

        const t = Math.tan(toRad(fov) / 2) * near;
        const b = -t;
        const r = aspectRatio * t;
        const l = -r;

        return mat4.fromValues(
            (2 * near) / (r - l), 0.0, 0, 0.0,
            0.0, (2 * near) / (t - b), 0, 0.0,
            (r + l) / (r - l), (t + b) / (t - b), -(far + near) / (far - near), -1,
            0.0, 0.0, -(2 * far * near) / (far - near), 0
        );
    }
}