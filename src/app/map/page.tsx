import type { Metadata } from "next";
import { Step3Map } from "../components/step3-map";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default function MapPage() {
  return <Step3Map />;
}
