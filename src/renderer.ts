import 'gl-matrix';
import { mat4, quat, vec3, vec4 } from 'gl-matrix';

export function init(canvas: HTMLCanvasElement, window: Window) {
    const gl = canvas.getContext('webgl2');

    if (gl == null) {
        console.error('unable to initialize WebGL');
        return;
    }

    const renderer = new Renderer(gl, canvas, window);

    renderer.start();
}

const vertexShader2d = `
    attribute vec4 aVertexPosition;
    uniform mat4 uProjectionMatrix;
    attribute vec4 aVertexColor;

    varying lowp vec4 vColor;
    
    void main() {
      // opengl takes uniform coordinates for position
      gl_Position = uProjectionMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
`;

const whiteTrianglesFragment = `
    varying lowp vec4 vColor;
    void main() {
      // gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      gl_FragColor = vColor;
    }
`;

interface Object {
    triangles: Triangle[]
    position: vec3
    rotation: vec4
}
type Triangle = {
    vertexes: vec3[],
    color: vec4
}

export class Renderer {
    private gl: WebGL2RenderingContext;
    private canvas: HTMLCanvasElement;
    private window: Window;
    private renderingData?: {[id: string]: any};
    private objects: Object[];

    constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, window: Window) {
        this.gl = gl;
        this.canvas = canvas;
        this.window = window;
        this.objects = [];
    }

    start() {
        this.gl.clearColor(0, 0, 0, 1); // sets the value for the color buffer bit
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.renderingData = {};

        const program = this.createShaderProgram();
        const vertexPositionAttr = this.gl.getAttribLocation(program, "aVertexPosition");
        const vertexColorAttr = this.gl.getAttribLocation(program, "aVertexColor");
        const projectionMatUniform = this.gl.getUniformLocation(program, "uProjectionMatrix");

        this.objects.push({
            triangles: [
                {vertexes: [[-.5, 0, -.5], [-.5, 0, .5], [.5, 0, .5]], color: [1, 0, 0, 1]},
                {vertexes: [[.5, 0, .5], [.5, 0, -.5], [-.5, 0, -.5]], color: [1, 0, 0, 1]}, // bottom
                {vertexes: [ [-.5, 0, .5], [-.5, 1, .5], [-.5, 0, -.5]], color: [0.7, 0.7, 0.5, 1]},
                {vertexes: [ [-.5, 1, .5], [-.5, 1, -.5], [-.5, 0, -.5]], color: [0.7, 0.7, 0.5, 1]}, // left
                {vertexes: [ [.5, 0, .5], [.5, 1, .5], [.5, 0, -.5]], color: [0.7, 0.5, 0.7, 1]},
                {vertexes: [ [.5, 1, .5], [.5, 1, -.5], [.5, 0, -.5]], color: [0.7, 0.5, 0.7, 1]}, // right
                {vertexes: [[-.5, 1, -.5], [-.5, 1, .5], [.5, 1, .5]], color: [0.7, 0.7, 0.7, 1]},
                {vertexes: [[.5, 1, .5], [.5, 1, -.5], [-.5, 1, -.5]], color: [0.7, 0.7, 0.7, 1]}, // top
            ],
            position: vec3.fromValues(0, -.5, -4),
            rotation: vec4.fromValues(0, 1, 0, 0)
        });
        
        const positionBuffer = this.gl.createBuffer();
        const colorBuffer = this.gl.createBuffer();

        const fov = 70;
        const aspectRatio = this.window.innerWidth / this.window.innerHeight;
        const near = 0.01, far = 10000;
        
        const t = Math.tan((fov/180) * Math.PI / 2) * near;
        const b = -t;
        const r = aspectRatio * t;
        const l = -r;

        const projection3D = mat4.fromValues(
            (2 * near) / (r - l), 0.0                 , 0                             , 0.0, 
            0.0                 , (2 * near) / (t - b), 0                             , 0.0, 
            (r + l)  / (r - l)  , (t + b) / (t - b)   , -(far + near)/(far - near)    , -1, 
            0.0                 , 0.0                 , -(2 * far * near)/(far - near), 0   
        );
        
        this.renderingData = {
            program: program,
            projectionMat: projection3D,
            shaderAttrs: {
                vertexPosition: vertexPositionAttr,
                vertexColorAttr: vertexColorAttr
            },
            shaderUniforms: {
                projectionMat: projectionMatUniform
            },
            positionBuffer: positionBuffer,
            colorBuffer: colorBuffer
        }

        this.gl.useProgram(program);
        this.loopOnAnimationFrame();
    }

    createShaderProgram(): WebGLProgram {
        const program = this.gl.createProgram()!;
        const vertex = this.compileShader(this.gl.VERTEX_SHADER, vertexShader2d);
        const fragment = this.compileShader(this.gl.FRAGMENT_SHADER, whiteTrianglesFragment);

        this.gl.attachShader(program, vertex);
        this.gl.attachShader(program, fragment);
        this.gl.linkProgram(program);

        return program;
    }

    compileShader(type: GLenum, code: string): WebGLShader {
        const shader = this.gl.createShader(type)!;
        this.gl.shaderSource(shader, code);
        this.gl.compileShader(shader);

        return shader;
    }

    renderFrame() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT) // clears buffers selected by a mask to a preset value

        const vertexPositionAttr = this.renderingData!.shaderAttrs.vertexPositionAttr;
        const vertexColorAttr = this.renderingData!.shaderAttrs.vertexColorAttr;
        const positions: number[] = [];
        const colors: number[] = [];
        const program = this.renderingData!.progarm;

        this.objects[0].rotation[3] += 0.01
        
        this.objects.forEach(obj => {
            const vertexes: number[] = [];

            const translationMat = mat4.fromValues(
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                obj.position[0], obj.position[1], obj.position[2], 1,
            );

            const q = this.axisAngleToQuat(obj.rotation);

            const rotationMat = mat4.fromValues(
                2*(q[0]*q[0]+q[1]*q[1])-1, 2*(q[1]*q[2]-q[0]*q[3]), 2*(q[1]*q[3]+q[0]*q[2]), 0,
                2*(q[1]*q[2]+q[0]*q[3]), 2*(q[0]*q[0]+q[2]*q[2])-1, 2*(q[2]*q[3]-q[0]*q[1]), 0,
                2*(q[1]*q[3]-q[0]*q[2]), 2*(q[2]*q[3]+q[0]*q[1]), 2*(q[0]*q[0]+q[3]*q[3])-1, 0,
                0, 0, 0, 1
            );

            obj.triangles.forEach(tri => tri.vertexes.forEach(vert => {
                const vert4 = vec4.fromValues(vert[0], vert[1], vert[2], 1)
                const transform = vec4.create();
                vec4.transformMat4(transform, vert4, rotationMat);
                vec4.transformMat4(transform, transform, translationMat);
                vertexes.push(...transform);
                colors.push(...tri.color);
            }));

            positions.push(...vertexes);
        })

        const positionBuffer = this.renderingData!.positionBuffer;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(
            vertexPositionAttr,
            4,
            this.gl.FLOAT,
            false,
            0,
            0
        );
        this.gl.enableVertexAttribArray(vertexPositionAttr);

        const colorBuffer = this.renderingData!.colorBuffer;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(
            vertexColorAttr,
            4,
            this.gl.FLOAT,
            false,
            0,
            0
        );
        this.gl.enableVertexAttribArray(vertexColorAttr);
        
        this.gl.uniformMatrix4fv(this.renderingData!.shaderUniforms.projectionMat, false, this.renderingData!.projectionMat);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, positions.length / 4);
    }

    loopOnAnimationFrame() {
        this.window.requestAnimationFrame(() => {
            this.renderFrame();
            this.loopOnAnimationFrame();
        });
    }

    axisAngleToQuat(axisAngle: vec4) {
        return quat.fromValues(
            Math.cos(axisAngle[3] / 2),
            axisAngle[0] * Math.sin(axisAngle[3] / 2),
            axisAngle[1] * Math.sin(axisAngle[3] / 2),
            axisAngle[2] * Math.sin(axisAngle[3] / 2),
        )
    }
}