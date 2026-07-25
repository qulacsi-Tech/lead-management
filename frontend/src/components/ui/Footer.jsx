export default function Footer({ brand = 'Next Move' }) {
  return (
    <footer className="w-full bg-surface-container border-t border-outline-variant px-10 py-6 flex flex-col md:flex-row justify-between items-center gap-3 text-on-surface-variant">
      <div className="flex items-center gap-2">
        <span className="font-bold text-on-surface text-sm">{brand}</span>
        <p className="text-xs m-0">© 2026 Nexus Intellect EdTech. All rights reserved.</p>
      </div>
      <div className="flex gap-6 text-xs">
        <a href="#" className="hover:text-primary">Privacy Policy</a>
        <a href="#" className="hover:text-primary">Terms of Service</a>
        <a href="#" className="hover:text-primary">Help Center</a>
        <a href="#" className="hover:text-primary">Contact Support</a>
      </div>
    </footer>
  );
}
