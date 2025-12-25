import type { Spot } from "./LeafletMap";

export const DUMMY_SPOTS: Spot[] = [
  {
    id: "d1",
    lat: 55.6761,
    lng: 12.5683,
    title: "Ramsløg ved søen",
    species_slug: "ramsloeg",
  },
  {
    id: "d2",
    lat: 55.6825,
    lng: 12.5612,
    title: "Kantarel i skovbryn",
    species_slug: "kantarel",
  },
  {
    id: "d3",
    lat: 55.6718,
    lng: 12.5834,
    title: "Hyldeblomst",
    species_slug: "hyld",
  },
  {
    id: "d4",
    lat: 55.6642,
    lng: 12.5721,
    title: "Brændenælde",
    species_slug: "naelde",
  },
  {
    id: "d5",
    lat: 55.6891,
    lng: 12.5527,
    title: "Skovsyre",
    species_slug: "skovsyre",
  },

  // lidt udenfor KBH så clusters kan ses
  {
    id: "d6",
    lat: 55.7308,
    lng: 12.3916,
    title: "Kantarel (vest)",
    species_slug: "kantarel",
  },
  {
    id: "d7",
    lat: 55.6179,
    lng: 12.3496,
    title: "Ramsløg (syd)",
    species_slug: "ramsloeg",
  },
];
