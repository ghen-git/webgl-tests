# WebGL Tests
A bare-bones custom 3D renderer I built to learn how to create 3D graphics from scratch. It uses **WebGL** and `gl-matrix` (a popular library to represent vectors in javascript).

As of right now, it can render an arbitrary number of triangle meshes, specifying **position**, **rotation** and **scale** for each individual mesh.

Below is a demo with 10,000 meshes, each mesh's model matrix (the matrix that specifies the rotation, position and scale of the mesh) is updated every frame.
![](readme_images/crammed.gif)
<span style="color:gray">(gif may take a while to load)</span>

### Current Features
The project contains:
- a full **minimal rendering pipeline**: basic meshes, a vertex and fragment shader and code to send instructions and the required data to the GPU at every frame.
- a module with some mathematical operations that are used for 3D rendering (building a **projection matrix**, **multiplying quaternions**, going from an **axis angle rotation to a quaternion** and from a **quaternion to a rotation matrix**). I wrote the functions myself to understand how they work.
- a way to send multiple model matrices in a single draw call, explained further below

### Multiple Model Matrices in a single Draw Call
This renderer can render different meshes with separate positions and rotations on a single **draw call**.
This is done by encoding the model matrix in a **texture** to bypass the size limit on uniform arrays and to not have to repeat it for every vertex by sending it as a VBO. The only thing that needs to be sent through a VBO is the model index.

this is the code which writes the texture to the GPU
```ts
this.gl.bindTexture(this.gl.TEXTURE_2D, this.renderingData!.shaderTextures.modelViewMatricesTexture);
const width = 4;
const height = matricesBuffer.length / (width * 4);
this.gl.texImage2D(
    this.gl.TEXTURE_2D, 
    0, 
    this.gl.RGBA32F, 
    width, 
    height,
    0, 
    this.gl.RGBA,
    this.gl.FLOAT, 
    new Float32Array(matricesBuffer)
);
```

and this is the shader code that decodes the texture into a matrix in the vertex shader.
```glsl
vec4 getValueByIndexFromTexture(sampler2D tex, int index) {
  int texWidth = textureSize(tex, 0).x;
  int col = index % texWidth;
  int row = index / texWidth;
  return texelFetch(tex, ivec2(col, row), 0);
}
```

### Installation
Requirements: **npm** and **Node.js**, or compatible alternatives.

After downloading the project, open a terminal in the project root folder and run
```shell
npm i
```
to install the required dependencies (`gl-matrix` to represent vectors and `vite` to compile Typescript code runtime and test on the browser).

To start the project run
```shell
npm run dev
```
and open the link to the local web page you see in the terminal

---

Here's an additional demo, with the cubes spread further apart.
![](readme_images/wide.gif)
<span style="color:gray">(gif may take a while to load)</span>