"use client"

import * as React from "react"
import { Lightbox as AstryxLightbox } from "@astryxdesign/core/Lightbox"
export { useLightbox } from "@astryxdesign/core/Lightbox"

// modal lightbox zoom media
function Lightbox({
  open,
  close,
  slides,
  index = 0,
  hasZoom = false,
  onIndexChange,
  ...props
}) {
  const formattedMedia = slides?.map(slide => ({
    src: slide.src,
    alt: slide.alt || "",
    caption: slide.title || slide.alt || "",
    type: slide.type === "video" ? "video" : "image"
  }))

  const handleOpenChange = (isOpen) => {
    if (!isOpen && close) {
      close()
    }
  }

  return (
    <AstryxLightbox
      isOpen={open}
      onOpenChange={handleOpenChange}
      media={formattedMedia || []}
      index={index}
      onIndexChange={onIndexChange}
      hasZoom={hasZoom}
      {...props}
    />
  )
}

export { Lightbox }
export default Lightbox
