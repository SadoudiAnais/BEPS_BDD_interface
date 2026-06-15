import { type RouteConfig, index, route } from "@react-router/dev/routes";
export default [
  index("routes/home.tsx"),
  route("browse", "routes/browse.tsx"),
  route("sequence/:id", "routes/sequence.tsx"),
  route("api/pdb/:id", "routes/api.pdb.ts"),
  route("About", "routes/About.tsx"),
] satisfies RouteConfig;