import type { LoaderFunctionArgs } from "react-router";

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  if (!id) {
    return new Response("Missing sequence ID", { status: 400 });
  }

  try {
    const res = await fetch(`https://api.paulverot.fr/sequences/${id}/pdb`);
    if (!res.ok) {
      return new Response(`Error fetching PDB from API: ${res.statusText}`, {
        status: res.status,
      });
    }

    const pdbText = await res.text();

    return new Response(pdbText, {
      headers: {
        "Content-Type": "chemical/x-pdb",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("PDB CORS Proxy Error:", error);
    return new Response(`Internal Server Error: ${error.message || error}`, {
      status: 500,
    });
  }
}
