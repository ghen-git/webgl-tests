# WebGL Tests
A bare-bones custom 3D renderer, built to learn how to create 3D graphics from scratch. It uses **WebGL** and `gl-matrix` (a popular library to represent vectors in javascript).

As of right now, it can render an arbitrary number of triangle meshes, specifying **position**, **rotation** and **scale** for each individual mesh.


<image src="readme_images/crammed.gif"/>

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