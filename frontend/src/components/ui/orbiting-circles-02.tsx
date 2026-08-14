"use client";
import React from "react";
import ParticleSphereAnimation from "@/components/ui/orbiting-circles-02-utils/particalsphear";

export default function OrbitingCirclesGlobeDemo() {
  return (
    <div className="relative w-full h-[44rem] md:h-[60rem] xl:h-[75rem] 2xl:h-[90rem] overflow-hidden flex justify-center">
      {/* Center particle globe */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 pointer-events-none w-[36rem] h-[36rem] md:w-[50rem] md:h-[50rem] xl:w-[60rem] xl:h-[60rem] 2xl:w-[70rem] 2xl:h-[70rem] z-10">
        <ParticleSphereAnimation />
      </div>
    </div>
  );
}
