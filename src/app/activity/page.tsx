import type { Metadata } from "next";
import { Step2Activity } from "../components/step2-activity";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default function ActivityPage() {
  return <Step2Activity />;
}
