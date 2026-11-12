import { notFound } from "next/navigation";
import { SyncTool } from "./SyncTool";

// The lyric timing tool only exists on your machine (npm run dev), never on the live site.
export default function SyncPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <SyncTool />;
}
