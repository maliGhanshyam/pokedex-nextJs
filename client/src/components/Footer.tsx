const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-4">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center px-6">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Pokédex. All rights reserved.
        </p>
        <div className="text-sm mt-2 md:mt-0">
          <span className="mr-4">Built with ❤️ Team MoGha ❤️</span>
          <a
            href="https://pokeapi.co"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-yellow-400 transition"
          >
            Powered by PokéAPI
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
