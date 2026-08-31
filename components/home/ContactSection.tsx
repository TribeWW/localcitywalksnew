import React from "react";
import ContactForm from "@/components/forms/ContactForm";
import { ContactInfo } from "@/components/contact/ContactInfo";

const ContactSection: React.FC = () => {
  return (
    <section id="contact" className="w-full bg-pearl-gray px-6 py-16">
      <div className="mx-auto max-w-[1140px]">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-[32px] font-bold leading-[1.3] text-nightsky">
            Get in touch
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            We usually reply within one business day. For booking-specific
            questions, please include your booking reference if you have one.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12">
          <ContactForm showHeading />

          <aside>
            <ContactInfo />
          </aside>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
