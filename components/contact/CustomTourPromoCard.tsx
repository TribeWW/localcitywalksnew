import Image from "next/image";

/**
 * Promo card encouraging custom tour inquiries on the contact page.
 */
export function CustomTourPromoCard() {
  return (
    <div className="rounded-2xl border-[1.5px] border-border bg-pearl-gray p-6 md:p-8">
      <div className="mb-6 flex justify-center">
        <Image
          src="/operator.svg"
          alt="LocalCityWalks guide giving a thumbs up"
          width={160}
          height={162}
          className="h-auto w-40"
        />
      </div>
      <h2 className="mb-3 text-xl font-semibold leading-snug text-nightsky">
        Looking for a customized experience?
      </h2>
      <p className="m-0 text-base leading-relaxed text-muted-foreground">
        We organise tailor-made walking experiences for private groups,
        families, and corporate events. Just contact us here and we&apos;ll take
        it from there.
      </p>
    </div>
  );
}
