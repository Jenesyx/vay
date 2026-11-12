import { SmoothScroll } from "@/components/SmoothScroll";
import { Loader } from "@/components/Loader";
import { Tv } from "@/components/Tv";
import { Rain } from "@/components/Rain";
import { Hero } from "@/components/Hero";
import { Lyrics } from "@/components/Lyrics";
import { Album } from "@/components/Album";
import { Invite } from "@/components/Invite";
import { End } from "@/components/End";
import { VcrOsd } from "@/components/VcrOsd";
import { LyricFollow } from "@/components/LyricFollow";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Rain />
      <Tv />
      <main>
        <Hero />
        <Lyrics />
        <Album />
        <Invite />
        <End />
      </main>
      <VcrOsd />
      <LyricFollow />
      <Loader />
    </>
  );
}
