"use client";

import { useEffect } from "react";

export function BNPolyfill() {
  useEffect(() => {
    // Patch BN after hydration
    import("@coral-xyz/anchor").then(({ BN }) => {
      if (typeof BN.prototype.toArrayLike !== "function") {
        (BN.prototype as any).toArrayLike = function(ArrayType: any, endian?: string, length?: number) {
          const bytes = this.toArray(endian, length);
          if (ArrayType === Buffer) {
            return Buffer.from(bytes);
          }
          return bytes;
        };
      }
    });
  }, []);
  
  return null;
}
