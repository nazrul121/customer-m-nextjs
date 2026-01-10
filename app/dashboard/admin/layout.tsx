
import Header from "@/app/components/admin/Header";
import SideBar from "@/app/components/admin/Sidebar";
import "../../globals.css";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="drawer lg:drawer-open">
      <input id="admin-drawer" type="checkbox" className="drawer-toggle" />
      
      <div className="drawer-content flex flex-col bg-base-200 min-h-screen">
        <Header />
        <main className="p-1 md:p-2 flex-grow dark:border-l dark:border-gray-700">
          {children}
        </main>
        
        <footer className="footer footer-center p-4 bg-base-100 text-base-content border-t border-base-300">
          <aside><p>© 2025 - Micro Datasoft Billing System</p></aside>
        </footer>
      </div>

      {/* FIX: Changed drawer-sid to drawer-side and added z-index */}
      <div className="drawer-side z-40"> 
        <label htmlFor="admin-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
        <SideBar />
      </div>
    </div>
  );
}