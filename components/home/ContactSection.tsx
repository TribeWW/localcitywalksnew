import React from "react";
import ContactForm from "@/components/forms/ContactForm";
import { Phone, MapPin, Clock } from "lucide-react";

const ContactSection: React.FC = () => {
  return (
    <section id="contact" className="py-16 px-4 bg-pearl-gray">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-nightsky mb-4">
            Get in Touch
          </h2>
          <p className="text-lg text-nightsky/70 max-w-2xl mx-auto">
            We typically respond within 24 hours. For urgent inquiries, please
            call us directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <ContactForm />
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-tangerine/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-tangerine" />
                </div>
                <div>
                  <h3 className="font-semibold text-nightsky mb-1">Phone</h3>
                  <a href="tel:+34 871 242 085" className="text-nightsky/70">
                    +34 871 242 085
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-tangerine/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-tangerine" />
                </div>
                <div>
                  <h3 className="font-semibold text-nightsky mb-1">Office</h3>
                  <p className="text-nightsky/70">Mallorca, Spain</p>
                  <p className="text-sm text-nightsky/50"></p>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-tangerine/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-tangerine" />
              </div>
              <div>
                <h3 className="font-semibold text-nightsky mb-1">
                  Business Hours
                </h3>
                <div className="space-y-1 text-sm text-nightsky/70">
                  <p>
                    Monday - Sunday:
                    <br /> 9:00 AM - 6:00 PM (CET)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
