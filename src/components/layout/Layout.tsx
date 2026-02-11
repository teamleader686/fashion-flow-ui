import Header from "./Header";
import MobileBottomNav from "./MobileBottomNav";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      <MobileBottomNav />
    </div>
  );
};

export default Layout;
