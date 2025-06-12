import React from "react";

const AboutUs = () => {
  return (
    <section id="about" className="w-full py-16 sm:py-24 px-4 sm:px-6 bg-white">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Main heading */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            About <span className="text-tangerine">LocalCityWalks</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Travel deserves to be more personal, more meaningful, and more
            connected to the places we visit.
          </p>
        </div>

        {/* Main content */}
        <div className="grid gap-8 sm:gap-12">
          {/* Our Focus */}
          <div className="space-y-4">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Our Focus
            </h3>
            <p className="text-gray-600 leading-relaxed">
              We focus on cities that don&apos;t always make the top of the
              list. Not the capitals or postcard hotspots, but the smaller,
              lesser-known places full of local charm that hold real
              character—quiet squares, layered histories, and stories worth
              sharing. These are the places where walking still makes sense,
              where you can feel the rhythm of a place in just a few steps.
            </p>
          </div>

          {/* Our Approach */}
          <div className="space-y-4">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Our Approach
            </h3>
            <p className="text-gray-600 leading-relaxed">
              All LocalCityWalks are led by trusted local guides. No big groups.
              No buses. No umbrellas to follow. Just small, personal tours—more
              like spending time with a local friend than joining a tour group.
            </p>
          </div>

          {/* Our Beliefs */}
          <div className="space-y-6">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Our Beliefs
            </h3>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg bg-gray-50 space-y-2">
                <h4 className="font-semibold text-gray-900">
                  Leave nothing but footsteps
                </h4>
                <p className="text-gray-600">
                  We believe in sustainable, respectful tourism that preserves
                  the essence of each place.
                </p>
              </div>
              <div className="p-6 rounded-lg bg-gray-50 space-y-2">
                <h4 className="font-semibold text-gray-900">
                  Small groups are more human
                </h4>
                <p className="text-gray-600">
                  Intimate experiences that foster real connections and
                  meaningful interactions.
                </p>
              </div>
              <div className="p-6 rounded-lg bg-gray-50 space-y-2">
                <h4 className="font-semibold text-gray-900">
                  Local guides know best
                </h4>
                <p className="text-gray-600">
                  Authentic insights and stories from those who truly know their
                  city.
                </p>
              </div>
              <div className="p-6 rounded-lg bg-gray-50 space-y-2">
                <h4 className="font-semibold text-gray-900">
                  Every city has its story
                </h4>
                <p className="text-gray-600">
                  Discovering should be fun and engaging, filled with stories
                  and anecdotes.
                </p>
              </div>
            </div>
          </div>

          {/* Connection */}
          <div className="text-center space-y-4">
            <p className="text-lg sm:text-xl text-gray-600 italic">
              We believe in human connection and exchange, human touch—it&apos;s
              not one-way, it&apos;s a dialogue. This is what makes every tour
              unique and personal.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
