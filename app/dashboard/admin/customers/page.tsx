"use client";

import AdminModal from "@/app/components/admin/AdminModal";
import TableCard from "@/app/components/admin/TableCard";

export default function CustomersPage() {
  const openModal = () => {
    const modal = document.getElementById("add_service_modal") as HTMLDialogElement;
    modal?.showModal();
  };

  return (
    <>
    <TableCard title="Customer Directory" actions={<button className="btn btn-primary btn-sm" onClick={openModal}>+ New Service</button>}>
      <thead>
        <tr>
          <th>Name</th>
          <th>Phone</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>John Doe</td>
          <td>017490...</td>
          <td><span className="badge badge-success">Active</span></td>
        </tr>
      </tbody>
    </TableCard>


    {/* The Modal */}
    <AdminModal id="add_service_modal" title="Add New Customer" actionLabel="Save Customer">
      <div className="space-y-4">
        <div className="form-control w-full">
          <label className="label"><span className="label-text">Customer Name</span></label>
          <input type="text" placeholder="Type here" className="input input-bordered w-full" />
        </div>

        <div className="form-control w-full">
          <label className="label"><span className="label-text">Customer Code</span></label>
          <input type="text" placeholder="e.g. abc-234" className="input input-bordered w-full" />
        </div>

        <div className="form-control w-full">
          <label className="label"><span className="label-text">Customer email</span></label>
          <input type="text" placeholder="e.g. name@example.com" className="input input-bordered w-full" />
        </div>

         <div className="form-control w-full">
          <label className="label"><span className="label-text">Customer phone No</span></label>
          <input type="text" placeholder="e.g. 01.." className="input input-bordered w-full" />
        </div>

      </div>
    </AdminModal>
    </>
  );
}