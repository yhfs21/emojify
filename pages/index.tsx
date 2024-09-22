import Image from "next/image";
import { Inter } from "next/font/google";
import TextToImage from "@/components/specific/TextToImage";
import Footer from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <main
      className={`flex min-h-screen flex-col items-center py-24 ${inter.className}`}
    >
      emojify
      <TextToImage />
      <Footer />
    </main>
  );
}
