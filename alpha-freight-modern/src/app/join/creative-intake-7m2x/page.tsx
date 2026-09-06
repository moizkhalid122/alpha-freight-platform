import EditorIntakePageContent from "@/components/editor-intake/EditorIntakePageContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Editor details | Alpha Freight",
  description: "Private editor intake form.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function EditorIntakePage() {
  return <EditorIntakePageContent />;
}
