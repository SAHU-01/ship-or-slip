// Polyfill for BN.toArrayLike which is missing in browser
import { BN } from "@coral-xyz/anchor";

if (typeof BN.prototype.toArrayLike !== "function") {
  BN.prototype.toArrayLike = function(ArrayType: any, endian?: string, length?: number) {
    const bytes = this.toArray(endian, length);
    if (ArrayType === Buffer) {
      return Buffer.from(bytes);
    }
    return new ArrayType(bytes);
  };
}

export { BN };
