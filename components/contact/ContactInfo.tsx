import { Clock, MapPin, Phone } from "lucide-react";

interface ContactDetailProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function ContactDetail({ icon, label, value }: ContactDetailProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex-shrink-0 text-nightsky">{icon}</span>
      <div>
        <p className="m-0 text-sm font-medium text-nightsky">{label}</p>
        <p className="m-0 text-sm text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}

/**
 * Shared contact details block (phone, hours, office).
 */
export function ContactInfo() {
  return (
    <div className="px-2 md:px-4">
      <h2 className="mb-4 text-xl font-semibold leading-snug text-nightsky">
        Contact info
      </h2>
      <div className="flex flex-col gap-3">
        <ContactDetail
          icon={<Phone size={16} />}
          label="Phone"
          value={
            <a
              href="tel:+34871242085"
              className="text-sm text-muted-foreground transition-colors duration-150 hover:text-nightsky"
            >
              +34 871 242 085
            </a>
          }
        />
        <ContactDetail
          icon={<Clock size={16} />}
          label="Business hours"
          value="Mon–Sun, 9:00 AM – 6:00 PM (CET)"
        />
        <ContactDetail
          icon={<MapPin size={16} />}
          label="Office"
          value="Mallorca, Spain"
        />
      </div>
    </div>
  );
}
