declare module "supercluster" {
  export type Feature<P = any> = {
    type: "Feature";
    properties: P;
    geometry: { type: "Point"; coordinates: [number, number] };
  };

  export type Options = {
    radius?: number;
    maxZoom?: number;
    minZoom?: number;
    extent?: number;
    nodeSize?: number;
    log?: boolean;
  };

  export default class Supercluster<P = any> {
    constructor(options?: Options);
    load(points: Feature<P>[]): this;
    getClusters(
      bbox: [number, number, number, number],
      zoom: number
    ): Array<any>;
    getClusterExpansionZoom(clusterId: number): number;
  }
}
