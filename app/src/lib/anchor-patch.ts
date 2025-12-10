// This MUST be imported before any Anchor code
import BN from "bn.js";

// Ensure toArrayLike exists
if (!BN.prototype.toArrayLike) {
  BN.prototype.toArrayLike = function(ArrayType: typeof Buffer | typeof Array, endian?: 'le' | 'be', length?: number): Buffer | number[] {
    const byteLength = length || Math.max(1, this.byteLength());
    const res = this.toArray(endian, byteLength);
    
    if (ArrayType === Buffer) {
      return Buffer.from(res);
    }
    return res;
  };
}

export { BN };
