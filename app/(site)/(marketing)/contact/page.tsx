import ContactForm from "@/components/forms/ContactForm";
import { ContactInfo } from "@/components/contact/ContactInfo";
import { CustomTourPromoCard } from "@/components/contact/CustomTourPromoCard";
import { buildContactPageMetadata } from "@/lib/contact/page-metadata";

export const metadata = buildContactPageMetadata();

export default function ContactPage() {
  return (
    <main className="bg-white">
      <div className="mx-auto max-w-[1140px] px-4 pb-20 pt-12 md:px-8">
        <div className="mb-10 max-w-2xl">
          <h1 className="mb-3 text-2xl font-bold leading-tight text-nightsky md:text-4xl">
            Get in touch
          </h1>
          <p className="m-0 text-lg text-muted-foreground">
            We usually reply within one business day. For booking-specific
            questions, please include your booking reference if you have one.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12">
          <ContactForm showHeading />

          <aside className="flex flex-col gap-10">
            <CustomTourPromoCard />
            <ContactInfo />
          </aside>
        </div>
      </div>
    </main>
  );
}
