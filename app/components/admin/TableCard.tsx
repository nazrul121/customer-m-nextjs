// components/admin/TableCard.tsx
export default function TableCard({ title, children, actions }: { title: string, children: React.ReactNode, actions?: React.ReactNode }) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">
      <div className="p-6 border-b border-base-300 flex justify-between items-center">
        <h2 className="card-title text-lg">{title}</h2>
        <div>{actions}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          {children}
        </table>
      </div>
    </div>
  );
}