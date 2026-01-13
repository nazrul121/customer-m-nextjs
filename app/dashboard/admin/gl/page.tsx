import { Metadata } from "next";
import GLCrud from "./components";

export const metadata: Metadata = {
  title: 'General Ledger',
  description: 'Manage application users and roles.',
};

export default function GLPage() {
    return (
        <div>
           <GLCrud />
        </div>
    );
}