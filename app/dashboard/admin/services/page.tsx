// app/admin/services/page.tsx
"use client";

import AdminModal from "@/app/components/admin/AdminModal";
import TableCard from "@/app/components/admin/TableCard";

export default function ServicesPage() {
  const openModal = () => {
    const modal = document.getElementById("add_service_modal") as HTMLDialogElement;
    modal?.showModal();
  };

  return (
    <div className="space-y-6">
      <TableCard title="Available Services" 
        actions={<button className="btn btn-primary btn-sm" onClick={openModal}>+ New Service</button>}
      >
        <thead>
          <tr>
            <th>Service Name</th>
            <th>Monthly Fee</th>
            <th>Type</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Standard Internet</td>
            <td>500 BDT</td>
            <td>Broadband</td>
            <td><button className="btn btn-ghost btn-xs text-primary">Edit</button></td>
          </tr>
        </tbody>
      </TableCard>

      {/* The Modal */}
      <AdminModal id="add_service_modal" title="Add New Service" actionLabel="Save Service">
        <div className="space-y-4">
          <div className="form-control w-full">
            <label className="label"><span className="label-text">Service Name</span></label>
            <input type="text" placeholder="e.g. Premium WiFi" className="input input-bordered w-full" />
          </div>

          <div className="form-control w-full">
            <label className="label"><span className="label-text">Service Category</span></label>
            <select className="select select-bordered w-full">
              <option disabled selected>Select Category</option>
              <option>Broadband</option>
              <option>Cable TV</option>
            </select>
          </div>

          <div className="form-control w-full">
            <label className="label"><span className="label-text">Monthly Charge (BDT)</span></label>
            <input type="number" placeholder="0.00" className="input input-bordered w-full" />
          </div>
        </div>
      </AdminModal>
    </div>
  );
}