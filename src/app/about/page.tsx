import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "About Us | PokéDex",
  description:
    "Learn more about PokéDex and our mission to bring you the best Pokémon information",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-yellow-200">
      {/* Hero Section */}
      <section className="bg-gray-800 text-white py-16 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
                Explore Stories
              </h1>
              <p className="text-lg sm:text-xl text-gray-300 mb-6">
                Discover the fascinating world of Pokémon through our
                comprehensive PokéDex. We bring you detailed information about
                every Pokémon, their abilities, types, and more.
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-yellow-400 text-gray-800 font-semibold rounded-lg hover:bg-yellow-300 transition-colors"
              >
                Explore PokéDex
              </Link>
            </div>
            <div className="relative w-full h-64 sm:h-80 md:h-96">
              <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center shadow-2xl">
                <div className="text-8xl sm:text-9xl">⚡</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 sm:px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-12">
            Our Team
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Team Member 1 */}
            <div className="text-center">
              <div className="w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden shadow-lg relative">
                <Image
                  src="/gm.jpg"
                  alt="Team member 1"
                  width={192}
                  height={192}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Ghanshyam
              </h3>
              <p className="text-gray-600">Software Developer</p>
            </div>

            {/* Team Member 2 */}
            <div className="text-center">
              <div className="w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden shadow-lg relative">
                <Image
                  src="/mon1.jpg"
                  alt="Team member 2"
                  width={192}
                  height={192}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Monika</h3>
              <p className="text-gray-600">UI/UX Designer</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="py-16 px-4 sm:px-6 bg-gradient-to-br from-orange-100 to-yellow-200">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-4">
            Our Mission
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Learn more about what drives us and how we&apos;re building the ultimate
            Pokémon resource
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Mission Card 1 */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 mb-4 flex items-center justify-center">
                <Image
                  src="/file.svg"
                  alt="Comprehensive Data"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Comprehensive Data
              </h3>
              <p className="text-gray-600 mb-4">
                We provide detailed information about every Pokémon, including
                their stats, abilities, types, and evolution chains. Our goal is
                to be your one-stop resource for all Pokémon knowledge.
              </p>
              <Link
                href="/"
                className="inline-block px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-semibold"
              >
                Explore
              </Link>
            </div>

            {/* Mission Card 2 */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 mb-4 flex items-center justify-center">
                <Image
                  src="/globe.svg"
                  alt="Beautiful Design"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Beautiful Design
              </h3>
              <p className="text-gray-600 mb-4">
                We believe that great data deserves a great presentation. Our
                minimalist and modern design makes exploring Pokémon information
                a delightful experience.
              </p>
              <Link
                href="/"
                className="inline-block px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-semibold"
              >
                Explore
              </Link>
            </div>

            {/* Mission Card 3 */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 mb-4 flex items-center justify-center">
                <Image
                  src="/window.svg"
                  alt="Always Improving"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Always Improving
              </h3>
              <p className="text-gray-600 mb-4">
                We&apos;re constantly working to improve PokéDex with new features,
                better performance, and more comprehensive data. Your feedback
                helps us grow.
              </p>
              <Link
                href="/contactUs"
                className="inline-block px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-semibold"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
