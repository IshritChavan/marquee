import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

/** Consistent frame for every profile section: width, vertical rhythm, title, scroll-reveal. */
export function ProfileSection({
  id,
  title,
  description,
  aside,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24">
      <Reveal>
        <SectionHeader headingId={`${id}-heading`} title={title} description={description} aside={aside} />
      </Reveal>
      <Reveal delay={0.05}>{children}</Reveal>
    </section>
  );
}
