const COVERS = [
  require('../../../assets/dive1.jpg.webp') as ReturnType<typeof require>,
  require('../../../assets/dive2.jpg.webp') as ReturnType<typeof require>,
];

function slugHash(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getCultureCover(slug: string): ReturnType<typeof require> {
  return COVERS[slugHash(slug) % COVERS.length];
}
