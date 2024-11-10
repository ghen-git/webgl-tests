import { mat4, quat, vec3, vec4 } from "gl-matrix";

/**
 * translates a rotation expressed in the axis angle format to
 * a quaternion
 */
export function axisAngleToQuat(axisAngle: vec4) {
    return quat.fromValues(
        axisAngle[0] * Math.sin(axisAngle[3] / 2),
        axisAngle[1] * Math.sin(axisAngle[3] / 2),
        axisAngle[2] * Math.sin(axisAngle[3] / 2),
        Math.cos(axisAngle[3] / 2)
    )
}

/**
 * converts degrees to radians
 */
export function toRad(degs: number) {
    return (degs / 180) * Math.PI;
}

/**
 * multiplies two quaternions
 */
export function quatMul(p: quat, q: quat): quat {
    return quat.fromValues(
        p[3] * q[0] + p[0] * q[3] + p[1] * q[2] - p[2] * q[1],
        p[3] * q[1] + p[1] * q[3] - p[0] * q[2] + p[2] * q[0],
        p[3] * q[2] + p[0] * q[1] - p[1] * q[0] + p[2] * q[3],
        p[3] * q[3] - p[0] * q[0] - p[1] * q[1] - p[2] * q[2],
    );
}

/**
 * applies a rotation in quaternion format (q) to a vector
 */
export function applyQuatToVec3(q: quat, v: vec3) {
    const conj = quat.conjugate(quat.create(), q);
    return quatMul(quatMul(q, [v[0], v[1], v[2], 0]), conj);
}

/**
 * converts colour values from 0-255 to 0-1
 */
export function rgbToScreenSpace(r: number, g: number, b: number): vec4 {
    return [
        r / 255, g / 255, b / 255, 1
    ];
}

export function quaternionToRotationMatrix(q: quat) {
    const out = mat4.create();

    const [x, y, z, w] = q;

    const xx = x * x, yy = y * y, zz = z * z;
    const xy = x * y, xz = x * z, yz = y * z;
    const wx = w * x, wy = w * y, wz = w * z;

    out[0] = 1 - 2 * (yy + zz);
    out[1] = 2 * (xy + wz);
    out[2] = 2 * (xz - wy);
    out[3] = 0;

    out[4] = 2 * (xy - wz);
    out[5] = 1 - 2 * (xx + zz);
    out[6] = 2 * (yz + wx);
    out[7] = 0;

    out[8] = 2 * (xz + wy);
    out[9] = 2 * (yz - wx);
    out[10] = 1 - 2 * (xx + yy);
    out[11] = 0;

    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;

    return out;
}